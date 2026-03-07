import React, { useRef, memo, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    type NativeSyntheticEvent,
    type NativeScrollEvent,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    type SharedValue,
} from "react-native-reanimated";
import { router } from "expo-router";
import { Colors, Fonts } from "../../constants/Colors";
import { getImageUrl, type Movie, type TVShow } from "../../lib/tmdb";
import type { MediaType } from "../../types/homeScreen.types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = 280;
const ITEM_HEIGHT = 157.5; // 280 * 9/16
const ITEM_SPACING = 16;
const SNAP_INTERVAL = ITEM_WIDTH + ITEM_SPACING;

// ─── Pagination Dot ──────────────────────────────────────────────────────────

interface PaginationDotProps {
    readonly index: number;
    readonly activeIndex: SharedValue<number>;
}

const PaginationDot = memo(function PaginationDot({ index, activeIndex }: PaginationDotProps) {
    const dotStyle = useAnimatedStyle(() => {
        const isActive = activeIndex.value === index;
        return {
            width: isActive ? 12 : 6,
            backgroundColor: isActive ? Colors.vibrantRed : "rgba(255, 255, 255, 0.6)",
            opacity: isActive ? 1 : 0.5,
        };
    });

    return <Animated.View style={[styles.dot, dotStyle]} />;
});

// ─── Individual Hero Card ────────────────────────────────────────────────────
// Extracted so the parent FlatList's renderItem is a stable reference.

interface HeroCardRenderInfo {
    readonly item: Movie | TVShow;
}

interface HeroCardProps {
    readonly item: Movie | TVShow;
    readonly mediaType: MediaType;
}

const HeroCard = memo(function HeroCard({ item, mediaType }: HeroCardProps) {
    const title = "title" in item ? item.title : item.name;
    const backdropUrl = getImageUrl(item.backdrop_path, "original");

    const handlePress = useCallback(() => {
        const path = mediaType === "movie"
            ? `/movie/${item.id}`
            : `/tv/${item.id}`;
        router.push(path as Parameters<typeof router.push>[0]);
    }, [item.id, mediaType]);

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePress}
            style={styles.heroItem}
        >
            <Image
                source={{ uri: backdropUrl ?? "" }}
                style={styles.backdrop}
                contentFit="cover"
                transition={300}
            />
            <LinearGradient
                colors={["transparent", "rgba(10, 10, 10, 0.5)", Colors.metalBlack]}
                style={styles.gradient}
            />
            <View style={styles.heroContent}>
                <Text style={styles.heroTitle} numberOfLines={2}>
                    {title}
                </Text>
            </View>
        </TouchableOpacity>
    );
});

// ─── HeroCarousel ────────────────────────────────────────────────────────────

interface HeroCarouselProps {
    readonly data: ReadonlyArray<Movie | TVShow>;
    readonly mediaType: MediaType;
    readonly isScrolling?: boolean;
}

