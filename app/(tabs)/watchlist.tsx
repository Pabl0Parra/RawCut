import { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Text, ActivityIndicator } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { useFocusEffect, router } from "expo-router";
import { useContentStore } from "../../src/stores/contentStore";
import { useAuthStore } from "../../src/stores/authStore";
import { useWatchlistData } from "../../src/hooks/useWatchlistData";
import { WatchlistHeader } from "../../src/components/watchlist/WatchlistHeader";
import { ContinueWatchingCard } from "../../src/components/ContinueWatchingCard";
import { UpcomingCard } from "../../src/components/watchlist/UpcomingCard";
import { ContentGridLayout } from "../../src/components/ContentGridLayout";
import { Colors, Fonts } from "../../src/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { FlatList } from "react-native-gesture-handler";

export default function WatchlistScreen() {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const {
        fetchUserContent,
        fetchTVProgress,
        toggleEpisodeWatched,
        isFavorite,
        isInWatchlist,
        isWatched,
        addToFavorites,
        removeFromFavorites,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatched,
        getNextEpisodeToWatch,
    } = useContentStore();

    const [activeTab, setActiveTab] = useState<"movies" | "tv">("tv");
    const { continueWatching, upcoming, allMovies, allTVShows, isLoading } = useWatchlistData();

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchUserContent();
                fetchTVProgress();
            }
        }, [user])
    );

    const swipeGesture = Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-20, 20])
        .failOffsetY([-15, 15])
        .onEnd((e) => {
            const { translationX, velocityX } = e;
            if (translationX < -50 || velocityX < -500) {
                if (activeTab === "tv") setActiveTab("movies");
            } else if (translationX > 50 || velocityX > 500) {
                if (activeTab === "movies") setActiveTab("tv");
            }
        });

    const handleMarkAsWatched = async (tmdbId: number, season: number, episode: number) => {
        await toggleEpisodeWatched(tmdbId, season, episode);
    };

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

    if (isLoading && (continueWatching.length === 0 && upcoming.length === 0 && allMovies.length === 0)) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.vibrantRed} />
            </View>
        );
    }

    return (
        <View style={styles.safeArea}>
            <GestureDetector gesture={swipeGesture}>
                <View>
                    <WatchlistHeader
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        title={t("tabs.watchlist")}
                    />
                </View>
            </GestureDetector>

            {activeTab === "tv" ? (
                continueWatching.length > 0 || upcoming.length > 0 ? (
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {continueWatching.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="play-circle-outline" size={24} color={Colors.vibrantRed} />
                                    <Text style={styles.sectionTitle}>{t("home.continueWatching")}</Text>
                                </View>
                                <FlatList
                                    horizontal
                                    data={continueWatching}
                                    keyExtractor={(item) => `continue-${item.id}`}
                                    showsHorizontalScrollIndicator={false}
                                    renderItem={({ item }) => (
                                        <ContinueWatchingCard
                                            item={item}
                                            horizontal
                                            onPress={(showId) => router.push(`/tv/${showId}`)}
                                            nextEpisode={item.nextEpisode}
                                        />
                                    )}
                                    contentContainerStyle={styles.horizontalListContent}
                                />
                            </View>
                        )}

                        <GestureDetector gesture={swipeGesture}>
                            <View style={{ flex: 1 }}>
                                {upcoming.length > 0 && (
                                    <View style={styles.section}>
                                        <View style={styles.sectionHeader}>
                                            <Ionicons name="calendar-outline" size={22} color={Colors.vibrantRed} />
                                            <Text style={styles.sectionTitle}>Próximos Estrenos</Text>
                                        </View>
                                        {upcoming.map((item) => {
                                            const airDate = new Date(item.next_episode_to_air?.air_date || "");
                                            const diff = airDate.getTime() - new Date().getTime();
                                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                            return (
                                                <UpcomingCard
                                                    key={item.internal_id}
                                                    item={item}
                                                    daysRemaining={days}
                                                    onPress={() => router.push(`/tv/${item.id}`)}
                                                    onRemindMe={() => { }}
                                                />
                                            );
                                        })}
                                    </View>
                                )}

                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="stats-chart-outline" size={20} color={Colors.white} />
                                        <Text style={styles.sectionTitle}>Estadísticas</Text>
                                    </View>
                                    <View style={styles.statsCard}>
                                        <Text style={styles.statsText}>
                                            Tienes {continueWatching.length + upcoming.length} series activas en seguimiento.
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </GestureDetector>
                    </ScrollView>
                ) : (
                    <GestureDetector gesture={swipeGesture}>
                        <View style={{ flex: 1 }}>
                            <ContentGridLayout
                                data={allTVShows.map(item => ({
                                    id: item.internal_id,
                                    tmdb_id: item.id,
                                    media_type: "tv",
                                    title: item.name,
                                    poster_path: item.poster_path,
                                    vote_average: item.vote_average,
                                }))}
                                isLoading={false}
                                isAuthenticated={true}
                                emptyTitle={t("watchlist.emptyTitle")}
                                emptySubtitle={t("watchlist.emptySubtitle")}
                                emptyIcon="📺"
                                onToggleFavorite={handleToggleFavorite}
                                onToggleWatchlist={handleToggleWatchlist}
                                onToggleWatched={handleToggleWatched}
                                isFavorite={isFavorite}
                                isInWatchlist={isInWatchlist}
                                isWatched={isWatched}
                            />
                        </View>
                    </GestureDetector>
                )
            ) : (
                <GestureDetector gesture={swipeGesture}>
                    <View style={{ flex: 1 }}>
                        <ContentGridLayout
                            data={allMovies.map(item => ({
                                id: item.internal_id,
                                tmdb_id: item.id,
                                media_type: "movie",
                                title: item.title,
                                poster_path: item.poster_path,
                                vote_average: item.vote_average,
                            }))}
                            isLoading={false}
                            isAuthenticated={true}
                            emptyTitle={t("watchlist.emptyTitle")}
                            emptySubtitle={t("watchlist.emptySubtitle")}
                            emptyIcon="🎬"
                            onToggleFavorite={handleToggleFavorite}
                            onToggleWatchlist={handleToggleWatchlist}
                            onToggleWatched={handleToggleWatched}
                            isFavorite={isFavorite}
                            isInWatchlist={isInWatchlist}
                            isWatched={isWatched}
                        />
                    </View>
                </GestureDetector>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
        paddingTop: 8,
    },
    centerContainer: {
        flex: 1,
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flex: 1,
        paddingHorizontal: 0, // Removed horizontal padding for the ScrollView itself to allow carousel to hit edges
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 8,
    },
    sectionTitle: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: "bold",
        fontFamily: Fonts.bebas,
        letterSpacing: 0.5,
    },
    horizontalListContent: {
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 100,
    },
    emptyText: {
        color: Colors.metalSilver,
        fontSize: 16,
    },
    statsCard: {
        backgroundColor: Colors.panelBackground,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.metalGray,
    },
    statsText: {
        color: Colors.white,
        fontSize: 14,
        lineHeight: 20,
    }
});
