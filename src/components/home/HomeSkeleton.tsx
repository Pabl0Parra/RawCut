import React from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Skeleton } from "../Skeleton";

const { width } = Dimensions.get("window");

export const HeroSkeleton = () => (
    <View style={styles.heroContainer}>
        <Skeleton width="100%" height={550} borderRadius={0} />
        <View style={styles.heroOverlay}>
            <Skeleton width={200} height={40} borderRadius={4} style={{ marginBottom: 16 }} />
            <Skeleton width={150} height={20} borderRadius={4} style={{ marginBottom: 24 }} />
            <View style={styles.heroButtons}>
                <Skeleton width={120} height={45} borderRadius={25} />
                <Skeleton width={120} height={45} borderRadius={25} />
            </View>
        </View>
    </View>
);

export const CarouselSkeleton = () => (
    <View style={styles.carouselContainer}>
        <Skeleton width={150} height={24} borderRadius={4} style={{ marginBottom: 16, marginLeft: 16 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16 }}>
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width={140} height={210} borderRadius={12} style={{ marginRight: 12 }} />
            ))}
        </ScrollView>
    </View>
);

export const HomeSkeleton = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <HeroSkeleton />
        <View style={{ marginTop: 24 }}>
            <CarouselSkeleton />
            <CarouselSkeleton />
            <CarouselSkeleton />
        </View>
    </ScrollView>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    heroContainer: {
        width: "100%",
        height: 550,
        position: "relative",
    },
    heroOverlay: {
        position: "absolute",
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: "center",
        paddingHorizontal: 20,
    },
    heroButtons: {
        flexDirection: "row",
        gap: 12,
    },
    carouselContainer: {
        marginBottom: 32,
    },
});
