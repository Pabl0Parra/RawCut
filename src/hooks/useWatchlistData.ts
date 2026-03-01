import { useState, useEffect, useCallback, useRef } from "react";
import { getMovieDetails, getTVShowDetails, getTVSeasonDetails, Movie, TVShow, Episode } from "../lib/tmdb";
import { useContentStore, TVProgress } from "../stores/contentStore";

export interface WatchlistTVItem extends TVShow {
    internal_id: string; // Internal UUID from user_content
    nextEpisode: {
        season: number;
        episode: number;
        title?: string;
        air_date?: string;
        overview?: string;
    } | null;
    progress: number; // 0 to 1
}

export interface WatchlistMovieItem extends Movie {
    internal_id: string; // Internal UUID from user_content
}

export interface CategorizedWatchlist {
    continueWatching: WatchlistTVItem[];
    upcoming: WatchlistTVItem[];
    allMovies: WatchlistMovieItem[];
    allTVShows: WatchlistTVItem[];
    isLoading: boolean;
}

export function useWatchlistData() {
    const { watchlist, tvProgress, getNextEpisodeToWatch } = useContentStore();
    const [data, setData] = useState<CategorizedWatchlist>({
        continueWatching: [],
        upcoming: [],
        allMovies: [],
        allTVShows: [],
        isLoading: true,
    });
    const cancelledRef = useRef(false);

    const fetchData = useCallback(async () => {
        const hasWatchlist = watchlist && watchlist.length > 0;
        const hasProgress = tvProgress && tvProgress.length > 0;

        if (!hasWatchlist && !hasProgress) {
            setData({
                continueWatching: [],
                upcoming: [],
                allMovies: [],
                allTVShows: [],
                isLoading: false
            });
            return;
        }

        setData(prev => ({ ...prev, isLoading: true }));

        try {
            // 1. Identify all unique TMDB IDs we need to fetch
            const watchlistIds = watchlist.map(item => ({ id: item.tmdb_id, type: item.media_type, internal_id: item.id }));
            
            // From progress, identify unique TV shows
            const progressShowIds = Array.from(new Set(tvProgress.map(p => Number(p.tmdb_id))));
            
            // Combine them, avoiding duplicates for those in both
            const allNeededTVIds = new Set([
                ...watchlistIds.filter(i => i.type === 'tv').map(i => Number(i.id)),
                ...progressShowIds
            ]);

            const allNeededMovieIds = watchlistIds.filter(i => i.type === 'movie').map(i => Number(i.id));

            // Fetch all Movie details
            const movieResults = await Promise.all(
                allNeededMovieIds.map(async (id) => {
                    try {
                        const details = await getMovieDetails(id);
                        if (!details) return null;
                        const internal = watchlist.find(w => Number(w.tmdb_id) === id && w.media_type === 'movie');
                        return { ...details, internal_id: internal?.id || String(id), type: 'movie' };
                    } catch (e) { return null; }
                })
            );

            // Fetch all TV details
            const tvResults = await Promise.all(
                Array.from(allNeededTVIds).map(async (id) => {
                    try {
                        const details = await getTVShowDetails(id);
                        if (!details) return null;
                        
                        const internal = watchlist.find(w => Number(w.tmdb_id) === id && w.media_type === 'tv');
                        
                        // Calculate progress and next episode
                        const next = getNextEpisodeToWatch(id, details.seasons || []);
                        const watchedEpisodes = tvProgress.filter(p => Number(p.tmdb_id) === id);
                        const watchedCount = watchedEpisodes.length;
                        const totalEpisodes = details.number_of_episodes || 0;
                        const progress = totalEpisodes > 0 ? watchedCount / totalEpisodes : 0;

                        let nextEpDetails = null;
                        if (next) {
                            try {
                                const seasonDetails = await getTVSeasonDetails(id, next.season);
                                const ep = seasonDetails.episodes.find((e: Episode) => e.episode_number === next.episode);
                                if (ep) {
                                    nextEpDetails = {
                                        season: next.season,
                                        episode: next.episode,
                                        title: ep.name,
                                        air_date: ep.air_date,
                                        overview: ep.overview,
                                    };
                                } else {
                                    nextEpDetails = { season: next.season, episode: next.episode };
                                }
                            } catch (e) {
                                nextEpDetails = { season: next.season, episode: next.episode };
                            }
                        }

                        return { 
                            ...details, 
                            internal_id: internal?.id || String(id), 
                            type: 'tv',
                            nextEpisode: nextEpDetails,
                            progress,
                            inWatchlist: !!internal
                        };
                    } catch (e) { return null; }
                })
            );

            if (cancelledRef.current) return;

            const validMovies = movieResults.filter((r): r is any => r !== null);
            const validTV = tvResults.filter((r): r is any => r !== null);
            
            const continueWatching: WatchlistTVItem[] = [];
            const upcoming: WatchlistTVItem[] = [];
            const allMovies: WatchlistMovieItem[] = [];
            const allTVShows: WatchlistTVItem[] = [];

            validMovies.forEach(item => {
                allMovies.push(item);
            });

            validTV.forEach(tvItem => {
                if (tvItem.inWatchlist) {
                    allTVShows.push(tvItem);
                }

                // If finished (progress 1), don't show in continue or upcoming lists
                if (tvItem.progress < 1) {
                    // Logic for Continue Watching: Has progress
                    if (tvItem.progress > 0) {
                        continueWatching.push(tvItem);
                    }

                    // Logic for Upcoming: Has air date in the future or status is returning
                    if (tvItem.next_episode_to_air) {
                        upcoming.push(tvItem);
                    }
                }
            });

            // Sort continue watching by latest progress (roughly, since we don't have timestamp here yet)
            // For now, keep as is or sort by name
            continueWatching.sort((a, b) => b.progress - a.progress);

            setData({
                continueWatching,
                upcoming,
                allMovies,
                allTVShows,
                isLoading: false
            });

        } catch (err) {
            console.error("Error in useWatchlistData:", err);
            setData(prev => ({ ...prev, isLoading: false }));
        }
    }, [watchlist, tvProgress, getNextEpisodeToWatch]);

    useEffect(() => {
        cancelledRef.current = false;
        fetchData();
        return () => {
            cancelledRef.current = true;
        };
    }, [fetchData]);

    return data;
}
