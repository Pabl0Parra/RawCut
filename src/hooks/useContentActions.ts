import { useCallback } from "react";
import { useContentStore } from "../stores/contentStore";
import type { MediaType } from "../types/movieDetail.types";

/**
 * Return type for useContentActions hook
 */
export interface ContentActionsReturn {
    isFavorite: (contentId: number, mediaType: MediaType) => boolean;
    isInWatchlist: (contentId: number, mediaType: MediaType) => boolean;
    isWatched: (contentId: number, mediaType: MediaType) => boolean;
    handleToggleFavorite: (contentId: number, mediaType: MediaType) => Promise<void>;
    handleToggleWatchlist: (contentId: number, mediaType: MediaType) => Promise<void>;
    handleToggleWatched: (contentId: number, mediaType: MediaType) => Promise<void>;
}

/**
 * Shared hook for content action handlers (favorite, watchlist, watched)
 * Used by both movie and TV detail screens to reduce duplication
 */
export function useContentActions(): ContentActionsReturn {
    const {
        isFavorite,
        isInWatchlist,
        isWatched,
        addToFavorites,
        removeFromFavorites,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatched,
    } = useContentStore();

    const handleToggleFavorite = useCallback(
        async (contentId: number, mediaType: MediaType): Promise<void> => {
            if (isFavorite(contentId, mediaType)) {
                await removeFromFavorites(contentId, mediaType);
            } else {
                await addToFavorites(contentId, mediaType);
            }
        },
        [isFavorite, addToFavorites, removeFromFavorites]
    );

    const handleToggleWatchlist = useCallback(
        async (contentId: number, mediaType: MediaType): Promise<void> => {
            if (isInWatchlist(contentId, mediaType)) {
                await removeFromWatchlist(contentId, mediaType);
            } else {
                await addToWatchlist(contentId, mediaType);
            }
        },
        [isInWatchlist, addToWatchlist, removeFromWatchlist]
    );

    const handleToggleWatched = useCallback(
        async (contentId: number, mediaType: MediaType): Promise<void> => {
            await toggleWatched(contentId, mediaType);
        },
        [toggleWatched]
    );

    return {
        isFavorite,
        isInWatchlist,
        isWatched,
        handleToggleFavorite,
        handleToggleWatchlist,
        handleToggleWatched,
    };
}

export default useContentActions;
