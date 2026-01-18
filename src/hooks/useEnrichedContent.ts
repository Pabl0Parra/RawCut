import { useState, useEffect, useCallback } from "react";
import { getMovieDetails, getTVShowDetails } from "../lib/tmdb";

export interface EnrichedContentItem {
    id: string;
    tmdb_id: number;
    media_type: "movie" | "tv";
    title: string;
    poster_path: string | null;
    vote_average: number;
}

export function useEnrichedContent(rawItems: any[]) {
    const [enrichedItems, setEnrichedItems] = useState<EnrichedContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const enrichItems = useCallback(async () => {
        if (!rawItems || rawItems.length === 0) {
            setEnrichedItems([]);
            setIsLoading(false);
            return;
        }

        // Optimization: Check if the content actually changed to avoid re-fetching
        if (enrichedItems.length > 0 && rawItems.length === enrichedItems.length) {
            const isSame = rawItems.every(item =>
                enrichedItems.some(ei => ei.tmdb_id === item.tmdb_id && ei.media_type === item.media_type)
            );
            if (isSame) return;
        }

        setIsLoading(true);
        try {
            const enriched = await Promise.all(
                rawItems.map(async (item) => {
                    try {
                        if (item.media_type === "movie") {
                            const details = await getMovieDetails(item.tmdb_id);
                            return {
                                id: item.id,
                                tmdb_id: item.tmdb_id,
                                media_type: item.media_type as "movie" | "tv",
                                title: details.title,
                                poster_path: details.poster_path,
                                vote_average: details.vote_average,
                            };
                        } else {
                            const details = await getTVShowDetails(item.tmdb_id);
                            return {
                                id: item.id,
                                tmdb_id: item.tmdb_id,
                                media_type: item.media_type as "movie" | "tv",
                                title: details.name,
                                poster_path: details.poster_path,
                                vote_average: details.vote_average,
                            };
                        }
                    } catch (err) {
                        console.error(`Error enriching item ${item.tmdb_id}:`, err);
                        return {
                            id: item.id,
                            tmdb_id: item.tmdb_id,
                            media_type: item.media_type as "movie" | "tv",
                            title: "Sin título",
                            poster_path: null,
                            vote_average: 0,
                        };
                    }
                })
            );
            setEnrichedItems(enriched);
        } catch (err) {
            console.error("Error in useEnrichedContent:", err);
        } finally {
            setIsLoading(false);
        }
    }, [rawItems, enrichedItems]);

    useEffect(() => {
        enrichItems();
    }, [rawItems]);

    return { enrichedItems, isLoading };
}
