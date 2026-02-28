import { useState, useEffect, useCallback, useRef } from "react";
import { getMovieDetails, getTVShowDetails } from "../lib/tmdb";

export interface EnrichedContentItem {
    id: string;
    tmdb_id: number;
    media_type: "movie" | "tv";
    title: string;
    poster_path: string | null;
    vote_average: number;
}

interface RawContentItem {
    id: string;
    tmdb_id: number;
    media_type: "movie" | "tv";
}

export function useEnrichedContent(rawItems: RawContentItem[]) {
    const [enrichedItems, setEnrichedItems] = useState<EnrichedContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(rawItems.length > 0);
    const cancelledRef = useRef(false);

    const enrichItems = useCallback(async () => {
        if (!rawItems || rawItems.length === 0) {
            setEnrichedItems([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const enriched = await Promise.all(
                rawItems.map(async (item) => {
                    try {
                        if (item.media_type === "movie") {
                            const details = await getMovieDetails(item.tmdb_id);
                            if (!details) throw new Error("TMDb item not found");
                            return {
                                id: item.id,
                                tmdb_id: item.tmdb_id,
                                media_type: item.media_type,
                                title: details.title,
                                poster_path: details.poster_path,
                                vote_average: details.vote_average,
                            };
                        } else {
                            const details = await getTVShowDetails(item.tmdb_id);
                            if (!details) throw new Error("TMDb item not found");
                            return {
                                id: item.id,
                                tmdb_id: item.tmdb_id,
                                media_type: item.media_type,
                                title: details.name,
                                poster_path: details.poster_path,
                                vote_average: details.vote_average,
                            };
                        }
                    } catch (err) {
                        console.warn(`[useEnrichedContent] Item ${item.tmdb_id} unavailable:`, err);
                        return {
                            id: item.id,
                            tmdb_id: item.tmdb_id,
                            media_type: item.media_type,
                            title: "Sin título",
                            poster_path: null,
                            vote_average: 0,
                        };
                    }
                })
            );
            if (!cancelledRef.current) {
                setEnrichedItems(enriched);
            }
        } catch (err) {
            console.error("Error in useEnrichedContent:", err);
        } finally {
            if (!cancelledRef.current) {
                setIsLoading(false);
            }
        }
    }, [rawItems]);

    useEffect(() => {
        cancelledRef.current = false;
        enrichItems();
        return () => {
            cancelledRef.current = true;
        };
    }, [enrichItems]);

    return { enrichedItems, isLoading };
}
