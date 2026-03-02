import React, { useRef, memo, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    ViewToken,
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

const { width } = Dimensions.get("window");
const HERO_HEIGHT = 280;

interface HeroCarouselProps {
    data: (Movie | TVShow)[];
    mediaType: MediaType;
    isScrolling?: boolean;
}

const PaginationDot = memo(({ index, activeIndex }: { index: number; activeIndex: SharedValue<number> }) => {
    const dotStyle = useAnimatedStyle(() => {
        const isActive = activeIndex.value === index;
        return {
            width: isActive ? 12 : 6,
            backgroundColor: isActive ? Colors.vibrantRed : "rgba(255, 255, 255, 0.6)",
            opacity: isActive ? 1 : 0.5,
        };
    });

    return (
        <Animated.View
            style={[styles.dot, dotStyle]}
        />
    );
});

export const HeroCarousel = ({ data, mediaType, isScrolling = false }: HeroCarouselProps) => {
    const activeIndex = useSharedValue(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    // Only show top 5 in hero
    const heroData = data?.slice(0, 5) || [];

    const startAutoScroll = () => {
        if (scrollTimerRef.current) clearInterval(scrollTimerRef.current);
        if (isScrolling) return; // Don't start if user is scrolling the main feed

        scrollTimerRef.current = setInterval(() => {
            if (heroData.length === 0) return;
            // The displayed index in flat list is `activeIndex + 1`
            let nextDisplayedIndex = activeIndex.value + 1 + 1;

            // Allow momentum scroll end to catch the reset boundary
            flatListRef.current?.scrollToIndex({ index: nextDisplayedIndex, animated: true });
        }, 5000); // 5 seconds
    };

    const stopAutoScroll = () => {
        if (scrollTimerRef.current) clearInterval(scrollTimerRef.current);
    };

    const hasInitialScrolled = useRef(false);

    useEffect(() => {
        if (heroData.length > 0) {
            if (!hasInitialScrolled.current) {
                // Start at the real first item (index 1 in the duplicated array)
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({ index: 1, animated: false });
                    hasInitialScrolled.current = true;
                }, 100);
            }

            if (isScrolling) {
                stopAutoScroll();
            } else {
                startAutoScroll();
            }
        }
        return () => stopAutoScroll();
    }, [heroData.length, isScrolling]);

    if (!data || data.length === 0) return null;

    // Create a loop array: [last, 0, 1, 2, 3, 4, first]
    const loopData = heroData.length > 0 ? [
        heroData[heroData.length - 1],
        ...heroData,
        heroData[0]
    ] : [];

    const onScrollEnd = (e: any) => {
        const xOffset = e.nativeEvent.contentOffset.x;
        const index = Math.round(xOffset / width);

        // If we scrolled to the clone of the last item (at the very beginning)
        if (index === 0) {
            flatListRef.current?.scrollToIndex({ index: heroData.length, animated: false });
            activeIndex.value = heroData.length - 1;
        }
        // If we scrolled to the clone of the first item (at the very end)
        else if (index === loopData.length - 1) {
            flatListRef.current?.scrollToIndex({ index: 1, animated: false });
            activeIndex.value = 0;
        }
        else {
            activeIndex.value = index - 1;
        }
    };

    const renderItem = ({ item }: { item: Movie | TVShow }) => {
        const title = "title" in item ? item.title : item.name;
        const backdropUrl = getImageUrl(item.backdrop_path, "original");

        const handlePress = () => {
            const path = mediaType === "movie"
                ? `/movie/${item.id}`
                : `/tv/${item.id}`;
            router.push(path as Parameters<typeof router.push>[0]);
        };

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
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={loopData}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `hero-${item.id}-${index}`}
                onScrollBeginDrag={stopAutoScroll}
                onScrollEndDrag={startAutoScroll}
                onMomentumScrollEnd={onScrollEnd}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
            />
            <View style={styles.pagination}>
                {heroData.map((_, index) => (
                    <PaginationDot
                        key={`dot-${index}`}
                        index={index}
                        activeIndex={activeIndex}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: HERO_HEIGHT,
        marginBottom: 20,
    },
    heroItem: {
        width: width,
        height: HERO_HEIGHT,
        position: "relative",
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
        bottom: 30,
        left: 16,
        right: 16,
    },
    heroTitle: {
        fontSize: 28,
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
        bottom: 12,
        width: "100%",
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
});
