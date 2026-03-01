import React, { useRef } from "react";
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
    withSpring,
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
}

export const HeroCarousel = ({ data, mediaType }: HeroCarouselProps) => {
    const scrollX = useSharedValue(0);
    const activeIndex = useSharedValue(0);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            activeIndex.value = viewableItems[0].index;
        }
    }).current;

    if (!data || data.length === 0) return null;

    // Only show top 5 in hero
    const heroData = data.slice(0, 5);

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
                data={heroData}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                keyExtractor={(item) => `hero-${item.id}`}
            />
            <View style={styles.pagination}>
                {heroData.map((_, index) => {
                    const dotStyle = useAnimatedStyle(() => {
                        const isActive = activeIndex.value === index;
                        return {
                            width: isActive ? 12 : 6,
                            backgroundColor: isActive ? Colors.vibrantRed : Colors.whiteOpacity60,
                            opacity: isActive ? 1 : 0.5,
                        };
                    });

                    return (
                        <Animated.View
                            key={`dot-${index}`}
                            style={[styles.dot, dotStyle]}
                        />
                    );
                })}
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
