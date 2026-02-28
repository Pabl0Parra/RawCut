import { create } from "zustand";
import { supabase, Recommendation, RecommendationComment, Rating, Profile } from "../lib/supabase";
import { useAuthStore } from "./authStore";

interface EnrichedRecommendation extends Recommendation {
    sender?: Profile;
    receiver?: Profile;
    comments: RecommendationComment[];
    rating?: Rating;
    tmdb_title?: string;
    tmdb_poster?: string;
}

interface RecommendationState {
    sent: EnrichedRecommendation[];
    received: EnrichedRecommendation[];
    isLoading: boolean;
    error: string | null;
    unreadCount: number;
    lastFetched: number | null;

    fetchRecommendations: (options?: { force?: boolean }) => Promise<void>;
    addComment: (recommendationId: string, text: string) => Promise<boolean>;
    deleteComment: (recommendationId: string, commentId: string) => Promise<boolean>;
    deleteRecommendation: (recommendationId: string) => Promise<boolean>;
    addRating: (recommendationId: string, rating: number) => Promise<boolean>;
    markAllAsRead: () => Promise<void>;
    markAsRead: (recommendationId: string) => Promise<void>;
    markCommentsAsRead: (recommendationId: string) => Promise<void>;
    subscribeToRealtime: () => () => void;
    clearRecommendations: () => void;
}

const processRecommendations = (data: any[]): EnrichedRecommendation[] => {
    return data.map((rec) => ({
        ...rec,
        comments: rec.comments || [],
        rating: Array.isArray(rec.rating) ? rec.rating[0] : rec.rating,
    }));
};

const addCommentToRecs = (
    recs: EnrichedRecommendation[],
    recommendationId: string,
    newComment: RecommendationComment
): EnrichedRecommendation[] => {
    return recs.map((rec) =>
        rec.id === recommendationId
            ? { ...rec, comments: [...rec.comments, newComment] }
            : rec
    );
};

const applyDeletion = (state: RecommendationState, deletedId: string, userId: string) => {
    const newReceived = state.received.filter((r) => r.id !== deletedId);
    const newSent = state.sent.filter((r) => r.id !== deletedId);
    return {
        sent: newSent,
        received: newReceived,
        unreadCount: calculateUnreadCount(newSent, newReceived, userId),
    };
};

const removeCommentFromRecs = (
    recs: EnrichedRecommendation[],
    recommendationId: string,
    commentId: string
): EnrichedRecommendation[] => {
    return recs.map((rec) =>
        rec.id === recommendationId
            ? { ...rec, comments: rec.comments.filter((c) => c.id !== commentId) }
            : rec
    );
};

const updateRecRating = (
    recs: EnrichedRecommendation[],
    recommendationId: string,
    rating: Rating
): EnrichedRecommendation[] => {
    return recs.map((rec) =>
        rec.id === recommendationId
            ? { ...rec, rating, is_read: true }
            : rec
    );
};

const markComment = (c: RecommendationComment, userId: string): RecommendationComment =>
    c.user_id === userId ? c : { ...c, is_read: true };

const markRecCommentsRead = (
    recs: EnrichedRecommendation[],
    recommendationId: string,
    userId: string
): EnrichedRecommendation[] => {
    return recs.map((rec) =>
        rec.id === recommendationId
            ? { ...rec, comments: rec.comments.map((c) => markComment(c, userId)) }
            : rec
    );
};

const countUnreadComments = (
    recs: EnrichedRecommendation[],
    userId: string
): number => {
    return recs.reduce((total, rec) => {
        return total + rec.comments.filter(c => c.user_id !== userId && !c.is_read).length;
    }, 0);
};

const calculateUnreadCount = (
    sent: EnrichedRecommendation[],
    received: EnrichedRecommendation[],
    userId: string
): number => {
    const receivedUnreadRecs = received.filter(r => !r.is_read).length;
    const unreadCommentsCount = countUnreadComments([...sent, ...received], userId);
    return receivedUnreadRecs + unreadCommentsCount;
};

