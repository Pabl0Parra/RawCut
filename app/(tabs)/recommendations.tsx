import { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import { Image } from "expo-image";
import { useRecommendationStore } from "../../src/stores/recommendationStore";
import { useAuthStore } from "../../src/stores/authStore";
import { getMovieDetails, getTVShowDetails, getImageUrl } from "../../src/lib/tmdb";
import { Colors } from "../../src/constants/Colors";

export default function RecommendationsScreen() {
    const { user, profile } = useAuthStore();
    const {
        sent,
        received,
        isLoading,
        fetchRecommendations,
        addComment,
        addRating,
        subscribeToRealtime,
    } = useRecommendationStore();

    const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
    const [tmdbData, setTmdbData] = useState<
        Record<string, { title: string; poster: string | null }>
    >({});
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [newComment, setNewComment] = useState("");
    const [sendingComment, setSendingComment] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchRecommendations();
                const unsubscribe = subscribeToRealtime();
                return unsubscribe;
            }
        }, [user])
    );

    // Fetch TMDb data for recommendations
    useEffect(() => {
        const fetchTmdbData = async () => {
            const allRecs = [...sent, ...received];
            const newData: Record<string, { title: string; poster: string | null }> =
                {};

            for (const rec of allRecs) {
                const key = `${rec.media_type}-${rec.tmdb_id}`;
                if (!tmdbData[key] && !newData[key]) {
                    try {
                        if (rec.media_type === "movie") {
                            const details = await getMovieDetails(rec.tmdb_id);
                            newData[key] = {
                                title: details.title,
                                poster: details.poster_path,
                            };
                        } else {
                            const details = await getTVShowDetails(rec.tmdb_id);
                            newData[key] = {
                                title: details.name,
                                poster: details.poster_path,
                            };
                        }
                    } catch (err) {
                        newData[key] = { title: "Sin título", poster: null };
                    }
                }
            }

            if (Object.keys(newData).length > 0) {
                setTmdbData((prev) => ({ ...prev, ...newData }));
            }
        };

        fetchTmdbData();
    }, [sent, received]);

    const handleAddComment = async (recommendationId: string) => {
        if (!newComment.trim()) return;

        setSendingComment(true);
        const success = await addComment(recommendationId, newComment);
        if (success) {
            setNewComment("");
        }
        setSendingComment(false);
    };

    const handleAddRating = async (recommendationId: string, rating: number) => {
        await addRating(recommendationId, rating);
    };

    const data = activeTab === "received" ? received : sent;

    const renderStarRating = (
        recommendationId: string,
        currentRating?: { rating: number },
        canRate: boolean = false
    ) => {
        const stars = [1, 2, 3, 4, 5];
        const rating = currentRating?.rating || 0;

        return (
            <View style={styles.starsContainer}>
                {stars.map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => canRate && handleAddRating(recommendationId, star)}
                        disabled={!canRate || !!currentRating}
                    >
                        <Text style={styles.star}>
                            {star <= rating ? "⭐" : "☆"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        const key = `${item.media_type}-${item.tmdb_id}`;
        const tmdb = tmdbData[key] || { title: "Cargando...", poster: null };
        const posterUrl = getImageUrl(tmdb.poster, "w200");
        const isExpanded = expandedId === item.id;
        const isReceived = activeTab === "received";
        const otherUser = isReceived ? item.sender : item.receiver;

        return (
            <View style={styles.card}>
                {/* Main card */}
                <TouchableOpacity
                    onPress={() => setExpandedId(isExpanded ? null : item.id)}
                    activeOpacity={0.8}
                    style={styles.cardMain}
                >
                    {posterUrl ? (
                        <Image
                            source={{ uri: posterUrl }}
                            style={styles.cardImage}
                            contentFit="cover"
                        />
                    ) : (
                        <View style={styles.cardPlaceholder}>
                            <Text style={styles.cardPlaceholderIcon}>
                                {item.media_type === "movie" ? "🎬" : "📺"}
                            </Text>
                        </View>
                    )}

                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                            {tmdb.title}
                        </Text>
                        <Text style={styles.cardMeta}>
                            {isReceived ? `De: @${otherUser?.username}` : `Para: @${otherUser?.username}`}
                        </Text>
                        {item.message && (
                            <Text
                                style={styles.cardMessage}
                                numberOfLines={2}
                            >
                                "{item.message}"
                            </Text>
                        )}

                        {/* Rating display */}
                        <View style={styles.ratingContainer}>
                            {renderStarRating(item.id, item.rating, isReceived && !item.rating)}
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Expanded section with comments */}
                {isExpanded && (
                    <View style={styles.expandedSection}>
                        {/* Comments */}
                        <Text style={styles.commentsTitle}>
                            Comentarios ({item.comments?.length || 0})
                        </Text>

                        {item.comments?.map((comment: any) => (
                            <View key={comment.id} style={styles.commentItem}>
                                <Text style={styles.commentText}>
                                    <Text style={styles.commentUser}>
                                        {comment.user_id === user?.id ? "Tú" : `@${otherUser?.username}`}:
                                    </Text>{" "}
                                    {comment.text}
                                </Text>
                            </View>
                        ))}

                        {/* Add comment */}
                        <View style={styles.addCommentContainer}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Añadir comentario..."
                                placeholderTextColor="#71717a"
                                value={newComment}
                                onChangeText={setNewComment}
                                maxLength={500}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    (sendingComment || !newComment.trim()) && styles.disabledButton,
                                ]}
                                onPress={() => handleAddComment(item.id)}
                                disabled={sendingComment || !newComment.trim()}
                            >
                                {sendingComment ? (
                                    <ActivityIndicator size="small" color="#0a0a0a" />
                                ) : (
                                    <Text style={styles.sendButtonText}>Enviar</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.detailsButton}
                            onPress={() => {
                                const path = item.media_type === "movie"
                                    ? `/movie/${item.tmdb_id}`
                                    : `/tv/${item.tmdb_id}`;
                                router.push(path as any);
                            }}
                        >
                            <Text style={styles.detailsButtonText}>
                                Ver detalles →
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    if (!user) {
        return (
            <SafeAreaView style={styles.safeArea} edges={["top"]}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.unauthIcon}>🔒</Text>
                    <Text style={styles.unauthText}>
                        Inicia sesión para ver tus recomendaciones
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
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text
                            style={[styles.headerTitle, { fontFamily: "BebasNeue_400Regular" }]}
                        >
                            Recomendaciones
                        </Text>
                        <MaterialCommunityIcons name="email-outline" size={28} color="#f4f4f5" />
                    </View>
                </View>

                {/* Tab switcher */}
                <View style={styles.tabsContainer}>
                    <View style={styles.tabsWrapper}>
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                activeTab === "received" ? styles.activeTab : styles.inactiveTab,
                            ]}
                            onPress={() => setActiveTab("received")}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "received"
                                        ? styles.activeTabText
                                        : styles.inactiveTabText,
                                ]}
                            >
                                Recibidas ({received.length})
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.tab,
                                activeTab === "sent" ? styles.activeTab : styles.inactiveTab,
                            ]}
                            onPress={() => setActiveTab("sent")}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "sent"
                                        ? styles.activeTabText
                                        : styles.inactiveTabText,
                                ]}
                            >
                                Enviadas ({sent.length})
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content */}
                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color="#dc2626" />
                    </View>
                ) : data.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📬</Text>
                        <Text style={styles.emptyText}>
                            {activeTab === "received"
                                ? "No tienes recomendaciones"
                                : "No has enviado recomendaciones"}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {activeTab === "received"
                                ? "Cuando alguien te recomiende algo, aparecerá aquí"
                                : "Explora películas y series para recomendar a tus amigos"}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={data}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
    keyboardAvoidingView: {
        flex: 1,
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
    tabsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    tabsWrapper: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        padding: 4,
        borderRadius: 9999, // full rounded
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 9999,
    },
    activeTab: {
        backgroundColor: Colors.bloodRed,
    },
    inactiveTab: {
        backgroundColor: "transparent",
    },
    tabText: {
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 14,
    },
    activeTabText: {
        color: Colors.metalBlack,
    },
    inactiveTabText: {
        color: Colors.metalSilver,
    },
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
    card: {
        backgroundColor: Colors.metalGray,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        overflow: "hidden",
    },
    cardMain: {
        flexDirection: "row",
        padding: 12,
    },
    cardImage: {
        width: 60,
        height: 90,
        borderRadius: 4,
    },
    cardPlaceholder: {
        backgroundColor: Colors.metalBlack,
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
        width: 60,
        height: 90,
    },
    cardPlaceholderIcon: {
        fontSize: 24,
    },
    cardContent: {
        flex: 1,
        marginLeft: 12,
    },
    cardTitle: {
        color: "#f4f4f5", // zinc-100
        fontWeight: "bold",
        fontSize: 16,
    },
    cardMeta: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginTop: 4,
    },
    cardMessage: {
        color: "#d4d4d8", // zinc-300
        fontSize: 14,
        marginTop: 8,
        fontStyle: "italic",
    },
    ratingContainer: {
        marginTop: 8,
    },
    starsContainer: {
        flexDirection: "row",
        gap: 4,
    },
    star: {
        fontSize: 20,
    },
    expandedSection: {
        borderTopWidth: 1,
        borderTopColor: Colors.metalSilver,
        padding: 12,
    },
    commentsTitle: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginBottom: 8,
    },
    commentItem: {
        marginBottom: 8,
        paddingLeft: 8,
        borderLeftWidth: 2,
        borderLeftColor: Colors.metalSilver,
    },
    commentText: {
        color: "#d4d4d8", // zinc-300
    },
    commentUser: {
        fontWeight: "bold",
        color: "#f4f4f5", // zinc-100
    },
    addCommentContainer: {
        flexDirection: "row",
        gap: 8,
        marginTop: 8,
    },
    commentInput: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        color: "#f4f4f5", // zinc-100
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 4,
        fontSize: 14,
    },
    sendButton: {
        backgroundColor: Colors.bloodRed,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
        justifyContent: "center",
    },
    disabledButton: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: Colors.metalBlack,
        fontWeight: "bold",
    },
    detailsButton: {
        marginTop: 12,
        paddingVertical: 8,
        backgroundColor: "rgba(161, 161, 170, 0.2)", // metal-silver/20
        borderRadius: 4,
    },
    detailsButtonText: {
        color: "#f4f4f5", // zinc-100
        textAlign: "center",
        fontSize: 14,
    },
    listContent: {
        paddingBottom: 20,
    },
});
