import { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { useContentStore } from "../../src/stores/contentStore";
import { useAuthStore } from "../../src/stores/authStore";
import { useEnrichedContent } from "../../src/hooks/useEnrichedContent";
import { ContentGridLayout } from "../../src/components/ContentGridLayout";
import type { MediaType } from "../../src/types/homeScreen.types";

export default function FavoritesScreen() {
    const user = useAuthStore((s) => s.user);
    const favorites = useContentStore((s) => s.favorites);
    const isFavorite = useContentStore((s) => s.isFavorite);
    const isInWatchlist = useContentStore((s) => s.isInWatchlist);
    const isWatched = useContentStore((s) => s.isWatched);

    const { enrichedItems, isLoading } = useEnrichedContent(favorites);

    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            useContentStore.getState().fetchUserContent();
        }, [user]),
    );

    const handleToggleFavorite = useCallback(
        async (tmdbId: number, mediaType: MediaType): Promise<void> => {
            try {
                const store = useContentStore.getState();
                if (store.isFavorite(tmdbId, mediaType)) {
                    await store.removeFromFavorites(tmdbId, mediaType);
                } else {
                    await store.addToFavorites(tmdbId, mediaType);
                }
            } catch (err) {
                console.error("[FavoritesScreen] Toggle favorite failed:", err);
            }
        },
        [],
    );

    const handleToggleWatchlist = useCallback(
        async (tmdbId: number, mediaType: MediaType): Promise<void> => {
            try {
                const store = useContentStore.getState();
                if (store.isInWatchlist(tmdbId, mediaType)) {
                    await store.removeFromWatchlist(tmdbId, mediaType);
                } else {
                    await store.addToWatchlist(tmdbId, mediaType);
                }
            } catch (err) {
                console.error("[FavoritesScreen] Toggle watchlist failed:", err);
            }
        },
        [],
    );

    const handleToggleWatched = useCallback(
        async (tmdbId: number, mediaType: MediaType): Promise<void> => {
            try {
                await useContentStore.getState().toggleWatched(tmdbId, mediaType);
            } catch (err) {
                console.error("[FavoritesScreen] Toggle watched failed:", err);
            }
        },
        [],
    );

    return (
        <View style={styles.safeArea}>
            <ContentGridLayout
                data={enrichedItems}
                isLoading={isLoading}
                isAuthenticated={!!user}
                emptyTitle="No tienes favoritos aún"
                emptySubtitle="Explora películas y series para añadir a tus favoritos"
                emptyIcon="💔"
                emptyAsset={require("../../assets/icons/broken-heart.png")}
                onToggleFavorite={handleToggleFavorite}
                onToggleWatchlist={handleToggleWatchlist}
                onToggleWatched={handleToggleWatched}
                isFavorite={isFavorite}
                isInWatchlist={isInWatchlist}
                isWatched={isWatched}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
        paddingTop: 8,
    },
});