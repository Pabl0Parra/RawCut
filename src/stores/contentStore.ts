import { create } from "zustand";
import { supabase, UserContent } from "../lib/supabase";
import { useAuthStore } from "./authStore";

export interface TVProgress {
    id: string;
    user_id: string;
    tmdb_id: number;
    season_number: number;
    episode_number: number;
    watched_at: string;
}

interface ContentState {
    favorites: UserContent[];
    watchlist: UserContent[];
    tvProgress: TVProgress[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchUserContent: () => Promise<void>;
    fetchTVProgress: () => Promise<void>;
    addToFavorites: (tmdbId: number, mediaType: "movie" | "tv") => Promise<boolean>;
    removeFromFavorites: (tmdbId: number, mediaType: "movie" | "tv") => Promise<boolean>;
    addToWatchlist: (tmdbId: number, mediaType: "movie" | "tv") => Promise<boolean>;
    removeFromWatchlist: (tmdbId: number, mediaType: "movie" | "tv") => Promise<boolean>;
    toggleEpisodeWatched: (tmdbId: number, seasonNumber: number, episodeNumber: number) => Promise<boolean>;
    toggleWatched: (tmdbId: number, mediaType: "movie" | "tv") => Promise<boolean>;
    isFavorite: (tmdbId: number, mediaType: "movie" | "tv") => boolean;
    isInWatchlist: (tmdbId: number, mediaType: "movie" | "tv") => boolean;
    isWatched: (tmdbId: number, mediaType: "movie" | "tv") => boolean;
    isEpisodeWatched: (tmdbId: number, seasonNumber: number, episodeNumber: number) => boolean;
    isSeasonWatched: (tmdbId: number, seasonNumber: number, totalEpisodes: number) => boolean;
    getNextEpisodeToWatch: (tmdbId: number, seasons: { season_number: number; episode_count: number }[]) => { season: number; episode: number } | null;
    getShowProgress: (tmdbId: number) => { watched: number; total: number } | null;
    clearContent: () => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
    favorites: [],
    watchlist: [],
    tvProgress: [],
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
            console.error("Error al cargar contenido:", err);
            set({ isLoading: false, error: "Error al cargar contenido" });
        }
    },

    fetchTVProgress: async () => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from("tv_progress")
                .select("*")
                .eq("user_id", user.id);

            if (error) throw error;

            set({ tvProgress: data || [] });
        } catch (err) {
            console.error("Error fetching TV progress:", err);
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

    toggleEpisodeWatched: async (tmdbId: number, seasonNumber: number, episodeNumber: number) => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        const isWatched = get().isEpisodeWatched(tmdbId, seasonNumber, episodeNumber);

        try {
            if (isWatched) {
                const { error } = await supabase
                    .from("tv_progress")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("tmdb_id", tmdbId)
                    .eq("season_number", seasonNumber)
                    .eq("episode_number", episodeNumber);

                if (error) throw error;

                set((state) => ({
                    tvProgress: state.tvProgress.filter(
                        (item) =>
                            !(
                                item.tmdb_id === tmdbId &&
                                item.season_number === seasonNumber &&
                                item.episode_number === episodeNumber
                            )
                    ),
                }));
            } else {
                const { data, error } = await supabase
                    .from("tv_progress")
                    .insert({
                        user_id: user.id,
                        tmdb_id: tmdbId,
                        season_number: seasonNumber,
                        episode_number: episodeNumber,
                    })
                    .select()
                    .single();

                if (error) throw error;

                set((state) => ({
                    tvProgress: [...state.tvProgress, data],
                }));
            }
            return true;
        } catch (err) {
            console.error("Error toggling episode watched:", err);
            return false;
        }
    },

    toggleWatched: async (tmdbId: number, mediaType: "movie" | "tv") => {
        const user = useAuthStore.getState().user;
        if (!user) return false;

        const season = mediaType === "movie" ? 0 : -1;
        const episode = mediaType === "movie" ? 0 : -1;
        const isWatched = get().isWatched(tmdbId, mediaType);

        try {
            if (isWatched) {
                const { error } = await supabase
                    .from("tv_progress")
                    .delete()
                    .eq("user_id", user.id)
                    .eq("tmdb_id", tmdbId)
                    .eq("season_number", season)
                    .eq("episode_number", episode);

                if (error) throw error;

                set((state) => ({
                    tvProgress: state.tvProgress.filter(
                        (item) =>
                            !(
                                item.tmdb_id === tmdbId &&
                                item.season_number === season &&
                                item.episode_number === episode
                            )
                    ),
                }));
            } else {
                const { data, error } = await supabase
                    .from("tv_progress")
                    .insert({
                        user_id: user.id,
                        tmdb_id: tmdbId,
                        season_number: season,
                        episode_number: episode,
                    })
                    .select()
                    .single();

                if (error) throw error;

                set((state) => ({
                    tvProgress: [...state.tvProgress, data],
                }));
            }
            return true;
        } catch (err) {
            console.error("Error toggling watched status:", err);
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

    isWatched: (tmdbId: number, mediaType: "movie" | "tv") => {
        const season = mediaType === "movie" ? 0 : -1;
        const episode = mediaType === "movie" ? 0 : -1;
        return get().tvProgress.some(
            (item) =>
                item.tmdb_id === tmdbId &&
                item.season_number === season &&
                item.episode_number === episode
        );
    },

    isEpisodeWatched: (tmdbId: number, seasonNumber: number, episodeNumber: number) => {
        return get().tvProgress.some(
            (item) =>
                item.tmdb_id === tmdbId &&
                item.season_number === seasonNumber &&
                item.episode_number === episodeNumber
        );
    },

    isSeasonWatched: (tmdbId: number, seasonNumber: number, totalEpisodes: number) => {
        const watchedInSeason = get().tvProgress.filter(
            (p) => p.tmdb_id === tmdbId && p.season_number === seasonNumber
        ).length;
        return watchedInSeason >= totalEpisodes && totalEpisodes > 0;
    },

    getNextEpisodeToWatch: (tmdbId: number, seasons: { season_number: number; episode_count: number }[]) => {
        const watched = get().tvProgress.filter((p) => p.tmdb_id === tmdbId);
        if (watched.length === 0) {
            // If nothing watched, next is S1 E1 (or the first season available)
            const firstSeason = seasons.find(s => s.season_number > 0) || seasons[0];
            return firstSeason ? { season: firstSeason.season_number, episode: 1 } : null;
        }

        // Sort watched by season and episode
        const sortedWatched = [...watched].sort((a, b) => {
            if (a.season_number !== b.season_number) return a.season_number - b.season_number;
            return a.episode_number - b.episode_number;
        });

        const lastWatched = sortedWatched[sortedWatched.length - 1];
        const currentSeason = seasons.find(s => s.season_number === lastWatched.season_number);

        if (currentSeason && lastWatched.episode_number < currentSeason.episode_count) {
            // Next episode in the same season
            return { season: lastWatched.season_number, episode: lastWatched.episode_number + 1 };
        } else {
            // Next episode in the next season
            const nextSeason = seasons
                .filter(s => s.season_number > lastWatched.season_number)
                .sort((a, b) => a.season_number - b.season_number)[0];

            return nextSeason ? { season: nextSeason.season_number, episode: 1 } : null;
        }
    },

    getShowProgress: (tmdbId: number) => {
        const showEpisodes = get().tvProgress.filter((item) => item.tmdb_id === tmdbId);
        if (showEpisodes.length === 0) return null;
        return {
            watched: showEpisodes.length,
            total: 0, // Should be updated with real total from TMDB if needed
        };
    },

    clearContent: () => {
        set({ favorites: [], watchlist: [], tvProgress: [], isLoading: false, error: null });
    },
}));
