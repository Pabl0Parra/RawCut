import { useState, useCallback, useEffect } from "react";
import {
    getRelatedMovies,
    getRelatedTVShows,
    getMovieDetails,
    getTVShowDetails,
    getPopularMovies,
    getPopularTVShows,
    type Movie,
    type TVShow
} from "../lib/tmdb";
import { useContentStore } from "../stores/contentStore";
import type { ContentTab } from "../types/homeScreen.types";

export interface ForYouRecommendation {
    id: string;
    title: string;
    items: (Movie | TVShow)[];
    mediaType: "movie" | "tv";
}

export const useForYouContent = (activeTab: ContentTab) => {
    const [recommendations, setRecommendations] = useState<ForYouRecommendation[]>([]);
    const [loading, setLoading] = useState(false);

    type ContentState = ReturnType<typeof useContentStore.getState>;
    const favorites = useContentStore((s: ContentState) => s.favorites);
    const watchlist = useContentStore((s: ContentState) => s.watchlist);

    const fetchRecommendations = useCallback(async () => {
        if (activeTab !== "foryou") return;

        setLoading(true);
        try {
            // 1. Get recent items from favorites and watchlist
            const sourceItems = [...favorites, ...watchlist]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .filter((item, index, self) =>
                    index === self.findIndex((t) => (
                        t.tmdb_id === item.tmdb_id && t.media_type === item.media_type
                    ))
                )
                .slice(0, 3); // Max 3 source items

            const newRecs: ForYouRecommendation[] = [];

            // 2. Fetch recommendations based on those items
            const promises = sourceItems.map(async (item) => {
                try {
                    if (item.media_type === "movie") {
                        const [details, related] = await Promise.all([
                            getMovieDetails(item.tmdb_id),
                            getRelatedMovies(item.tmdb_id)
                        ]);
                        if (details && related?.results?.length > 0) {
                            return {
                                id: `rec-movie-${item.tmdb_id}`,
                                title: `Porque te gustó "${details.title}"`,
                                items: related.results,
                                mediaType: "movie" as const
                            };
                        }
                    } else if (item.media_type === "tv") {
                        const [details, related] = await Promise.all([
                            getTVShowDetails(item.tmdb_id),
                            getRelatedTVShows(item.tmdb_id)
                        ]);
                        if (details && related?.results?.length > 0) {
                            return {
                                id: `rec-tv-${item.tmdb_id}`,
                                title: `Porque te gustó "${details.name}"`,
                                items: related.results,
                                mediaType: "tv" as const
                            };
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch recommendation set for", item, e);
                }
                return null;
            });

            const results = await Promise.all(promises);
            results.forEach(res => {
                if (res) newRecs.push(res);
            });

            // 3. Fallback if no personalized recommendations exist
            if (newRecs.length === 0) {
                const [popMovies, popTV] = await Promise.all([
                    getPopularMovies(),
                    getPopularTVShows()
                ]);

                if (popMovies?.results?.length > 0) {
                    newRecs.push({
                        id: 'pop-movies',
                        title: 'Películas Populares',
                        items: popMovies.results,
                        mediaType: "movie"
                    });
                }
                if (popTV?.results?.length > 0) {
                    newRecs.push({
                        id: 'pop-tv',
                        title: 'Series Populares',
                        items: popTV.results,
                        mediaType: "tv"
                    });
                }
            }

            setRecommendations(newRecs);
        } catch (err) {
            console.error("Error fetching For You content:", err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, favorites, watchlist]);

    useEffect(() => {
        if (activeTab === "foryou") {
            fetchRecommendations();
        }
    }, [activeTab, fetchRecommendations]);

    return { recommendations, loadingForYou: loading, fetchForYouContent: fetchRecommendations };
};
