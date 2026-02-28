import React from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { getImageUrl } from "../lib/tmdb";
import { UnauthenticatedState, LoadingState, EmptyState } from "./ContentLayoutStates";
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
            <UnauthenticatedState
                message="Inicia sesión para ver tu lista"
                buttonLabel="Iniciar Sesión"
            />
        );
    }

    if (isLoading && data.length === 0) {
        return <LoadingState />;
    }

    if (data.length === 0) {
        return (
            <EmptyState
                title={emptyTitle}
                subtitle={emptySubtitle}
                icon={emptyIcon}
            />
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
            keyExtractor={(item) => `${item.media_type}-${item.tmdb_id}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
        />
    );
}

const styles = StyleSheet.create({
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
        borderColor: Colors.panelBorder,
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
        color: Colors.textPrimary,
        fontWeight: "bold",
        fontSize: 16,
    },
    cardSubtitle: {
        color: Colors.metalSilver,
        fontSize: 12,
        marginTop: 4,
    },
    cardRating: {
        color: Colors.tmdbYellow,
        fontSize: 14,
        marginTop: 4,
    },
    removeButton: {
        alignSelf: "flex-end",
    },
});