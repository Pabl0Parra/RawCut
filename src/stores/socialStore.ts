import { create } from "zustand";
import { supabase, type Profile, type Follow } from "../lib/supabase";
import { useAuthStore } from "./authStore";

export interface FollowWithProfile extends Follow {
    profile?: Profile;
}

interface SocialState {
    following: Profile[];          // Accepted follows (people I follow)
    followers: Profile[];          // Accepted followers (people following me)
    pendingIncoming: FollowWithProfile[]; // Requests waiting for MY approval
    pendingOutgoingIds: Set<string>;     // User IDs I sent requests to (not yet accepted)
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null;

    // Actions
    fetchFollowData: (options?: { force?: boolean }) => Promise<void>;
    follow: (targetUserId: string) => Promise<boolean>;
    unfollow: (targetUserId: string) => Promise<boolean>;
    acceptRequest: (followId: string, followerUserId: string) => Promise<boolean>;
    declineRequest: (followId: string) => Promise<boolean>;
    getFollowStatus: (targetUserId: string) => "none" | "pending" | "accepted";
    clearSocial: () => void;
}

const CACHE_TTL_MS = 60_000; // 1 minute

export const useSocialStore = create<SocialState>((set, get) => ({
    following: [],
    followers: [],
    pendingIncoming: [],
    pendingOutgoingIds: new Set(),
    isLoading: false,
    error: null,
    lastFetched: null,

    fetchFollowData: async (options = {}) => {
        const { force = false } = options;
        const user = useAuthStore.getState().user;
        if (!user) return;

        const { lastFetched } = get();
        if (!force && lastFetched && Date.now() - lastFetched < CACHE_TTL_MS) {
            return;
        }

        set({ isLoading: true, error: null });

        try {
            // Fetch all follow rows where I'm involved
            const { data, error } = await supabase
                .from("follows")
                .select(`
                    *,
                    follower:profiles!follows_follower_id_fkey(user_id, username, display_name, avatar_url, points),
                    following:profiles!follows_following_id_fkey(user_id, username, display_name, avatar_url, points)
                `)
                .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

            if (error) throw error;

            const rows = (data ?? []) as any[];

            const following: Profile[] = [];
            const followers: Profile[] = [];
            const pendingIncoming: FollowWithProfile[] = [];
            const pendingOutgoingIds = new Set<string>();

            for (const row of rows) {
                const iAmFollower = row.follower_id === user.id;
                const iAmFollowing = row.following_id === user.id;

                if (iAmFollower) {
                    if (row.status === "accepted") {
                        following.push(row.following as Profile);
                    } else if (row.status === "pending") {
                        pendingOutgoingIds.add(row.following_id);
                    }
                }

                if (iAmFollowing) {
                    if (row.status === "accepted") {
                        followers.push(row.follower as Profile);
                    } else if (row.status === "pending") {
                        pendingIncoming.push({
                            id: row.id,
                            follower_id: row.follower_id,
                            following_id: row.following_id,
                            status: row.status,
                            created_at: row.created_at,
                            profile: row.follower as Profile,
                        });
                    }
                }
            }

            set({
                following,
                followers,
                pendingIncoming,
                pendingOutgoingIds,
                isLoading: false,
                lastFetched: Date.now(),
            });
        } catch (err) {
            console.error("[socialStore] fetchFollowData error:", err);
            set({ isLoading: false, error: "Error al cargar conexiones" });
        }
    },

    follow: async (targetUserId: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        try {
            const { error } = await supabase
                .from("follows")
                .insert({
                    follower_id: user.id,
                    following_id: targetUserId,
                    status: "pending",
                });

            if (error) throw error;

            // Optimistic update
            set((state) => ({
                pendingOutgoingIds: new Set([...state.pendingOutgoingIds, targetUserId]),
            }));

            return true;
        } catch (err) {
            console.error("[socialStore] follow error:", err);
            return false;
        }
    },

    unfollow: async (targetUserId: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        try {
            const { error } = await supabase
                .from("follows")
                .delete()
                .eq("follower_id", user.id)
                .eq("following_id", targetUserId);

            if (error) throw error;

            // Optimistic update
            set((state) => {
                const newPendingOutgoing = new Set(state.pendingOutgoingIds);
                newPendingOutgoing.delete(targetUserId);
                return {
                    following: state.following.filter((p) => p.user_id !== targetUserId),
                    pendingOutgoingIds: newPendingOutgoing,
                };
            });

            return true;
        } catch (err) {
            console.error("[socialStore] unfollow error:", err);
            return false;
        }
    },

    acceptRequest: async (followId: string, followerUserId: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        try {
            const { error } = await supabase
                .from("follows")
                .update({ status: "accepted" })
                .eq("id", followId)
                .eq("following_id", user.id);

            if (error) throw error;

            // Optimistic update: move from pendingIncoming → followers
            set((state) => {
                const accepted = state.pendingIncoming.find((f) => f.id === followId);
                const newFollowers = accepted?.profile
                    ? [...state.followers, accepted.profile]
                    : state.followers;
                return {
                    pendingIncoming: state.pendingIncoming.filter((f) => f.id !== followId),
                    followers: newFollowers,
                };
            });

            return true;
        } catch (err) {
            console.error("[socialStore] acceptRequest error:", err);
            return false;
        }
    },

    declineRequest: async (followId: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        try {
            const { error } = await supabase
                .from("follows")
                .delete()
                .eq("id", followId)
                .eq("following_id", user.id);

            if (error) throw error;

            set((state) => ({
                pendingIncoming: state.pendingIncoming.filter((f) => f.id !== followId),
            }));

            return true;
        } catch (err) {
            console.error("[socialStore] declineRequest error:", err);
            return false;
        }
    },

    getFollowStatus: (targetUserId: string) => {
        const { following, pendingOutgoingIds } = get();
        if (following.some((p) => p.user_id === targetUserId)) return "accepted";
        if (pendingOutgoingIds.has(targetUserId)) return "pending";
        return "none";
    },

    clearSocial: () => {
        set({
            following: [],
            followers: [],
            pendingIncoming: [],
            pendingOutgoingIds: new Set(),
            isLoading: false,
            error: null,
            lastFetched: null,
        });
    },
}));
