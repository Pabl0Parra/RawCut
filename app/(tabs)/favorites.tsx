import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useContentStore } from "../../src/stores/contentStore";
import { useAuthStore } from "../../src/stores/authStore";
import { getMovieDetails, getTVShowDetails, getImageUrl } from "../../src/lib/tmdb";
import { Colors } from "../../src/constants/Colors";

interface FavoriteItem {
    id: string;
    tmdb_id: number;
    media_type: "movie" | "tv";
    title: string;
    poster_path: string | null;
    vote_average: number;
}

export default function FavoritesScreen() {
    const { user } = useAuthStore();
    const { favorites, fetchUserContent, removeFromFavorites } = useContentStore();
    const [enrichedFavorites, setEnrichedFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchUserContent();
            }
        }, [user])
    );

    useEffect(() => {
        enrichFavorites();
    }, [favorites]);

    const enrichFavorites = async () => {
        if (favorites.length === 0) {
            setEnrichedFavorites([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const enriched = await Promise.all(
                favorites.map(async (fav) => {
                    try {
                        if (fav.media_type === "movie") {
                            const details = await getMovieDetails(fav.tmdb_id);
                            return {
                                id: fav.id,
                                tmdb_id: fav.tmdb_id,
                                media_type: fav.media_type,
                                title: details.title,
                                poster_path: details.poster_path,
                                vote_average: details.vote_average,
                            };
                        } else {
                            const details = await getTVShowDetails(fav.tmdb_id);
                            return {
                                id: fav.id,
                                tmdb_id: fav.tmdb_id,
                                media_type: fav.media_type,
                                title: details.name,
                                poster_path: details.poster_path,
                                vote_average: details.vote_average,
                            };
                        }
                    } catch (err) {
                        return {
                            id: fav.id,
                            tmdb_id: fav.tmdb_id,
                            media_type: fav.media_type,
                            title: "Sin título",
                            poster_path: null,
                            vote_average: 0,
                        };
                    }
                })
            );
            setEnrichedFavorites(enriched);
        } catch (err) {
            console.error("Error enriching favorites:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (tmdbId: number, mediaType: "movie" | "tv") => {
        const success = await removeFromFavorites(tmdbId, mediaType);
        if (!success) {
            Alert.alert(
                "Error",
                "No se pudo eliminar de favoritos. Verifique sus permisos de base de datos (RLS Policies)."
            );
        }
    };

    const handlePress = (item: FavoriteItem) => {
        if (item.media_type === "movie") {
            router.push(`/movie/${item.tmdb_id}`);
        } else {
            router.push(`/tv/${item.tmdb_id}`);
        }
    };

    const renderItem = ({ item }: { item: FavoriteItem }) => {
        const posterUrl = getImageUrl(item.poster_path, "w200");

        return (
            <TouchableOpacity
                onPress={() => handlePress(item)}
                activeOpacity={0.8}
                style={styles.itemContainer}
            >
                {posterUrl ? (
                    <Image
                        source={{ uri: posterUrl }}
                        style={styles.itemImage}
                        contentFit="cover"
                    />
                ) : (
                    <View style={styles.itemPlaceholder}>
                        <Text style={styles.placeholderIcon}>🎬</Text>
                    </View>
                )}
                <View style={styles.itemContent}>
                    <View>
                        <Text
                            style={styles.itemTitle}
                            numberOfLines={2}
                        >
                            {item.title}
                        </Text>
                        <Text style={styles.itemType}>
                            {item.media_type === "movie" ? "Película" : "Serie"}
                        </Text>
                        <Text style={styles.itemRating}>
                            ⭐ {item.vote_average.toFixed(1)}/10
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            handleRemove(item.tmdb_id, item.media_type);
                        }}
                        style={styles.removeButton}
                    >
                        <Ionicons name="trash-outline" size={24} color={Colors.bloodRed} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    if (!user) {
        return (
            <View style={styles.safeArea}>
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyIcon}>🔒</Text>
                    <Text style={styles.emptyTitle}>
                        Inicia sesión para ver tus favoritos
                    </Text>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => router.push("/login")}
                    >
                        <Text style={styles.loginButtonText}>
                            Iniciar Sesión
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.safeArea}>

            <View style={styles.headerContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text
                        style={[styles.headerTitle, { fontFamily: "BebasNeue_400Regular" }]}
                    >
                        Mi Cementerio
                    </Text>
                    <Ionicons name="skull" size={28} color="#f4f4f5" />
                </View>
                <Text style={styles.headerSubtitle}>

                    {enrichedFavorites.length} elementos
                </Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#dc2626" />
                </View>
            ) : enrichedFavorites.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyIcon}>💔</Text>
                    <Text style={styles.emptyTitle}>
                        No tienes favoritos aún
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        Explora películas y series para añadir a tus favoritos
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={enrichedFavorites}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
    },
    headerContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
    },
    headerTitle: {
        color: "#f4f4f5", // zinc-100
        fontSize: 24,
        fontWeight: "bold",
    },
    headerSubtitle: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginTop: 4,
    },
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyStateContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    emptyIcon: {
        fontSize: 60, // ~text-6xl
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
        paddingVertical: 12, // py-3
        borderRadius: 4,
        marginTop: 16,
    },
    loginButtonText: {
        color: Colors.metalBlack,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    listContent: {
        paddingVertical: 8,
    },
    itemContainer: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        marginBottom: 12,
        marginHorizontal: 16,
        borderRadius: 8,
        overflow: "hidden",
        borderColor: Colors.metalSilver,
        borderWidth: 1,
    },
    itemImage: {
        width: 80,
        height: 120,
    },
    itemPlaceholder: {
        backgroundColor: Colors.metalBlack,
        alignItems: "center",
        justifyContent: "center",
        width: 80,
        height: 120,
    },
    placeholderIcon: {
        fontSize: 24,
    },
    itemContent: {
        flex: 1,
        padding: 12,
        justifyContent: "space-between",
    },
    itemTitle: {
        color: "#f4f4f5", // zinc-100
        fontWeight: "bold",
        fontSize: 16,
    },
    itemType: {
        color: Colors.metalSilver,
        fontSize: 12,
        marginTop: 4,
    },
    itemRating: {
        color: Colors.metalGold,
        fontSize: 14,
        marginTop: 4,
    },
    removeButton: {
        alignSelf: "flex-end",
    },
    removeButtonText: {
        color: Colors.bloodRed,
        fontSize: 14,
    },
});
