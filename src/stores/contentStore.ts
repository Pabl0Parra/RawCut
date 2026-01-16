import { create } from "zustand";
import { supabase, UserContent } from "../lib/supabase";
import { useAuthStore } from "./authStore";

interface ContentState {
    favorites: UserContent[];
    watchlist: UserContent[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchUserContent: () => Promise<void>;
    addToFavorites: (tmdbId: number, mediaType: "movie" | "tv") => Promise<boolean>;
    removeFromFavorites: (tmdbId: number, mediaType: "movie" | "tv") => Promise<boolean>;
    addToWatchlist: (tmdbId: number, mediaType: "movie" | "tv") => Promise<boolean>;
    removeFromWatchlist: (tmdbId: number, mediaType: "movie" | "tv") => Promise<boolean>;
    isFavorite: (tmdbId: number, mediaType: "movie" | "tv") => boolean;
    isInWatchlist: (tmdbId: number, mediaType: "movie" | "tv") => boolean;
    clearContent: () => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
    favorites: [],
    watchlist: [],
    isLoading: false,
    error: null,

    fetchUserContent: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        set({ isLoading: true, error: null });

        try {
            const { data, error } = await supabase
                .from("user_content")
                .select("*")
                .eq("user_id", user.id);

            if (error) throw error;

            const favorites = data?.filter((item: UserContent) => item.list_type === "favorite") || [];
            const watchlist = data?.filter((item: UserContent) => item.list_type === "watchlist") || [];

            set({ favorites, watchlist, isLoading: false });
        } catch (err) {
            set({ isLoading: false, error: "Error al cargar contenido" });
        }
    },

    addToFavorites: async (tmdbId: number, mediaType: "movie" | "tv") => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        try {
            const { data, error } = await supabase.from("user_content").insert({
                user_id: user.id,
                tmdb_id: tmdbId,
                media_type: mediaType,
                list_type: "favorite",
            }).select().single();

            if (error) throw error;

            set((state) => ({
                favorites: [...state.favorites, data],
            }));
            return true;
        } catch (err) {
            console.error("Error adding to favorites:", err);
            return false;
        }
    },

    removeFromFavorites: async (tmdbId: number, mediaType: "movie" | "tv") => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        try {
            const { error } = await supabase
                .from("user_content")
                .delete()
                .eq("user_id", user.id)
                .eq("tmdb_id", tmdbId)
                .eq("media_type", mediaType)
                .eq("list_type", "favorite");

            if (error) throw error;

            set((state) => ({
                favorites: state.favorites.filter(
                    (item) => !(item.tmdb_id === tmdbId && item.media_type === mediaType)
                ),
            }));
            return true;
        } catch (err) {
            console.error("Error removing from favorites:", err);
            return false;
        }
    },

    addToWatchlist: async (tmdbId: number, mediaType: "movie" | "tv") => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        try {
            const { data, error } = await supabase.from("user_content").insert({
                user_id: user.id,
                tmdb_id: tmdbId,
                media_type: mediaType,
                list_type: "watchlist",
            }).select().single();

            if (error) throw error;

            set((state) => ({
                watchlist: [...state.watchlist, data],
            }));
            return true;
        } catch (err) {
            console.error("Error adding to watchlist:", err);
            return false;
        }
    },

    removeFromWatchlist: async (tmdbId: number, mediaType: "movie" | "tv") => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        try {
            const { error } = await supabase
                .from("user_content")
                .delete()
                .eq("user_id", user.id)
                .eq("tmdb_id", tmdbId)
                .eq("media_type", mediaType)
                .eq("list_type", "watchlist");

            if (error) throw error;

            set((state) => ({
                watchlist: state.watchlist.filter(
                    (item) => !(item.tmdb_id === tmdbId && item.media_type === mediaType)
                ),
            }));
            return true;
        } catch (err) {
            console.error("Error removing from watchlist:", err);
            return false;
        }
    },

    isFavorite: (tmdbId: number, mediaType: "movie" | "tv") => {
        return get().favorites.some(
            (item) => item.tmdb_id === tmdbId && item.media_type === mediaType
        );
    },

    isInWatchlist: (tmdbId: number, mediaType: "movie" | "tv") => {
        return get().watchlist.some(
            (item) => item.tmdb_id === tmdbId && item.media_type === mediaType
        );
    },

    clearContent: () => {
        set({ favorites: [], watchlist: [], isLoading: false, error: null });
    },
}));
