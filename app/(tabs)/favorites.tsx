import { useCallback, useState, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS } from "react-native-reanimated";
import { useContentStore } from "../../src/stores/contentStore";
import { useAuthStore } from "../../src/stores/authStore";
import { useEnrichedContent } from "../../src/hooks/useEnrichedContent";
import { ContentGridLayout } from "../../src/components/ContentGridLayout";
import { WatchlistHeader } from "../../src/components/watchlist/WatchlistHeader";
import type { MediaType } from "../../src/types/homeScreen.types";

export default function FavoritesScreen() {
    const { t } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const favorites = useContentStore((s) => s.favorites);
    const isFavorite = useContentStore((s) => s.isFavorite);
    const isInWatchlist = useContentStore((s) => s.isInWatchlist);
    const isWatched = useContentStore((s) => s.isWatched);

    const { enrichedItems, isLoading } = useEnrichedContent(favorites);

    const [activeTab, setActiveTab] = useState<"movies" | "tv">("movies");

    const swipeGesture = useMemo(() => {
        const tabs: ("movies" | "tv")[] = ["movies", "tv"];
        return Gesture.Pan()
            .runOnJS(true)
            .activeOffsetX([-50, 50])
            .failOffsetY([-15, 15])
            .onEnd((e) => {
                const { translationX, velocityX } = e;
                const currentIndex = tabs.indexOf(activeTab);
                if (translationX < -50 || velocityX < -500) {
                    if (currentIndex < tabs.length - 1) runOnJS(setActiveTab)(tabs[currentIndex + 1]);
                } else if (translationX > 50 || velocityX > 500) {
                    if (currentIndex > 0) runOnJS(setActiveTab)(tabs[currentIndex - 1]);
                }
            });
    }, [activeTab]);

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

    const filteredItems = enrichedItems.filter((item) => {
        if (activeTab === "movies") return item.media_type === "movie";
        return item.media_type === "tv";
    });

    return (
        <View style={styles.safeArea}>
            <WatchlistHeader
                activeTab={activeTab}
                onTabChange={setActiveTab}
                title={t("tabs.favorites").toUpperCase()}
            />
            <GestureDetector gesture={swipeGesture}>
                <Animated.View style={{ flex: 1 }}>
                    <ContentGridLayout
                        data={filteredItems}
                        isLoading={isLoading}
                        isAuthenticated={!!user}
                        emptyTitle={t("favorites.emptyTitle")}
                        emptySubtitle={t("favorites.emptySubtitle")}
                        emptyIcon="💔"
                        emptyAsset={require("../../assets/icons/broken-heart.png")}
                        onToggleFavorite={handleToggleFavorite}
                        onToggleWatchlist={handleToggleWatchlist}
                        onToggleWatched={handleToggleWatched}
                        isFavorite={isFavorite}
                        isInWatchlist={isInWatchlist}
                        isWatched={isWatched}
                    />
                </Animated.View>
            </GestureDetector>
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