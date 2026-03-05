import React, { useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Colors, Fonts } from "../src/constants/Colors";
import { useStats } from "../src/hooks/useStats";
import { StatCard, SplitStatRow } from "../src/components/stats/StatCards";
import { RatedItemCard, GenreTable } from "../src/components/stats/SpecificStats";
import { StatsSkeleton } from "../src/components/stats/StatsSkeleton";
import { useVoteStore } from "../src/stores/voteStore";

const formatTimeSpent = (minutes: number, t: any) => {
    if (minutes <= 0) return `0 ${t("stats.timeFormat.minute_plural", { count: 0 })}`;

    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;

    const parts = [];
    if (days > 0) parts.push(t(days === 1 ? "stats.timeFormat.day" : "stats.timeFormat.day_plural", { count: days }));
    if (hours > 0) parts.push(t(hours === 1 ? "stats.timeFormat.hour" : "stats.timeFormat.hour_plural", { count: hours }));
    if (mins > 0 || parts.length === 0) {
        parts.push(t(mins === 1 ? "stats.timeFormat.minute" : "stats.timeFormat.minute_plural", { count: mins }));
    }

    return parts.join(", ");
};

export default function StatsScreen() {
    const { t } = useTranslation();
    const { stats, isLoading } = useStats();
    const { fetchAllUserVotes } = useVoteStore();

    useEffect(() => {
        fetchAllUserVotes();
    }, []);

    if (isLoading || !stats) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen options={{
                    headerShown: true,
                    title: t("stats.title"),
                    headerTransparent: false,
                    headerStyle: { backgroundColor: Colors.black },
                    headerTintColor: Colors.cinematicGold,
                    headerTitleStyle: { color: Colors.white, fontFamily: Fonts.bebas },
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/watchlist")}
                            style={styles.backButton}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                            <Ionicons name="chevron-back" size={28} color={Colors.cinematicGold} />
                        </TouchableOpacity>
                    ),
                }} />
                <StatsSkeleton />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                headerShown: true,
                title: t("stats.title"),
                headerTransparent: false,
                headerStyle: { backgroundColor: Colors.black },
                headerTintColor: Colors.cinematicGold,
                headerTitleStyle: { color: Colors.white, fontFamily: Fonts.bebas, fontSize: 24 },
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/watchlist")}
                        style={styles.backButton}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                        <Ionicons name="chevron-back" size={28} color={Colors.cinematicGold} />
                    </TouchableOpacity>
                ),
                headerTitleAlign: "center",
            }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <SplitStatRow>
                    <StatCard icon="film" label={t("stats.moviesWatched")} value={stats.moviesWatched} halfWidth />
                    <StatCard icon="tv" label={t("stats.showsWatched")} value={stats.showsWatched} halfWidth />
                </SplitStatRow>

                <SplitStatRow>
                    <StatCard icon="add-circle" label={t("stats.moviesAdded")} value={stats.moviesAdded} halfWidth />
                    <StatCard icon="add-circle" label={t("stats.showsAdded")} value={stats.showsAdded} halfWidth />
                </SplitStatRow>

                <SplitStatRow>
                    <StatCard icon="heart" label={t("stats.likedMovies")} value={stats.likedMovies} halfWidth />
                    <StatCard icon="heart" label={t("stats.likedShows")} value={stats.likedShows} halfWidth />
                </SplitStatRow>

                {stats.highestRatedMovie && (
                    <RatedItemCard
                        type="movie"
                        label={t("stats.highestRatedMovie")}
                        title={stats.highestRatedMovie.title}
                        rating={stats.highestRatedMovie.rating}
                    />
                )}

                {stats.highestRatedShow && (
                    <RatedItemCard
                        type="tv"
                        label={t("stats.highestRatedShow")}
                        title={stats.highestRatedShow.title}
                        rating={stats.highestRatedShow.rating}
                    />
                )}

                <StatCard
                    icon="time"
                    label={t("stats.timeMovies")}
                    value={formatTimeSpent(stats.movieWatchTimeMinutes, t)}
                />

                <StatCard
                    icon="time"
                    label={t("stats.timeShows")}
                    value={formatTimeSpent(stats.showWatchTimeMinutes, t)}
                />

                <SplitStatRow>
                    <StatCard icon="videocam" label={t("stats.episodesWatched")} value={stats.episodesWatched} halfWidth />
                    <StatCard icon="layers" label={t("stats.seasonsWatched")} value={stats.seasonsWatched} halfWidth />
                </SplitStatRow>

                <StatCard
                    icon="checkmark-done-circle"
                    label={t("stats.completionRate")}
                    value={`${stats.completionRate}%`}
                />

                <StatCard
                    icon="pause-circle"
                    label={t("stats.partiallySeen")}
                    value={stats.showsPartiallySeen}
                />

                {stats.topGenres.length > 0 && (
                    <GenreTable genres={stats.topGenres} title={t("stats.topGenres")} />
                )}

                <View style={styles.footerSpacer} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
    },
    loadingText: {
        color: Colors.metalSilver,
        fontSize: 16,
        fontStyle: "italic",
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    backButton: {
        marginLeft: 0,
        padding: 4,
    },
    footerSpacer: {
        height: 40,
    },
});
