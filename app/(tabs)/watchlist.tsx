import { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { useCallback } from "react";
import { Image } from "expo-image";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useContentStore } from "../../src/stores/contentStore";
import { useAuthStore } from "../../src/stores/authStore";
import { getMovieDetails, getTVShowDetails, getImageUrl } from "../../src/lib/tmdb";
import { Colors } from "../../src/constants/Colors";

interface WatchlistItem {
    id: string;
    tmdb_id: number;
    media_type: "movie" | "tv";
    title: string;
    poster_path: string | null;
    vote_average: number;
}

export default function WatchlistScreen() {
    const { user } = useAuthStore();
    const { watchlist, fetchUserContent, removeFromWatchlist } = useContentStore();
    const [enrichedWatchlist, setEnrichedWatchlist] = useState<WatchlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchUserContent();
            }
        }, [user])
    );

    useEffect(() => {
        enrichWatchlist();
    }, [watchlist]);

    const enrichWatchlist = async () => {
        if (watchlist.length === 0) {
            setEnrichedWatchlist([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const enriched = await Promise.all(
                watchlist.map(async (item) => {
                    try {
                        if (item.media_type === "movie") {
                            const details = await getMovieDetails(item.tmdb_id);
                            return {
                                id: item.id,
                                tmdb_id: item.tmdb_id,
                                media_type: item.media_type,
                                title: details.title,
                                poster_path: details.poster_path,
                                vote_average: details.vote_average,
                            };
                        } else {
                            const details = await getTVShowDetails(item.tmdb_id);
                            return {
                                id: item.id,
                                tmdb_id: item.tmdb_id,
                                media_type: item.media_type,
                                title: details.name,
                                poster_path: details.poster_path,
                                vote_average: details.vote_average,
                            };
                        }
                    } catch (err) {
                        return {
                            id: item.id,
                            tmdb_id: item.tmdb_id,
                            media_type: item.media_type,
                            title: "Sin título",
                            poster_path: null,
                            vote_average: 0,
                        };
                    }
                })
            );
            setEnrichedWatchlist(enriched);
        } catch (err) {
            console.error("Error enriching watchlist:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (tmdbId: number, mediaType: "movie" | "tv") => {
        const success = await removeFromWatchlist(tmdbId, mediaType);
        if (!success) {
            Alert.alert(
                "Error",
                "No se pudo eliminar de la watchlist. Verifique sus permisos de base de datos (RLS Policies)."
            );
        }
    };

    const handlePress = (item: WatchlistItem) => {
        if (item.media_type === "movie") {
            router.push(`/movie/${item.tmdb_id}`);
        } else {
            router.push(`/tv/${item.tmdb_id}`);
        }
    };

    const renderItem = ({ item }: { item: WatchlistItem }) => {
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
                        <Text
                            style={styles.cardTitle}
                            numberOfLines={2}
                        >
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
            <SafeAreaView style={styles.safeArea} edges={["top"]}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.unauthIcon}>🔒</Text>
                    <Text style={styles.unauthText}>
                        Inicia sesión para ver tu watchlist
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
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>

            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text
                        style={[styles.headerTitle, { fontFamily: "BebasNeue_400Regular" }]}
                    >
                        Lista para ver
                    </Text>
                    <MaterialCommunityIcons name="sword-cross" size={28} color="#f4f4f5" />
                </View>
                <Text style={styles.headerSubtitle}>
                    {enrichedWatchlist.length} elementos
                </Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#dc2626" />
                </View>
            ) : enrichedWatchlist.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📺</Text>
                    <Text style={styles.emptyText}>
                        Tu lista está vacía
                    </Text>
                    <Text style={styles.emptySubtext}>
                        Añade películas y series que quieras ver más tarde
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={enrichedWatchlist}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
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
    removeButtonText: {
        color: Colors.bloodRed,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
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
    unauthIcon: {
        fontSize: 60,
        marginBottom: 16,
    },
    unauthText: {
        color: "#f4f4f5", // zinc-100
        fontSize: 18,
        textAlign: "center",
        marginBottom: 8,
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
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
    },
    emptyText: {
        color: Colors.metalSilver,
        fontSize: 18,
        textAlign: "center",
    },
    emptySubtext: {
        color: Colors.metalSilver,
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
    },
    listContent: {
        paddingVertical: 8,
    },
});