export const HeroCarousel = memo(function HeroCarousel({
    data,
    mediaType,
    isScrolling = false,
}: HeroCarouselProps) {
    const activeIndex = useSharedValue(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Keep mutable refs so the interval callback always reads fresh values
    const activeIndexRef = useRef(0);
    const isScrollingRef = useRef(isScrolling);
    isScrollingRef.current = isScrolling;

    const heroData = data.length > 0 ? data.slice(0, 5) : [];
    const heroDataLengthRef = useRef(heroData.length);
    heroDataLengthRef.current = heroData.length;

    // Looped data: [last, ...items, first] for infinite scroll illusion
    const loopData = heroData.length > 0
        ? [heroData[heroData.length - 1], ...heroData, heroData[0]]
        : [];

    const startAutoScroll = useCallback(() => {
        if (scrollTimerRef.current) clearInterval(scrollTimerRef.current);

        scrollTimerRef.current = setInterval(() => {
            if (heroDataLengthRef.current === 0 || isScrollingRef.current) return;

            let nextRealIndex = activeIndexRef.current + 1;

            if (nextRealIndex >= heroDataLengthRef.current) {
                // Animate smoothly to the trailing clone (looks exactly like the first movie)
                const trailingCloneIndex = heroDataLengthRef.current + 1;
                flatListRef.current?.scrollToIndex({ index: trailingCloneIndex, animated: true });

                // Immediately set dots to first element so it feels like we wrapped around
                activeIndexRef.current = 0;
                activeIndex.value = 0;

                // After the 300ms scroll animation finishes, silently snap to the real first element
                // so the NEXT slide has room to go to element 2 natively.
                setTimeout(() => {
                    if (isScrollingRef.current) return;
                    flatListRef.current?.scrollToIndex({ index: 1, animated: false });
                }, 400);
            } else {
                // Normal auto-scroll
                const nextDisplayedIndex = nextRealIndex + 1; // +1 to account for the leading clone
                flatListRef.current?.scrollToIndex({ index: nextDisplayedIndex, animated: true });
                activeIndexRef.current = nextRealIndex;
                activeIndex.value = nextRealIndex;
            }
        }, 5000);
    }, [activeIndex]);

    const stopAutoScroll = useCallback(() => {
        if (scrollTimerRef.current) {
            clearInterval(scrollTimerRef.current);
            scrollTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (heroData.length === 0) return;

        if (isScrolling) {
            stopAutoScroll();
        } else {
            startAutoScroll();
        }

        return stopAutoScroll;
    }, [heroData.length, isScrolling, startAutoScroll, stopAutoScroll]);

    const onMomentumScrollEnd = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const xOffset = e.nativeEvent.contentOffset.x;
            const index = Math.round(xOffset / SNAP_INTERVAL);
            const totalLoopItems = heroDataLengthRef.current + 2; // clones at both ends

            if (index === 0) {
                // Scrolled to the leading clone → jump to real last item
                flatListRef.current?.scrollToIndex({
                    index: heroDataLengthRef.current,
                    animated: false,
                });
                activeIndex.value = heroDataLengthRef.current - 1;
                activeIndexRef.current = heroDataLengthRef.current - 1;
            } else if (index === totalLoopItems - 1) {
                // Scrolled to the trailing clone → jump to real first item
                flatListRef.current?.scrollToIndex({ index: 1, animated: false });
                activeIndex.value = 0;
                activeIndexRef.current = 0;
            } else {
                activeIndex.value = index - 1;
                activeIndexRef.current = index - 1;
            }
        },
        [activeIndex],
    );

    const renderItem = useCallback(
        ({ item }: HeroCardRenderInfo) => (
            <HeroCard item={item} mediaType={mediaType} />
        ),
        [mediaType],
    );

    const keyExtractor = useCallback(
        (item: Movie | TVShow, index: number) => `hero-${item.id}-${index}`,
        [],
    );

    const getItemLayout = useCallback(
        (_: ArrayLike<Movie | TVShow> | null | undefined, index: number) => ({
            length: SNAP_INTERVAL,
            offset: SNAP_INTERVAL * index,
            index,
        }),
        [],
    );

    if (heroData.length === 0) return null;

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={loopData}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={keyExtractor}
                onScrollBeginDrag={stopAutoScroll}
                onScrollEndDrag={startAutoScroll}
                onMomentumScrollEnd={onMomentumScrollEnd}
                getItemLayout={getItemLayout}
                initialNumToRender={7}
                maxToRenderPerBatch={7}
                windowSize={11}
                initialScrollIndex={1}
                removeClippedSubviews={false}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 16 }}
            />
            <View style={styles.pagination}>
                {heroData.map((item, index) => (
                    <PaginationDot
                        key={`hero-dot-${item.id}`}
                        index={index}
                        activeIndex={activeIndex}
                    />
                ))}
            </View>
        </View>
    );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        height: ITEM_HEIGHT + 36, // Make room for dots
        marginBottom: 8,
    },
    heroItem: {
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        marginRight: ITEM_SPACING,
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: Colors.metalGray,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    backdrop: {
        width: "100%",
        height: "100%",
    },
    gradient: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: "70%",
    },
    heroContent: {
        position: "absolute",
        bottom: 12,
        left: 12,
        right: 12,
    },
    heroTitle: {
        fontSize: 18,
        fontFamily: Fonts.bebas,
        color: Colors.white,
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    pagination: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        position: "absolute",
        bottom: 0,
        width: "100%",
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
});