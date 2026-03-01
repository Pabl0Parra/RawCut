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

        const chain: Record<string, any> = {
            // select().or() — fetchFollowData
            select: jest.fn().mockReturnValue({
                or: jest.fn().mockResolvedValue(mockReturn),
            }),

            // insert() — follow
            insert: jest.fn().mockResolvedValue(mockReturn),

            // delete().eq().eq() — unfollow, declineRequest
            delete: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(mockReturn),
                }),
            }),

            // update().eq().eq() — acceptRequest
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue(mockReturn),
                }),
            }),
        };

        mockSupabase.from.mockReturnValue(chain);
        return chain;
    };

    beforeEach(() => {
        jest.clearAllMocks();
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
            const allRows = [
                // user123 follows u2 (accepted) → following
                { id: "f1", follower_id: "user123", following_id: "u2", status: "accepted", created_at: "", follower: { user_id: "user123" }, following: { user_id: "u2" } },
                // u3 follows user123 (accepted) → followers
                { id: "f2", follower_id: "u3", following_id: "user123", status: "accepted", created_at: "", follower: { user_id: "u3" }, following: { user_id: "user123" } },
                // u4 requests to follow user123 (pending) → pendingIncoming
                { id: "f3", follower_id: "u4", following_id: "user123", status: "pending", created_at: "", follower: { user_id: "u4" }, following: { user_id: "user123" } },
                // user123 requested to follow u5 (pending) → pendingOutgoingIds
                { id: "f4", follower_id: "user123", following_id: "u5", status: "pending", created_at: "", follower: { user_id: "user123" }, following: { user_id: "u5" } },
            ];

            createMockQueryChain(allRows);

            await act(async () => {
                await useSocialStore.getState().fetchFollowData({ force: true });
            });

            const state = useSocialStore.getState();
            expect(state.following).toHaveLength(1);
            expect(state.followers).toHaveLength(1);
            expect(state.pendingIncoming).toHaveLength(1);
            expect(state.pendingOutgoingIds.has("u5")).toBe(true);
            expect(state.lastFetched).toBeGreaterThan(0);
        });
    });

    describe("follow action", () => {
        it("optimistically adds to pendingOutgoingIds and calls Supabase", async () => {
            createMockQueryChain(null);

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
            createMockQueryChain(null, true);

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
            act(() => {
                useSocialStore.setState({
                    following: [{ user_id: "target123", username: "target" }] as any,
                });
            });

            createMockQueryChain(null);

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

            createMockQueryChain(null, true);

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

            createMockQueryChain(null);

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

            createMockQueryChain(null);

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