import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { useAuthStore } from "../stores/authStore";
import type { ContentTab } from "../types/homeScreen.types";

export interface ForYouRecommendation {
    id: string;
    title: string;
    items: (Movie | TVShow)[];
    mediaType: "movie" | "tv";
}

export const useForYouContent = (activeTab: ContentTab) => {
    const { t } = useTranslation();
    const [recommendations, setRecommendations] = useState<ForYouRecommendation[]>([]);
    const [loading, setLoading] = useState(false);
    // True once the first fetch attempt has completed (success or failure).
    // Used by callers to gate rendering until personalizado is settled so it
    // doesn't pop-in after other sections causing a visible layout shift.
    const [forYouSettled, setForYouSettled] = useState(false);

    // ─── Read store values imperatively inside the callback ──────────────
    // We intentionally do NOT subscribe to `favorites`, `watchlist`, or
    // `contentLoaded` as reactive values here. If we did, every time Zustand
    // updates those arrays (e.g. when fetchUserContent() resolves), React
    // would recreate `fetchRecommendations`, fire the useEffect again, and
    // trigger a second fetch that causes the Personalizado section to re-render.
    // Reading via getState() makes the callback stable.

    const fetchRecommendations = useCallback(async () => {
        if (activeTab !== "foryou") return;

        const { favorites, watchlist, contentLoaded } = useContentStore.getState();
        const { user, authInitialized } = useAuthStore.getState();

        // Block until auth has fully resolved (setSession has been called).
        // Without this, the effect fires immediately on mount with user=null
        // (before supabase.auth.getSession() returns), fetches popular movies
        // as a fallback, and then fires AGAIN once auth + content loads —
        // causing the visible Personalizado re-render.
        if (!authInitialized) return;

        // If user is logged in, additionally wait for their content (favorites/
        // watchlist) to be fetched before building personalized recommendations.
        if (user && !contentLoaded) return;

        setLoading(true);
        try {
            // 1. Get recent items from favorites and watchlist
            const uniqueSortedItems = [...favorites, ...watchlist]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .filter((item, index, self) =>
                    index === self.findIndex((t) => (
                        t.tmdb_id === item.tmdb_id && t.media_type === item.media_type
                    ))
                );

            const movieItems = uniqueSortedItems.filter((item) => item.media_type === "movie").slice(0, 3);
            const tvItems = uniqueSortedItems.filter((item) => item.media_type === "tv").slice(0, 3);
            const sourceItems = [...movieItems, ...tvItems];

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
                                title: t("home.becauseYouLiked", { title: details.title }),
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
                                title: t("home.becauseYouLiked", { title: details.name }),
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
                        title: t("home.popularMovies"),
                        items: popMovies.results,
                        mediaType: "movie"
                    });
                }
                if (popTV?.results?.length > 0) {
                    newRecs.push({
                        id: 'pop-tv',
                        title: t("home.popularTV"),
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
            // Mark as settled regardless of outcome so callers can unlock rendering.
            setForYouSettled(true);
        }
    // Only depends on activeTab and t — store values are read imperatively
    }, [activeTab, t]);

    // Subscribe to authInitialized AND contentLoaded so the effect re-fires
    // exactly the right number of times:
    //   1. Once when auth resolves (authInitialized flips true)
    //   2. Once when user content loads (contentLoaded flips true)
    // The guard inside fetchRecommendations ensures only the correct call
    // actually executes a fetch.
    const authInitialized = useAuthStore((s) => s.authInitialized);
    const contentLoaded = useContentStore((s) => s.contentLoaded);

    useEffect(() => {
        if (activeTab === "foryou") {
            fetchRecommendations();
        }
    }, [activeTab, fetchRecommendations, authInitialized, contentLoaded]);

    return { recommendations, loadingForYou: loading, forYouSettled, fetchForYouContent: fetchRecommendations };
};

