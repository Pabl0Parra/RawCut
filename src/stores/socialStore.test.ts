import { renderHook, act } from "@testing-library/react-native";
import { useSocialStore } from "./socialStore";
import { useAuthStore } from "./authStore";
import { supabase } from "../lib/supabase";

// Mock Supabase client
jest.mock("../lib/supabase", () => ({
    supabase: {
        from: jest.fn(),
    },
}));

// Mock Auth Store
jest.mock("./authStore", () => ({
    useAuthStore: {
        getState: jest.fn(),
    },
}));

const mockSupabase = supabase as any;
const mockAuthStore = useAuthStore.getState as jest.Mock;

describe("socialStore", () => {
    const mockUser = { id: "user123" };
    
    // Helper to mock Supabase query chains
    const createMockQueryChain = (resolvedValue: any, isError = false) => {
        const mockReturn = isError
            ? { data: null, error: new Error("Supabase Error") }
            : { data: resolvedValue, error: null };
            
        const executeChain = {
            then: jest.fn((resolve) => resolve(mockReturn)),
        };
        
        const chain: Record<string, any> = {
            select: jest.fn().mockReturnValue(executeChain),
            eq: jest.fn().mockReturnValue(executeChain),
            or: jest.fn().mockReturnValue(executeChain),
            insert: jest.fn().mockReturnValue(executeChain),
            update: jest.fn().mockReturnValue(executeChain),
            delete: jest.fn().mockReturnValue(executeChain),
        };

        // Fix chaining for update, delete, and select
        // delete().eq().eq()
        chain.delete.mockReturnValue({
            eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue(executeChain)
            })
        });

        // update().eq().eq()
        chain.update.mockReturnValue({
            eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue(executeChain)
            })
        });

        // select().or()
        chain.select.mockReturnValue({
            or: jest.fn().mockReturnValue(executeChain)
        });

        mockSupabase.from.mockReturnValue(chain);
        return chain;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset store state
        act(() => {
            useSocialStore.getState().clearSocial();
        });
        mockAuthStore.mockReturnValue({ user: mockUser });
    });

    describe("Initial State", () => {
        it("starts with empty data and loading states", () => {
            const state = useSocialStore.getState();
            expect(state.following).toEqual([]);
            expect(state.followers).toEqual([]);
            expect(state.pendingIncoming).toEqual([]);
            expect(state.pendingOutgoingIds).toBeInstanceOf(Set);
            expect(state.pendingOutgoingIds.size).toBe(0);
            expect(state.isLoading).toBe(false);
            expect(state.error).toBeNull();
        });
    });

    describe("fetchFollowData", () => {
        it("returns early if no user is authenticated", async () => {
            mockAuthStore.mockReturnValue({ user: null });
            
            await act(async () => {
                await useSocialStore.getState().fetchFollowData();
            });

            expect(mockSupabase.from).not.toHaveBeenCalled();
        });

        it("fetches following, followers, and pending requests successfully", async () => {
            const mockFollowing = { id: "f1", follower_id: "user123", following_id: "u2", status: "accepted", follower: { user_id: "user123" }, following: { user_id: "u2" } };
            const mockFollowers = { id: "f2", follower_id: "u3", following_id: "user123", status: "accepted", follower: { user_id: "u3" }, following: { user_id: "user123" } };
            const mockIncoming = { id: "f3", follower_id: "u4", following_id: "user123", status: "pending", follower: { user_id: "u4" }, following: { user_id: "user123" } };
            const mockOutgoing = { id: "f4", follower_id: "user123", following_id: "u5", status: "pending", follower: { user_id: "user123" }, following: { user_id: "u5" } };


            // user123 is the current user. They follow u2, they are followed by u3.
            // u4 requests to follow user123. user123 requested to follow u5.
            const allRows = [mockFollowing, mockFollowers, mockIncoming, mockOutgoing];

            // In socialStore, the user is compared against follower_id and following_id to determine role.
            createMockQueryChain(allRows);

            await act(async () => {
                await useSocialStore.getState().fetchFollowData({ force: true });
            });

            const state = useSocialStore.getState();
            // Since mockFollowing has follower_id="u1" and we are "user123", wait!
            // I need to make sure iAmFollower/iAmFollowing matches exactly.
            // mockFollowing: iAmFollower = true -> follower_id="user123"
            // Let's rely on the store's logic directly. The store expects 1 following, 1 follower, 1 incoming, 1 outgoing.
            expect(state.following).toHaveLength(1);
            expect(state.followers).toHaveLength(1);
            expect(state.pendingIncoming).toHaveLength(1);
            expect(state.pendingOutgoingIds.has("u5")).toBe(true);
            expect(state.lastFetched).toBeGreaterThan(0);
        });
    });

    describe("follow action", () => {
        it("optimistically adds to pendingOutgoingIds and calls Supabase", async () => {
            createMockQueryChain(null); // Success insert

            let success = false;
            await act(async () => {
                success = await useSocialStore.getState().follow("target123");
            });

            const state = useSocialStore.getState();
            expect(success).toBe(true);
            expect(state.pendingOutgoingIds.has("target123")).toBe(true);
            expect(mockSupabase.from).toHaveBeenCalledWith("follows");
        });

        it("does not update store on failure", async () => {
            createMockQueryChain(null, true); // Simulate error

            let success = true;
            await act(async () => {
                success = await useSocialStore.getState().follow("target123");
            });

            const state = useSocialStore.getState();
            expect(success).toBe(false);
            expect(state.pendingOutgoingIds.has("target123")).toBe(false);
        });
    });

    describe("unfollow action", () => {
        it("optimistically removes from following list and calls delete", async () => {
            // Setup initial state
            act(() => {
                useSocialStore.setState({
                    following: [{ user_id: "target123", username: "target" }] as any
                });
            });

            createMockQueryChain(null); // Success delete

            let success = false;
            await act(async () => {
                success = await useSocialStore.getState().unfollow("target123");
            });

            const state = useSocialStore.getState();
            expect(success).toBe(true);
            expect(state.following).toEqual([]);
            expect(mockSupabase.from).toHaveBeenCalledWith("follows");
        });

        it("does not update store on failure", async () => {
            const mockFollowing = [{ user_id: "target123", username: "target" }] as any;
            act(() => {
                useSocialStore.setState({ following: [...mockFollowing] });
            });

            createMockQueryChain(null, true); // Simulate error

            let success = true;
            await act(async () => {
                success = await useSocialStore.getState().unfollow("target123");
            });

            const state = useSocialStore.getState();
            expect(success).toBe(false);
            expect(state.following).toHaveLength(1);
            expect(state.following[0].user_id).toBe("target123");
        });
    });

    describe("acceptRequest action", () => {
        it("moves pending request to followers and calls update", async () => {
            const mockPending = { id: "req1", follower_id: "u1", profile: { user_id: "u1" } } as any;
            act(() => {
                useSocialStore.setState({ pendingIncoming: [mockPending] });
            });

            createMockQueryChain(null); // Success update

            let success = false;
            await act(async () => {
                success = await useSocialStore.getState().acceptRequest("req1", "u1");
            });

            const state = useSocialStore.getState();
            expect(success).toBe(true);
            expect(state.pendingIncoming).toEqual([]);
            expect(state.followers).toHaveLength(1);
            expect(state.followers[0].user_id).toBe("u1");
            expect(mockSupabase.from).toHaveBeenCalledWith("follows");
        });
    });

    describe("declineRequest action", () => {
        it("removes request from pendingIncoming and calls delete", async () => {
            const mockPending = { id: "req1", follower_id: "u1", profile: { user_id: "u1" } } as any;
            act(() => {
                useSocialStore.setState({ pendingIncoming: [mockPending] });
            });

            createMockQueryChain(null); // Success delete

            let success = false;
            await act(async () => {
                success = await useSocialStore.getState().declineRequest("req1");
            });

            const state = useSocialStore.getState();
            expect(success).toBe(true);
            expect(state.pendingIncoming).toEqual([]);
            expect(mockSupabase.from).toHaveBeenCalledWith("follows");
        });
    });
});
