// src/components/home/HomeSection.tsx
import React, { memo, useCallback, useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors, Fonts } from "../../constants/Colors";
import type { Movie, TVShow } from "../../lib/tmdb";
import type { MediaType } from "../../types/homeScreen.types";
import { useContentStore } from "../../stores/contentStore";
import { useVoteStore } from "../../stores/voteStore";
import MovieCard from "../MovieCard";

// ─── Stable card width for horizontal lists ──────────────────────────────────
const SCREEN_WIDTH = Dimensions.get("window").width;
const HORIZONTAL_CARD_WIDTH = (SCREEN_WIDTH - 44) / 3;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ContentActionHandlers {
    readonly onToggleFavorite: (id: number, type: MediaType) => Promise<void>;
    readonly onToggleWatchlist: (id: number, type: MediaType) => Promise<void>;
    readonly onToggleWatched: (id: number, type: MediaType) => Promise<void>;
    readonly onVote: (id: number, type: MediaType, vote: number) => Promise<void>;
}

interface HomeSectionProps extends ContentActionHandlers {
    readonly title: string;
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly data: ReadonlyArray<Movie | TVShow>;
    readonly mediaType: MediaType;
    readonly onViewAll?: () => void;
}

export type { ContentActionHandlers };

// ─── Individual card wrapper (subscribes to its own store slices) ─────────────

interface SectionCardProps extends ContentActionHandlers {
    readonly item: Movie | TVShow;
    readonly mediaType: MediaType;
}

const SectionCard = memo(function SectionCard({
    item,
    mediaType,
    onToggleFavorite,
    onToggleWatchlist,
    onToggleWatched,
    onVote,
}: SectionCardProps) {
    const isFavorite = useContentStore((s) => s.isFavorite(item.id, mediaType));
    const inWatchlist = useContentStore((s) => s.isInWatchlist(item.id, mediaType));
    const isWatched = useContentStore((s) => s.isWatched(item.id, mediaType));
    const communityRating = useVoteStore((s) => s.getCommunityScore(item.id, mediaType)?.avg);
    const userVote = useVoteStore((s) => s.getUserVote(item.id, mediaType));

    return (
        <View style={styles.cardWrapper}>
            <MovieCard
                item={item}
                mediaType={mediaType}
                isFavorite={isFavorite}
                inWatchlist={inWatchlist}
                isWatched={isWatched}
                communityRating={communityRating}
                userVote={userVote}
                onToggleFavorite={() => onToggleFavorite(item.id, mediaType)}
                onToggleWatchlist={() => onToggleWatchlist(item.id, mediaType)}
                onToggleWatched={() => onToggleWatched(item.id, mediaType)}
                onVote={(vote) => onVote(item.id, mediaType, vote)}
                fullWidth
            />
        </View>
    );
});

// ─── HomeSection ─────────────────────────────────────────────────────────────

const ITEM_WIDTH = HORIZONTAL_CARD_WIDTH + 12; // card + gap

export const HomeSection = memo(function HomeSection({
    title,
    icon,
    data,
    mediaType,
    onViewAll,
    onToggleFavorite,
    onToggleWatchlist,
    onToggleWatched,
    onVote,
}: HomeSectionProps) {
    const { t } = useTranslation();

    // ─── Sticky State ────────────────────────────────────────────────────────
    // Keeps items visible even if the parent hook removes them after interaction.
    // Reset when the section unmounts (e.g. navigation).
    const [stickyItems, setStickyItems] = useState<ReadonlyArray<Movie | TVShow>>([]);

    const handleInteraction = useCallback((item: Movie | TVShow) => {
        setStickyItems((prev) => {
            if (prev.some((pi) => pi.id === item.id)) return prev;
            return [...prev, item];
        });
    }, []);

    // ─── Wrapped Handlers ───────────────────────────────────────────────────
    const wrappedToggleFavorite = useCallback(async (id: number, type: MediaType) => {
        const item = data.find(d => d.id === id);
        if (item) handleInteraction(item);
        await onToggleFavorite(id, type);
    }, [data, handleInteraction, onToggleFavorite]);

    const wrappedToggleWatchlist = useCallback(async (id: number, type: MediaType) => {
        const item = data.find(d => d.id === id);
        if (item) handleInteraction(item);
        await onToggleWatchlist(id, type);
    }, [data, handleInteraction, onToggleWatchlist]);

    const wrappedToggleWatched = useCallback(async (id: number, type: MediaType) => {
        const item = data.find(d => d.id === id);
        if (item) handleInteraction(item);
        await onToggleWatched(id, type);
    }, [data, handleInteraction, onToggleWatched]);

    const wrappedVote = useCallback(async (id: number, type: MediaType, vote: number) => {
        const item = data.find(d => d.id === id);
        if (item) handleInteraction(item);
        await onVote(id, type, vote);
    }, [data, handleInteraction, onVote]);

    // ─── Merge Data ──────────────────────────────────────────────────────────
    // Merge current data with sticky items, maintaining data order when possible.
    const mergedData = useMemo(() => {
        const stickyNotInData = stickyItems.filter(si => !data.some(d => d.id === si.id));
        return [...data, ...stickyNotInData];
    }, [data, stickyItems]);

    const displayData = useMemo(() => {
        return mergedData.length > 10 ? mergedData.slice(0, 10) : mergedData;
    }, [mergedData]);

    const renderItem = useCallback(
        ({ item }: { item: Movie | TVShow }) => (
            <SectionCard
                item={item}
                mediaType={mediaType}
                onToggleFavorite={wrappedToggleFavorite}
                onToggleWatchlist={wrappedToggleWatchlist}
                onToggleWatched={wrappedToggleWatched}
                onVote={wrappedVote}
            />
        ),
        [mediaType, wrappedToggleFavorite, wrappedToggleWatchlist, wrappedToggleWatched, wrappedVote],
    );

    const getItemLayout = useCallback(
        (_: ArrayLike<Movie | TVShow> | null | undefined, index: number) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
        }),
        [],
    );

    const keyExtractor = useCallback(
        (item: Movie | TVShow) => `${mediaType}-section-${item.id}`,
        [mediaType],
    );

    if (!data || data.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Ionicons name={icon} size={20} color={Colors.vibrantRed} />
                    <Text style={styles.title}>{title}</Text>
                </View>
                {onViewAll && (
                    <TouchableOpacity style={styles.viewAll} onPress={onViewAll}>
                        <Text style={styles.viewAllText}>{t("common.viewAll")}</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.metalSilver} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={displayData}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                getItemLayout={getItemLayout}
                initialNumToRender={4}
                maxToRenderPerBatch={3}
                windowSize={3}
                removeClippedSubviews={false}
            />
        </View>
    );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.bebas,
        color: Colors.white,
        letterSpacing: 0.5,
    },
    viewAll: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 4,
        paddingLeft: 12,
    },
    viewAllText: {
        fontSize: 14,
        fontFamily: Fonts.bebas,
        color: Colors.metalSilver,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    listContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    cardWrapper: {
        width: HORIZONTAL_CARD_WIDTH,
    },
});