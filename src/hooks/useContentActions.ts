import { useCallback } from "react";
import { Alert } from "react-native";
import { useContentStore } from "../stores/contentStore";
import type { MediaType } from "../types/movieDetail.types";

export interface ContentActionsReturn {
    isFavorite: (contentId: number, mediaType: MediaType) => boolean;
    isInWatchlist: (contentId: number, mediaType: MediaType) => boolean;
    isWatched: (contentId: number, mediaType: MediaType) => boolean;
    handleToggleFavorite: (contentId: number, mediaType: MediaType) => Promise<void>;
    handleToggleWatchlist: (contentId: number, mediaType: MediaType) => Promise<void>;
    handleToggleWatched: (contentId: number, mediaType: MediaType) => Promise<void>;
}

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
            try {
                if (isFavorite(contentId, mediaType)) {
                    await removeFromFavorites(contentId, mediaType);
                } else {
                    await addToFavorites(contentId, mediaType);
                }
            } catch {
                Alert.alert("Error", "No se pudo actualizar Favoritos. Comprueba tu conexión.");
            }
        },
        [isFavorite, addToFavorites, removeFromFavorites]
    );

    const handleToggleWatchlist = useCallback(
        async (contentId: number, mediaType: MediaType): Promise<void> => {
            try {
                if (isInWatchlist(contentId, mediaType)) {
                    await removeFromWatchlist(contentId, mediaType);
                } else {
                    await addToWatchlist(contentId, mediaType);
                }
            } catch {
                Alert.alert("Error", "No se pudo actualizar Mi Lista. Comprueba tu conexión.");
            }
        },
        [isInWatchlist, addToWatchlist, removeFromWatchlist]
    );

    const handleToggleWatched = useCallback(
        async (contentId: number, mediaType: MediaType): Promise<void> => {
            try {
                await toggleWatched(contentId, mediaType);
            } catch {
                Alert.alert("Error", "No se pudo marcar como visto. Comprueba tu conexión.");
            }
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
