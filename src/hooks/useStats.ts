import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useContentStore } from "../stores/contentStore";
import { useVoteStore } from "../stores/voteStore";
import { getMovieDetails, getTVShowDetails, Movie, TVShow } from "../lib/tmdb";

export interface StatsData {
    moviesWatched: number;
    showsWatched: number;
    moviesAdded: number;
    showsAdded: number;
    likedMovies: number;
    likedShows: number;
    highestRatedMovie: { title: string; rating: number; id: number } | null;
    highestRatedShow: { title: string; rating: number; id: number } | null;
    movieWatchTimeMinutes: number;
    showWatchTimeMinutes: number;
    episodesWatched: number;
    seasonsWatched: number;
    completionRate: number;
    showsPartiallySeen: number;
    topGenres: { name: string; count: number }[];
}

export const useStats = () => {
    const { favorites, watchlist, tvProgress, isWatched, isSeasonWatched } = useContentStore();
    const { userVotes } = useVoteStore();

    // 1. Identify all unique items we need metadata for
    const movieIds = useMemo(() => {
        const ids = new Set<number>();
        favorites.filter(f => f.media_type === "movie").forEach(f => ids.add(f.tmdb_id));
        watchlist.filter(w => w.media_type === "movie").forEach(w => ids.add(w.tmdb_id));
        tvProgress.filter(p => p.season_number === 0 && p.episode_number === 0).forEach(p => ids.add(p.tmdb_id));
        // Also check votes
        Object.keys(userVotes).forEach(key => {
            const [id, type] = key.split(":");
            if (type === "movie") ids.add(Number(id));
        });
        return Array.from(ids);
    }, [favorites, watchlist, tvProgress, userVotes]);

    const tvIds = useMemo(() => {
        const ids = new Set<number>();
        favorites.filter(f => f.media_type === "tv").forEach(f => ids.add(f.tmdb_id));
        watchlist.filter(w => w.media_type === "tv").forEach(w => ids.add(w.tmdb_id));
        tvProgress.filter(p => p.season_number !== 0).forEach(p => ids.add(p.tmdb_id));
        Object.keys(userVotes).forEach(key => {
            const [id, type] = key.split(":");
            if (type === "tv") ids.add(Number(id));
        });
        return Array.from(ids);
    }, [favorites, watchlist, tvProgress, userVotes]);

    // 2. Fetch metadata using TanStack Query
    const movieQueries = useQueries({
        queries: movieIds.map(id => ({
            queryKey: ["movie", id],
            queryFn: () => getMovieDetails(id),
            staleTime: Infinity,
        })),
    });

    const tvQueries = useQueries({
        queries: tvIds.map(id => ({
            queryKey: ["tv", id],
            queryFn: () => getTVShowDetails(id),
            staleTime: Infinity,
        })),
    });

    const isLoading = movieQueries.some(q => q.isLoading) || tvQueries.some(q => q.isLoading);

    // 3. Aggregate Data
    const stats: StatsData | null = useMemo(() => {
        if (isLoading) return null;

        const movieMetadata: Record<number, Movie & { genres: { name: string }[] }> = {};
        movieQueries.forEach(q => {
            if (q.data) movieMetadata[q.data.id] = q.data;
        });

        const tvMetadata: Record<number, TVShow & { genres: { name: string }[] }> = {};
        tvQueries.forEach(q => {
            if (q.data) tvMetadata[q.data.id] = q.data;
        });

        // Basic Counts
        const moviesWatched = movieIds.filter(id => isWatched(id, "movie")).length;
        const showsWatched = tvIds.filter(id => isWatched(id, "tv")).length;
        const moviesAdded = watchlist.filter(w => w.media_type === "movie").length;
        const showsAdded = watchlist.filter(w => w.media_type === "tv").length;
        const likedMovies = favorites.filter(f => f.media_type === "movie").length;
        const likedShows = favorites.filter(f => f.media_type === "tv").length;

        // Ratings
        let highestRatedMovie: StatsData["highestRatedMovie"] = null;
        let highestRatedShow: StatsData["highestRatedShow"] = null;

        Object.entries(userVotes).forEach(([key, rating]) => {
            const [idStr, type] = key.split(":");
            const id = Number(idStr);
            if (type === "movie" && (!highestRatedMovie || rating > highestRatedMovie.rating)) {
                highestRatedMovie = { title: movieMetadata[id]?.title || "Unknown", rating, id };
            } else if (type === "tv" && (!highestRatedShow || rating > highestRatedShow.rating)) {
                highestRatedShow = { title: tvMetadata[id]?.name || "Unknown", rating, id };
            }
        });

        // Time Spent & Genres
        let movieWatchTimeMinutes = 0;
        const genreCounts: Record<string, number> = {};

        movieIds.forEach(id => {
            if (isWatched(id, "movie")) {
                const meta = movieMetadata[id];
                if (meta) {
                    movieWatchTimeMinutes += meta.runtime || 0;
                    meta.genres?.forEach(g => {
                        genreCounts[g.name] = (genreCounts[g.name] || 0) + 1;
                    });
                }
            }
        });

        let showWatchTimeMinutes = 0;
        let episodesWatchedCount = 0;
        let seasonsWatchedCount = 0;
        let totalPossibleEpisodes = 0;
        let partiallySeenCount = 0;

        tvIds.forEach(id => {
            const meta = tvMetadata[id];
            if (!meta) return;

            const watchedEpisodes = tvProgress.filter(p => p.tmdb_id === id && p.season_number > 0);
            episodesWatchedCount += watchedEpisodes.length;

            const avgRuntime = (meta.episode_run_time && meta.episode_run_time.length > 0) 
                ? meta.episode_run_time[0] 
                : 30; // Default to 30 min if unknown
            
            showWatchTimeMinutes += watchedEpisodes.length * avgRuntime;

            // Seasons Watched
            meta.seasons?.forEach(s => {
                if (s.season_number > 0 && isSeasonWatched(id, s.season_number, s.episode_count)) {
                    seasonsWatchedCount += 1;
                }
            });

            // Completion Rate (of items in watchlist/favorites)
            const isInLibrary = watchlist.some(w => w.tmdb_id === id) || favorites.some(f => f.tmdb_id === id);
            if (isInLibrary && meta.number_of_episodes) {
                totalPossibleEpisodes += meta.number_of_episodes;
                if (watchedEpisodes.length > 0 && watchedEpisodes.length < meta.number_of_episodes) {
                    partiallySeenCount += 1;
                }
            }
        });

        const completionRate = totalPossibleEpisodes > 0 
            ? Math.round((episodesWatchedCount / totalPossibleEpisodes) * 100) 
            : 0;

        const topGenres = Object.entries(genreCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            moviesWatched,
            showsWatched,
            moviesAdded,
            showsAdded,
            likedMovies,
            likedShows,
            highestRatedMovie,
            highestRatedShow,
            movieWatchTimeMinutes,
            showWatchTimeMinutes,
            episodesWatched: episodesWatchedCount,
            seasonsWatched: seasonsWatchedCount,
            completionRate,
            showsPartiallySeen: partiallySeenCount,
            topGenres,
        };
    }, [isLoading, movieIds, tvIds, movieQueries, tvQueries, favorites, watchlist, tvProgress, userVotes, isWatched, isSeasonWatched]);

    return { stats, isLoading };
};
