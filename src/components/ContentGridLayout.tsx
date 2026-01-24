import React, { JSX } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import { router } from "expo-router";

import { Colors } from "../constants/Colors";
import MovieCard from "./MovieCard";
import type { EnrichedContentItem } from "../hooks/useEnrichedContent";

interface ContentGridLayoutProps {
    readonly data: EnrichedContentItem[];
    readonly isLoading: boolean;
    readonly isAuthenticated: boolean;
    readonly emptyTitle: string;
    readonly emptySubtitle: string;
    readonly emptyIcon: string;
    readonly onToggleFavorite?: (tmdbId: number, mediaType: "movie" | "tv") => void;
    readonly onToggleWatchlist?: (tmdbId: number, mediaType: "movie" | "tv") => void;
    readonly onToggleWatched?: (tmdbId: number, mediaType: "movie" | "tv") => void;
    readonly isFavorite?: (tmdbId: number, mediaType: "movie" | "tv") => boolean;
    readonly isInWatchlist?: (tmdbId: number, mediaType: "movie" | "tv") => boolean;
    readonly isWatched?: (tmdbId: number, mediaType: "movie" | "tv") => boolean;
}

/**
 * Grid layout for favorites/watchlist screens matching the home screen style.
 * Displays content in a 3-column poster grid using MovieCard.
 */
export function ContentGridLayout({
    data,
    isLoading,
    isAuthenticated,
    emptyTitle,
    emptySubtitle,
    emptyIcon,
    onToggleFavorite,
    onToggleWatchlist,
    onToggleWatched,
    isFavorite,
    isInWatchlist,
    isWatched,
}: Readonly<ContentGridLayoutProps>): JSX.Element {
    if (!isAuthenticated) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.largeIcon}>🔒</Text>
                <Text style={styles.emptyTitle}>Inicia sesión para ver tu lista</Text>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => router.push("/login")}
                >
                    <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isLoading && data.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.bloodRed} />
            </View>
        );
    }

    if (data.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.largeIcon}>{emptyIcon}</Text>
                <Text style={styles.emptyTitle}>{emptyTitle}</Text>
                <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
            </View>
        );
    }

    const renderItem = ({ item }: { item: EnrichedContentItem }): JSX.Element => {
        // Convert EnrichedContentItem to the shape MovieCard expects
        const cardItem = {
            id: item.tmdb_id,
            title: item.title,
            name: item.title,
            poster_path: item.poster_path,
            backdrop_path: null,
            vote_average: item.vote_average,
            release_date: "",
            first_air_date: "",
            overview: "",
            original_title: item.title,
            original_name: item.title,
            vote_count: 0,
            genre_ids: [],
            popularity: 0,
        };

        return (
            <MovieCard
                item={cardItem}
                mediaType={item.media_type}
                isFavorite={isFavorite?.(item.tmdb_id, item.media_type)}
                inWatchlist={isInWatchlist?.(item.tmdb_id, item.media_type)}
                isWatched={isWatched?.(item.tmdb_id, item.media_type)}
                onToggleFavorite={
                    onToggleFavorite
                        ? () => onToggleFavorite(item.tmdb_id, item.media_type)
                        : undefined
                }
                onToggleWatchlist={
                    onToggleWatchlist
                        ? () => onToggleWatchlist(item.tmdb_id, item.media_type)
                        : undefined
                }
                onToggleWatched={
                    onToggleWatched
                        ? () => onToggleWatched(item.tmdb_id, item.media_type)
                        : undefined
                }
            />
        );
    };

    return (
        <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.media_type}-${item.tmdb_id}`}
            numColumns={3}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
        />
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    } as ViewStyle,
    largeIcon: {
        fontSize: 60,
        marginBottom: 16,
    } as TextStyle,
    emptyTitle: {
        color: "#f4f4f5",
        fontSize: 18,
        textAlign: "center",
        marginBottom: 8,
    } as TextStyle,
    emptySubtitle: {
        color: Colors.metalSilver,
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
    } as TextStyle,
    loginButton: {
        backgroundColor: Colors.bloodRed,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
        marginTop: 16,
    } as ViewStyle,
    loginButtonText: {
        color: Colors.metalBlack,
        fontWeight: "bold",
        textTransform: "uppercase",
    } as TextStyle,
    columnWrapper: {
        paddingHorizontal: 8,
        justifyContent: "center",
        gap: 12,
    } as ViewStyle,
    listContent: {
        paddingBottom: 20,
    } as ViewStyle,
});

export default ContentGridLayout;
