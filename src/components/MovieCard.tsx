import React, { JSX, memo, useMemo, useCallback, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { VotePicker } from "./VotePicker";

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
    readonly communityRating?: number;  // aggregated 0–10
    readonly userVote?: number;          // this user's vote 0–10
    readonly onToggleFavorite?: () => void;
    readonly onToggleWatchlist?: () => void;
    readonly onToggleWatched?: () => void;
    readonly onVote?: (vote: number) => void;
    readonly onRecommend?: () => void;
    readonly fullWidth?: boolean;
}

// ─── Vote Picker ──────────────────────────────────────────────────────────────

// ─── Vote Picker ──────────────────────────────────────────────────────────────
// Replaced by shared component from ./VotePicker.tsx


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
 * Props for ActionButton component
 */
interface ActionButtonProps {
    isActive: boolean;
    activeIcon: keyof typeof Ionicons.glyphMap;
    inactiveIcon: keyof typeof Ionicons.glyphMap;
    activeLabel: string;
    inactiveLabel: string;
    onPress?: () => void;
    iconFamily?: "Ionicons"; // Extend if other icon families are used
}

/**
 * Reusable action button for quick actions
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
    isActive,
    activeIcon,
    inactiveIcon,
    activeLabel,
    inactiveLabel,
    onPress,
    iconFamily = "Ionicons",
}) => {
    const iconName = isActive ? activeIcon : inactiveIcon;
    const color = isActive ? Colors.bloodRed : Colors.metalSilver;

    if (!onPress) {
        return null; // Don't render if no action is provided
    }

    return (
        <TouchableOpacity
            style={styles.quickActionButton}
            onPress={onPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            {iconFamily === "Ionicons" && (
                <Ionicons name={iconName} size={16} color={color} />
            )}
        </TouchableOpacity>
    );
};

/**
 * Card component for displaying movie/TV show in a grid.
 * Memoized to prevent re-renders unless essential props change.
 */
const MovieCard = memo(function MovieCard({
    item,
    mediaType,
    isFavorite = false,
    inWatchlist = false,
    isWatched = false,
    communityRating,
    userVote,
    onToggleFavorite,
    onToggleWatchlist,
    onToggleWatched,
    onVote,
    fullWidth = false,
}: Readonly<MovieCardProps>): JSX.Element {
    const [showVotePicker, setShowVotePicker] = useState(false);
    const posterUrl = useMemo(() => getImageUrl(item.poster_path, "w300"), [item.poster_path]);
    const title = useMemo(() => getTitle(item), [item]);
    const year = useMemo(() => extractYear(getReleaseDate(item)), [item]);
    const rating = useMemo(() => formatRating(item.vote_average), [item.vote_average]);

    const handlePress = useCallback((): void => {
        const path = mediaType === "movie"
            ? `/movie/${item.id}`
            : `/tv/${item.id}`;
        router.push(path as Parameters<typeof router.push>[0]);
    }, [item.id, mediaType]);

    const renderPoster = (): JSX.Element => {
        if (posterUrl) {
            return (
                <Image
                    source={{ uri: posterUrl }}
                    style={styles.poster}
                    contentFit="cover"
                    transition={200}
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
                <Ionicons name="checkmark-circle" size={28} color={Colors.white} />
                <Text style={styles.watchedText}>VISTO</Text>
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
                        onPress={onToggleFavorite}
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
                        onPress={onToggleWatchlist}
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
                        onPress={onToggleWatched}
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

    const isNewRelease = (dateString?: string): boolean => {
        if (!dateString) return false;
        const releaseDate = new Date(dateString);
        const today = new Date();

        // Don't show for future releases
        if (releaseDate > today) return false;

        const diffTime = Math.abs(today.getTime() - releaseDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Extend to 14 days
        return diffDays <= 14;
    };

    const releaseDate = useMemo(() => getReleaseDate(item), [item]);
    const showNewBadge = useMemo(() => isNewRelease(releaseDate), [releaseDate]);

    const renderNewBadge = (): JSX.Element | null => {
        if (!showNewBadge) return null;

        return (
            <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NUEVO</Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, fullWidth && styles.fullWidthContainer]}>
            <View style={styles.posterContainer}>
                <TouchableOpacity
                    onPress={handlePress}
                    activeOpacity={0.8}
                    style={StyleSheet.absoluteFill}
                >
                    {renderPoster()}
                </TouchableOpacity>

                {renderWatchedOverlay()}
                {renderNewBadge()}
                {renderQuickActions()}
            </View>

            <TouchableOpacity
                style={styles.infoContainer}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <Text style={styles.title} numberOfLines={2}>
                    {title}
                </Text>
                <View style={styles.metaRow}>
                    {!!year && <Text style={styles.year}>{year}</Text>}
                    <View style={styles.ratingsRow}>
                        <Text style={styles.rating}>⭐ {rating}</Text>
                        <TouchableOpacity
                            onPress={() => setShowVotePicker(true)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                            <Text style={styles.communityRating}>
                                👥 {communityRating !== undefined
                                    ? communityRating.toFixed(1)
                                    : "—"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {showVotePicker && (
                    <VotePicker
                        current={userVote}
                        onSelect={(v) => onVote?.(v)}
                        onClose={() => setShowVotePicker(false)}
                    />
                )}
            </TouchableOpacity>
        </View>
    );
}, (prevProps: Readonly<MovieCardProps>, nextProps: Readonly<MovieCardProps>) => {
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.isFavorite === nextProps.isFavorite &&
        prevProps.inWatchlist === nextProps.inWatchlist &&
        prevProps.isWatched === nextProps.isWatched &&
        prevProps.mediaType === nextProps.mediaType &&
        prevProps.communityRating === nextProps.communityRating &&
        prevProps.userVote === nextProps.userVote
    );
});

export default MovieCard;

const styles = StyleSheet.create({
    container: {
        width: "30%",
        marginBottom: 16,
        gap: 4,
    } as ViewStyle,
    fullWidthContainer: {
        width: "100%",
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.glassRed,
        justifyContent: "center",
        alignItems: "center",
    } as ViewStyle,
    watchedText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: "bold",
        marginTop: 4,
        fontFamily: "BebasNeue_400Regular",
        letterSpacing: 1,
    } as TextStyle,
    newBadge: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: Colors.vibrantRed,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        zIndex: 10,
        // Add elevation/shadow for premium feel
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    } as ViewStyle,
    newBadgeText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: "900",
        letterSpacing: 1,
        fontFamily: "Inter_700Bold",
        textTransform: "uppercase",
    } as TextStyle,
    quickActions: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: Colors.overlayDark,
        paddingVertical: 6,
        zIndex: 20,
    } as ViewStyle,
    quickActionButton: {
        padding: 4,
    } as ViewStyle,
    infoContainer: {
        marginTop: 8,
    } as ViewStyle,
    title: {
        color: Colors.textPrimary,
        fontSize: 12,
        fontWeight: "600",
    } as TextStyle,
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
    } as ViewStyle,
    ratingsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    } as ViewStyle,
    year: {
        color: Colors.metalSilver,
        fontSize: 10,
    } as TextStyle,
    rating: {
        color: Colors.tmdbYellow,
        fontSize: 10,
    } as TextStyle,
    communityRating: {
        color: Colors.communityPurple,
        fontSize: 10,
    } as TextStyle,
});

// ─── VotePicker styles ────────────────────────────────────────────────────────
// styles (vp) moved to VotePicker.tsx
