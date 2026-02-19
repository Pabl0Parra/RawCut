import { create } from "zustand";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "./authStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunityScore {
    avg: number;
    count: number;
}

interface VoteState {
    /** User's own votes: key = `{tmdb_id}:{media_type}` */
    userVotes: Record<string, number>;
    /** Aggregated community scores: same key format */
    communityScores: Record<string, CommunityScore>;

    // Actions
    submitVote: (tmdbId: number, mediaType: "movie" | "tv", vote: number) => Promise<void>;
    fetchVotes: (tmdbIds: number[], mediaType: "movie" | "tv") => Promise<void>;
    getUserVote: (tmdbId: number, mediaType: "movie" | "tv") => number | undefined;
    getCommunityScore: (tmdbId: number, mediaType: "movie" | "tv") => CommunityScore | undefined;
}

// ─── Key helper ───────────────────────────────────────────────────────────────

const key = (tmdbId: number, mediaType: "movie" | "tv") => `${tmdbId}:${mediaType}`;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useVoteStore = create<VoteState>((set, get) => ({
    userVotes: {},
    communityScores: {},

    getUserVote: (tmdbId, mediaType) => get().userVotes[key(tmdbId, mediaType)],

    getCommunityScore: (tmdbId, mediaType) => get().communityScores[key(tmdbId, mediaType)],

    submitVote: async (tmdbId, mediaType, vote) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        // Optimistic update
        const k = key(tmdbId, mediaType);
        set((s) => ({ userVotes: { ...s.userVotes, [k]: vote } }));

        const { error } = await supabase.from("content_votes").upsert(
            {
                user_id: user.id,
                tmdb_id: tmdbId,
                media_type: mediaType,
                vote,
            },
            { onConflict: "user_id,tmdb_id,media_type" },
        );

        if (error) {
            console.warn("[voteStore] submitVote error:", error.message);
        }

        // Refresh the community aggregate for this item
        await get().fetchVotes([tmdbId], mediaType);
    },

    fetchVotes: async (tmdbIds, mediaType) => {
        if (tmdbIds.length === 0) return;

        const user = useAuthStore.getState().user;

        // ── Community averages (no auth needed) ──────────────────────────────
        const { data: allVotes, error: avgErr } = await supabase
            .from("content_votes")
            .select("tmdb_id, vote")
            .eq("media_type", mediaType)
            .in("tmdb_id", tmdbIds);

        if (!avgErr && allVotes) {
            const scoreMap: Record<string, CommunityScore> = {};

            for (const row of allVotes) {
                const k = key(row.tmdb_id, mediaType);
                if (!scoreMap[k]) scoreMap[k] = { avg: 0, count: 0 };
                scoreMap[k].count += 1;
                scoreMap[k].avg += row.vote;
            }
            // Finalise averages
            for (const k of Object.keys(scoreMap)) {
                scoreMap[k].avg = Math.round((scoreMap[k].avg / scoreMap[k].count) * 10) / 10;
            }

            set((s) => ({
                communityScores: { ...s.communityScores, ...scoreMap },
            }));
        }

        // ── User's own votes ─────────────────────────────────────────────────
        if (!user) return;

        const { data: myVotes, error: myErr } = await supabase
            .from("content_votes")
            .select("tmdb_id, vote")
            .eq("user_id", user.id)
            .eq("media_type", mediaType)
            .in("tmdb_id", tmdbIds);

        if (!myErr && myVotes) {
            const voteMap: Record<string, number> = {};
            for (const row of myVotes) {
                voteMap[key(row.tmdb_id, mediaType)] = row.vote;
            }
            set((s) => ({ userVotes: { ...s.userVotes, ...voteMap } }));
        }
    },
}));
