import React from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { getImageUrl } from "../lib/tmdb";
import type { EnrichedContentItem } from "../hooks/useEnrichedContent";

interface ContentListLayoutProps {
    readonly data: EnrichedContentItem[];
    readonly isLoading: boolean;
    readonly isAuthenticated: boolean;
    readonly emptyTitle: string;
    readonly emptySubtitle: string;
    readonly emptyIcon: string;
    readonly onRemove: (tmdbId: number, mediaType: "movie" | "tv") => void;
}

export function ContentListLayout({
    data,
    isLoading,
    isAuthenticated,
    emptyTitle,
    emptySubtitle,
    emptyIcon,
    onRemove,
}: Readonly<ContentListLayoutProps>) {
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

    const handlePress = (item: EnrichedContentItem) => {
        if (item.media_type === "movie") {
            router.push(`/movie/${item.tmdb_id}`);
        } else {
            router.push(`/tv/${item.tmdb_id}`);
        }
    };

    const renderItem = ({ item }: { item: EnrichedContentItem }) => {
        const posterUrl = getImageUrl(item.poster_path, "w200");

        return (
            <TouchableOpacity
                onPress={() => handlePress(item)}
                activeOpacity={0.8}
                style={styles.card}
            >
                {posterUrl ? (
                    <Image
                        source={{ uri: posterUrl }}
                        style={styles.cardImage}
                        contentFit="cover"
                    />
                ) : (
                    <View style={styles.cardPlaceholder}>
                        <Text style={styles.cardPlaceholderIcon}>🎬</Text>
                    </View>
                )}
                <View style={styles.cardContent}>
                    <View>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                            {item.title}
                        </Text>
                        <Text style={styles.cardSubtitle}>
                            {item.media_type === "movie" ? "Película" : "Serie"}
                        </Text>
                        <Text style={styles.cardRating}>
                            ⭐ {item.vote_average.toFixed(1)}/10
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onRemove(item.tmdb_id, item.media_type);
                        }}
                        style={styles.removeButton}
                    >
                        <Ionicons name="trash-outline" size={24} color={Colors.bloodRed} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
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
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    largeIcon: {
        fontSize: 60,
        marginBottom: 16,
    },
    emptyTitle: {
        color: "#f4f4f5", // zinc-100
        fontSize: 18,
        textAlign: "center",
        marginBottom: 8,
    },
    emptySubtitle: {
        color: Colors.metalSilver,
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
    },
    loginButton: {
        backgroundColor: Colors.bloodRed,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
        marginTop: 16,
    },
    loginButtonText: {
        color: Colors.metalBlack,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    listContent: {
        paddingVertical: 16,
    },
    card: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        marginBottom: 12,
        marginHorizontal: 16,
        borderRadius: 8,
        overflow: "hidden",
        borderColor: Colors.metalSilver,
        borderWidth: 1,
    },
    cardImage: {
        width: 80,
        height: 120,
    },
    cardPlaceholder: {
        backgroundColor: Colors.metalBlack,
        alignItems: "center",
        justifyContent: "center",
        width: 80,
        height: 120,
    },
    cardPlaceholderIcon: {
        fontSize: 24,
    },
    cardContent: {
        flex: 1,
        padding: 12,
        justifyContent: "space-between",
    },
    cardTitle: {
        color: "#f4f4f5", // zinc-100
        fontWeight: "bold",
        fontSize: 16,
    },
    cardSubtitle: {
        color: Colors.metalSilver,
        fontSize: 12,
        marginTop: 4,
    },
    cardRating: {
        color: "#eab308", // yellow-500
        fontSize: 14,
        marginTop: 4,
    },
    removeButton: {
        alignSelf: "flex-end",
    },
});
