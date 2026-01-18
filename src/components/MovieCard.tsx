import React, { JSX } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getImageUrl, type Movie, type TVShow } from "../lib/tmdb";
import { Colors } from "../constants/Colors";

/**
 * Media type for content operations
 */
type MediaType = "movie" | "tv";

/**
 * Props for MovieCard component
 * Marked as readonly to prevent mutation
 */
interface MovieCardProps {
    readonly item: Movie | TVShow;
    readonly mediaType: MediaType;
    readonly isFavorite?: boolean;
    readonly inWatchlist?: boolean;
    readonly isWatched?: boolean;
    readonly onToggleFavorite?: () => void;
    readonly onToggleWatchlist?: () => void;
    readonly onToggleWatched?: () => void;
    readonly onRecommend?: () => void;
}

/**
 * Type guard to check if item is a Movie
 */
const isMovie = (item: Movie | TVShow): item is Movie => {
    return "title" in item;
};

/**
 * Gets the display title for the content
 */
const getTitle = (item: Movie | TVShow): string => {
    return isMovie(item) ? item.title : item.name;
};

/**
 * Gets the release/air date for the content
 */
const getReleaseDate = (item: Movie | TVShow): string | undefined => {
    return isMovie(item) ? item.release_date : item.first_air_date;
};

/**
 * Extracts year from date string
 */
const extractYear = (date: string | undefined): string => {
    if (!date) return "";
    return date.split("-")[0];
};

/**
 * Formats rating to single decimal
 */
const formatRating = (rating: number): string => {
    return rating.toFixed(1);
};

/**
 * Card component for displaying movie/TV show in a grid
 */
export default function MovieCard({
    item,
    mediaType,
    isFavorite = false,
    inWatchlist = false,
    isWatched = false,
    onToggleFavorite,
    onToggleWatchlist,
    onToggleWatched,
}: Readonly<MovieCardProps>): JSX.Element {
    const posterUrl = getImageUrl(item.poster_path, "w300");
    const title = getTitle(item);
    const year = extractYear(getReleaseDate(item));
    const rating = formatRating(item.vote_average);

    const handlePress = (): void => {
        const path = mediaType === "movie"
            ? `/movie/${item.id}`
            : `/tv/${item.id}`;
        router.push(path as Parameters<typeof router.push>[0]);
    };

    const handleToggleFavorite = (e: { stopPropagation: () => void }): void => {
        e.stopPropagation();
        onToggleFavorite?.();
    };

    const handleToggleWatchlist = (e: { stopPropagation: () => void }): void => {
        e.stopPropagation();
        onToggleWatchlist?.();
    };

    const handleToggleWatched = (e: { stopPropagation: () => void }): void => {
        e.stopPropagation();
        onToggleWatched?.();
    };

    const renderPoster = (): JSX.Element => {
        if (posterUrl) {
            return (
                <Image
                    source={{ uri: posterUrl }}
                    style={styles.poster}
                    contentFit="cover"
                />
            );
        }

        return (
            <View style={styles.posterPlaceholder}>
                <Text style={styles.posterPlaceholderIcon}>
                    {mediaType === "movie" ? "🎬" : "📺"}
                </Text>
            </View>
        );
    };

    const renderWatchedOverlay = (): JSX.Element | null => {
        if (!isWatched) return null;

        return (
            <View style={styles.watchedOverlay}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
            </View>
        );
    };

    const renderQuickActions = (): JSX.Element | null => {
        if (!onToggleFavorite && !onToggleWatchlist && !onToggleWatched) {
            return null;
        }

        return (
            <View style={styles.quickActions}>
                {onToggleFavorite && (
                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={handleToggleFavorite}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons
                            name={isFavorite ? "skull" : "skull-outline"}
                            size={16}
                            color={isFavorite ? Colors.bloodRed : Colors.metalSilver}
                        />
                    </TouchableOpacity>
                )}
                {onToggleWatchlist && (
                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={handleToggleWatchlist}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons
                            name={inWatchlist ? "bookmark" : "bookmark-outline"}
                            size={16}
                            color={inWatchlist ? Colors.bloodRed : Colors.metalSilver}
                        />
                    </TouchableOpacity>
                )}
                {onToggleWatched && (
                    <TouchableOpacity
                        style={styles.quickActionButton}
                        onPress={handleToggleWatched}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons
                            name={isWatched ? "eye" : "eye-outline"}
                            size={16}
                            color={isWatched ? Colors.bloodRed : Colors.metalSilver}
                        />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <View style={styles.posterContainer}>
                {renderPoster()}
                {renderWatchedOverlay()}
                {renderQuickActions()}
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={2}>
                    {title}
                </Text>
                <View style={styles.metaRow}>
                    {year && <Text style={styles.year}>{year}</Text>}
                    <Text style={styles.rating}>⭐ {rating}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "31%",
        marginBottom: 16,
    } as ViewStyle,
    posterContainer: {
        position: "relative",
        aspectRatio: 2 / 3,
        borderRadius: 8,
        overflow: "hidden",
    } as ViewStyle,
    poster: {
        width: "100%",
        height: "100%",
    } as ImageStyle,
    posterPlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: Colors.metalGray,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    posterPlaceholderIcon: {
        fontSize: 32,
    } as TextStyle,
    watchedOverlay: {
        position: "absolute",
        top: 4,
        right: 4,
        backgroundColor: "rgba(220, 38, 38, 0.8)",
        borderRadius: 12,
        padding: 2,
    } as ViewStyle,
    quickActions: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "rgba(10, 10, 10, 0.8)",
        paddingVertical: 6,
    } as ViewStyle,
    quickActionButton: {
        padding: 4,
    } as ViewStyle,
    infoContainer: {
        marginTop: 8,
    } as ViewStyle,
    title: {
        color: "#f4f4f5",
        fontSize: 12,
        fontWeight: "600",
    } as TextStyle,
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
    } as ViewStyle,
    year: {
        color: Colors.metalSilver,
        fontSize: 10,
    } as TextStyle,
    rating: {
        color: "#eab308",
        fontSize: 10,
    } as TextStyle,
});