export const useRecommendationStore = create<RecommendationState>((set, get) => ({
    sent: [],
    received: [],
    isLoading: false,
    error: null,
    unreadCount: 0,
    lastFetched: null,

    fetchRecommendations: async (options = {}) => {
        const { force = false } = options;
        const user = useAuthStore.getState().user;
        if (!user) return;

        const now = Date.now();
        const lastFetched = get().lastFetched;
        if (!force && lastFetched && now - lastFetched < 30000) {
            console.log("[RecommendationStore] Skipping fetch (recently updated)");
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const { data: sentData, error: sentError } = await supabase
                .from("recommendations")
                .select(`
          *,
          receiver:profiles!recommendations_receiver_id_fkey(user_id, username, avatar_url, points),
          comments:recommendation_comments(*),
          rating:ratings(*)
        `)
                .eq("sender_id", user.id)
                .eq("sender_deleted", false)
                .order("created_at", { ascending: false });

            const { data: receivedData, error: receivedError } = await supabase
                .from("recommendations")
                .select(`
          *,
          sender:profiles!recommendations_sender_id_fkey(user_id, username, avatar_url, points),
          comments:recommendation_comments(*),
          rating:ratings(*)
        `)
                .eq("receiver_id", user.id)
                .eq("receiver_deleted", false)
                .order("created_at", { ascending: false });

            if (sentError) throw sentError;
            if (receivedError) throw receivedError;

            const sent = processRecommendations(sentData || []);
            const received = processRecommendations(receivedData || []);

            set({
                sent,
                received,
                isLoading: false,
                unreadCount: calculateUnreadCount(sent, received, user.id),
                lastFetched: Date.now(),
            });
        } catch (err) {
            console.error("Error fetching recommendations:", err);
            set({ isLoading: false, error: "Error al cargar recomendaciones" });
        }
    },

    addComment: async (recommendationId: string, text: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        try {
            const { data, error } = await supabase
                .from("recommendation_comments")
                .insert({
                    recommendation_id: recommendationId,
                    user_id: user.id,
                    text,
                })
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                sent: addCommentToRecs(state.sent, recommendationId, data),
                received: addCommentToRecs(state.received, recommendationId, data),
            }));

            return true;
        } catch (err) {
            console.error("Error adding comment:", err);
            return false;
        }
    },

    deleteComment: async (recommendationId: string, commentId: string) => {
        const user = useAuthStore.getState().user;
        console.log(`[RecommendationStore] Attempting to delete comment: ${commentId} for rec: ${recommendationId}. User: ${user?.id}`);

        try {
            const { error, count, data } = await supabase
                .from("recommendation_comments")
                .delete({ count: 'exact' })
                .eq("id", commentId)
                .select();

            if (error) {
                console.error("[RecommendationStore] DB Delete Comment Error:", error);
                throw error;
            }

            console.log(`[RecommendationStore] Comment Delete Response - Affected rows: ${count}, Data:`, data);

            if (count === 0) {
                console.warn("[RecommendationStore] Delete Comment called but 0 rows affected. RLS or ID mismatch?");
            }

            set((state) => ({
                sent: removeCommentFromRecs(state.sent, recommendationId, commentId),
                received: removeCommentFromRecs(state.received, recommendationId, commentId),
            }));

            return true;
        } catch (err) {
            console.error("[RecommendationStore] Caught error deleting comment:", err);
            return false;
        }
    },

    deleteRecommendation: async (recommendationId: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        console.log(`[RecommendationStore] Soft-deleting recommendation ${recommendationId} for user ${user.id}`);

        try {
            const { data, error } = await supabase
                .rpc("soft_delete_recommendation", { p_recommendation_id: recommendationId });

            if (error) {
                console.error("[RecommendationStore] DB Soft-Delete Error:", error);
                throw error;
            }

            if (!data) {
                console.warn("[RecommendationStore] Soft-delete returned false (not authorized or not found)");
                return false;
            }

            console.log("[RecommendationStore] Successfully soft-deleted from DB:", recommendationId);

            set((state) => {
                const newSent = state.sent.filter((r) => r.id !== recommendationId);
                const newReceived = state.received.filter((r) => r.id !== recommendationId);
                return {
                    sent: newSent,
                    received: newReceived,
                    unreadCount: calculateUnreadCount(newSent, newReceived, user.id),
                };
            });

            return true;
        } catch (err) {
            console.error("[RecommendationStore] Caught error soft-deleting recommendation:", err);
            return false;
        }
    },

    addRating: async (recommendationId: string, rating: number) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        try {
            const { data, error } = await supabase
                .from("ratings")
                .upsert({
                    recommendation_id: recommendationId,
                    rating,
                }, { onConflict: 'recommendation_id' })
                .select()
                .single();

            if (error) throw error;

            await supabase
                .from("recommendations")
                .update({ is_read: true })
                .eq("id", recommendationId);

            set((state) => {
                const newSent = updateRecRating(state.sent, recommendationId, data);
                const newReceived = updateRecRating(state.received, recommendationId, data);
                return {
                    sent: newSent,
                    received: newReceived,
                    unreadCount: calculateUnreadCount(newSent, newReceived, user.id),
                };
            });

            return true;
        } catch (err) {
            console.error("Error adding rating:", err);
            return false;
        }
    },

    markAllAsRead: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
            const { error } = await supabase
                .from("recommendations")
                .update({ is_read: true })
                .eq("receiver_id", user.id)
                .eq("is_read", false);

            if (error) throw error;

            set((state) => {
                const newReceived = state.received.map(r => ({ ...r, is_read: true }));
                return {
                    received: newReceived,
                    unreadCount: calculateUnreadCount(state.sent, newReceived, user.id),
                };
            });
        } catch (err) {
            console.error("Error marking recommendations as read:", err);
        }
    },

    markAsRead: async (recommendationId: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        const rec = get().received.find(r => r.id === recommendationId);
        if (!rec || rec.is_read) return;

        try {
            const { error } = await supabase
                .from("recommendations")
                .update({ is_read: true })
                .eq("id", recommendationId);

            if (error) throw error;

            set((state) => {
                const newReceived = state.received.map(r =>
                    r.id === recommendationId ? { ...r, is_read: true } : r
                );
                return {
                    received: newReceived,
                    unreadCount: calculateUnreadCount(state.sent, newReceived, user.id),
                };
            });
        } catch (err) {
            console.error("Error marking recommendation as read:", err);
        }
    },

    markCommentsAsRead: async (recommendationId: string) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
            const { error } = await supabase
                .from("recommendation_comments")
                .update({ is_read: true })
                .eq("recommendation_id", recommendationId)
                .neq("user_id", user.id)
                .eq("is_read", false);

            if (error) throw error;

            set((state) => {
                const newSent = markRecCommentsRead(state.sent, recommendationId, user.id);
                const newReceived = markRecCommentsRead(state.received, recommendationId, user.id);
                return {
                    sent: newSent,
                    received: newReceived,
                    unreadCount: calculateUnreadCount(newSent, newReceived, user.id),
                };
            });
        } catch (err) {
            console.error("Error marking comments as read:", err);
        }
    },

    subscribeToRealtime: () => {
        const user = useAuthStore.getState().user;
        if (!user) return () => { };

        const handleNewComment = (payload: any) => {
            const newComment = payload.new as RecommendationComment;
            if (newComment.user_id === user.id) return;
            set((state) => {
                const newSent = addCommentToRecs(state.sent, newComment.recommendation_id, newComment);
                const newReceived = addCommentToRecs(state.received, newComment.recommendation_id, newComment);
                return {
                    sent: newSent,
                    received: newReceived,
                    unreadCount: calculateUnreadCount(newSent, newReceived, user.id),
                };
            });
        };

        const handleRecommendationDeleted = (payload: any) => {
    const deletedId = payload.old?.id as string | undefined;
    if (!deletedId) return;
    set((state) => applyDeletion(state, deletedId, user.id));
};

        const commentsChannel = supabase
            .channel("comments-changes")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "recommendation_comments",
                },
                handleNewComment
            )
            .subscribe();

        const recommendationsChannel = supabase
            .channel("recommendations-changes")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "recommendations",
                    filter: `receiver_id=eq.${user.id}`,
                },
                () => {
                    get().fetchRecommendations();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "recommendations",
                },
                handleRecommendationDeleted
            )
            .subscribe();

        return () => {
            supabase.removeChannel(commentsChannel);
            supabase.removeChannel(recommendationsChannel);
        };
    },

    clearRecommendations: () => {
        set({ sent: [], received: [], isLoading: false, error: null, unreadCount: 0, lastFetched: null });
    },
}));