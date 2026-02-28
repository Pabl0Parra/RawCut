import React, { JSX, memo, useMemo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { VotePicker } from "./VotePicker";

import { getImageUrl, type Movie, type TVShow } from "../lib/tmdb";
import { Colors } from "../constants/Colors";

type MediaType = "movie" | "tv";

interface MovieCardProps {
    readonly item: Movie | TVShow;
    readonly mediaType: MediaType;
    readonly isFavorite?: boolean;
    readonly inWatchlist?: boolean;
    readonly isWatched?: boolean;
    readonly communityRating?: number;
    readonly userVote?: number;
    readonly onToggleFavorite?: () => void;
    readonly onToggleWatchlist?: () => void;
    readonly onToggleWatched?: () => void;
    readonly onVote?: (vote: number) => void;
    readonly onRecommend?: () => void;
    readonly fullWidth?: boolean;
}

const isMovie = (item: Movie | TVShow): item is Movie => {
    return "title" in item;
};

const getTitle = (item: Movie | TVShow): string => {
    return isMovie(item) ? item.title : item.name;
};

const getReleaseDate = (item: Movie | TVShow): string | undefined => {
    return isMovie(item) ? item.release_date : item.first_air_date;
};

const extractYear = (date: string | undefined): string => {
    if (!date) return "";
    return date.split("-")[0];
};

const formatRating = (rating: number): string => {
    return rating.toFixed(1);
};

interface ActionButtonProps {
    isActive: boolean;
    activeIcon: keyof typeof Ionicons.glyphMap;
    inactiveIcon: keyof typeof Ionicons.glyphMap;
    activeLabel: string;
    inactiveLabel: string;
    onPress?: () => void;
    iconFamily?: "Ionicons";
}

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
        return null;
    }

    return (
        <TouchableOpacity
            style={styles.quickActionButton}
            onPress={onPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={isActive ? activeLabel : inactiveLabel}
        >
            {iconFamily === "Ionicons" && (
                <Ionicons name={iconName} size={16} color={color} />
            )}
        </TouchableOpacity>
    );
};

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
    const { t } = useTranslation();
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
                    accessibilityLabel={t("movieCard.posterAltText", { title: title })}
                />
            );
        }

        return (
            <View style={styles.posterPlaceholder} accessibilityLabel={t("movieCard.noPosterAltText", { title: title })}>
                <Text style={styles.posterPlaceholderIcon}>
                    {mediaType === "movie" ? "🎬" : "📺"}
                </Text>
            </View>
        );
    };

    const renderWatchedOverlay = (): JSX.Element | null => {
        if (!isWatched) return null;

        return (
            <View style={styles.watchedOverlay} accessibilityLabel={t("common.watched")}>
                <Ionicons name="checkmark-circle" size={28} color={Colors.white} />
                <Text style={styles.watchedText}>{t("common.watched")}</Text>
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
                        accessibilityLabel={isFavorite ? t("movieCard.removeFavorite") : t("movieCard.addFavorite")}
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
                        accessibilityLabel={inWatchlist ? t("movieCard.removeFromWatchlist") : t("movieCard.addToWatchlist")}
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

        if (releaseDate > today) return false;

        const diffTime = Math.abs(today.getTime() - releaseDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 14;
    };

    const releaseDate = useMemo(() => getReleaseDate(item), [item]);
    const showNewBadge = useMemo(() => isNewRelease(releaseDate), [releaseDate]);

    const renderNewBadge = (): JSX.Element | null => {
        if (!showNewBadge) return null;

        return (
            <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>{t("common.new")}</Text>
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
                                👥 {communityRating === undefined
                                    ? "—"
                                    : communityRating.toFixed(1)}
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
