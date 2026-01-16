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

    // Actions
    fetchRecommendations: () => Promise<void>;
    addComment: (recommendationId: string, text: string) => Promise<boolean>;
    addRating: (recommendationId: string, rating: number) => Promise<boolean>;
    subscribeToRealtime: () => () => void;
    clearRecommendations: () => void;
}

export const useRecommendationStore = create<RecommendationState>((set, get) => ({
    sent: [],
    received: [],
    isLoading: false,
    error: null,
    unreadCount: 0,

    fetchRecommendations: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });

        try {
            // Fetch sent recommendations
            const { data: sentData, error: sentError } = await supabase
                .from("recommendations")
                .select(`
          *,
          receiver:profiles!recommendations_receiver_id_fkey(user_id, username, avatar_url, points),
          comments:recommendation_comments(*),
          rating:ratings(*)
        `)
                .eq("sender_id", user.id)
                .order("created_at", { ascending: false });

            // Fetch received recommendations
            const { data: receivedData, error: receivedError } = await supabase
                .from("recommendations")
                .select(`
          *,
          sender:profiles!recommendations_sender_id_fkey(user_id, username, avatar_url, points),
          comments:recommendation_comments(*),
          rating:ratings(*)
        `)
                .eq("receiver_id", user.id)
                .order("created_at", { ascending: false });

            if (sentError) throw sentError;
            if (receivedError) throw receivedError;

            const processRecommendations = (data: any[]): EnrichedRecommendation[] => {
                return data.map((rec) => ({
                    ...rec,
                    comments: rec.comments || [],
                    rating: Array.isArray(rec.rating) ? rec.rating[0] : rec.rating,
                }));
            };

            set({
                sent: processRecommendations(sentData || []),
                received: processRecommendations(receivedData || []),
                isLoading: false,
                unreadCount: (receivedData || []).filter((r: any) => !r.rating).length,
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

            // Update local state
            set((state) => {
                const updateComments = (recs: EnrichedRecommendation[]) =>
                    recs.map((rec) =>
                        rec.id === recommendationId
                            ? { ...rec, comments: [...rec.comments, data] }
                            : rec
                    );

                return {
                    sent: updateComments(state.sent),
                    received: updateComments(state.received),
                };
            });

            return true;
        } catch (err) {
            console.error("Error adding comment:", err);
            return false;
        }
    },

    addRating: async (recommendationId: string, rating: number) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        try {
            const { data, error } = await supabase
                .from("ratings")
                .insert({
                    recommendation_id: recommendationId,
                    rating,
                })
                .select()
                .single();

            if (error) throw error;

            // Update local state
            set((state) => {
                const updateRating = (recs: EnrichedRecommendation[]) =>
                    recs.map((rec) =>
                        rec.id === recommendationId ? { ...rec, rating: data } : rec
                    );

                return {
                    sent: updateRating(state.sent),
                    received: updateRating(state.received),
                    unreadCount: Math.max(0, state.unreadCount - 1),
                };
            });

            return true;
        } catch (err) {
            console.error("Error adding rating:", err);
            return false;
        }
    },

    subscribeToRealtime: () => {
        const user = useAuthStore.getState().user;
        if (!user) return () => { };

        // Subscribe to new comments
        const commentsChannel = supabase
            .channel("comments-changes")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "recommendation_comments",
                },
                (payload) => {
                    const newComment = payload.new as RecommendationComment;
                    set((state) => {
                        const updateComments = (recs: EnrichedRecommendation[]) =>
                            recs.map((rec) =>
                                rec.id === newComment.recommendation_id
                                    ? { ...rec, comments: [...rec.comments, newComment] }
                                    : rec
                            );

                        return {
                            sent: updateComments(state.sent),
                            received: updateComments(state.received),
                        };
                    });
                }
            )
            .subscribe();

        // Subscribe to new recommendations
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
                    // Refresh all recommendations when a new one arrives
                    get().fetchRecommendations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(commentsChannel);
            supabase.removeChannel(recommendationsChannel);
        };
    },

    clearRecommendations: () => {
        set({ sent: [], received: [], isLoading: false, error: null, unreadCount: 0 });
    },
}));
