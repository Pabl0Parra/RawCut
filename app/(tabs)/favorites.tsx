import { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { useContentStore } from "../../src/stores/contentStore";
import { useAuthStore } from "../../src/stores/authStore";
import { useEnrichedContent } from "../../src/hooks/useEnrichedContent";
import { ContentGridLayout } from "../../src/components/ContentGridLayout";

export default function FavoritesScreen() {
    const { user } = useAuthStore();
    const {
        favorites,
        fetchUserContent,
        removeFromFavorites,
        addToFavorites,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatched,
        isFavorite,
        isInWatchlist,
        isWatched,
    } = useContentStore();

    const { enrichedItems, isLoading } = useEnrichedContent(favorites);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchUserContent();
            }
        }, [user])
    );

    const handleToggleFavorite = async (tmdbId: number, mediaType: "movie" | "tv") => {
        if (isFavorite(tmdbId, mediaType)) {
            await removeFromFavorites(tmdbId, mediaType);
        } else {
            await addToFavorites(tmdbId, mediaType);
        }
    };

    const handleToggleWatchlist = async (tmdbId: number, mediaType: "movie" | "tv") => {
        if (isInWatchlist(tmdbId, mediaType)) {
            await removeFromWatchlist(tmdbId, mediaType);
        } else {
            await addToWatchlist(tmdbId, mediaType);
        }
    };

    const handleToggleWatched = async (tmdbId: number, mediaType: "movie" | "tv") => {
        await toggleWatched(tmdbId, mediaType);
    };

    return (
        <View style={styles.safeArea}>
            <ContentGridLayout
                data={enrichedItems}
                isLoading={isLoading}
                isAuthenticated={!!user}
                emptyTitle="No tienes favoritos aún"
                emptySubtitle="Explora películas y series para añadir a tus favoritos"
                emptyIcon="💔"
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
