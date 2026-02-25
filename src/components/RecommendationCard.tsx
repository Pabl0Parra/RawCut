import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Alert,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import type {
    RecommendationWithRelations,
    TmdbContentData,
} from "../types/recommendations.types";
import { Colors } from "../constants/Colors";
import { getImageUrl } from "../lib/tmdb";

// StarRating component removed as requested.

interface RecommendationCardProps {
    item: RecommendationWithRelations;
    tmdbData: TmdbContentData;
    isExpanded: boolean;
    isReceived: boolean;
    currentUserId: string | undefined;
    onToggleExpand: (id: string) => void;
    onAddComment: (recommendationId: string, text: string) => Promise<boolean>;
    onMarkCommentsRead: (recommendationId: string) => void;
    onDeleteComment: (recommendationId: string, commentId: string) => Promise<boolean>;
    onDeleteRecommendation: (recommendationId: string) => Promise<boolean>;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
    item,
    tmdbData,
    isExpanded,
    isReceived,
    currentUserId,
    onToggleExpand,
    onAddComment,
    onMarkCommentsRead,
    onDeleteComment,
    onDeleteRecommendation,
}) => {
    const [commentText, setCommentText] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const {
        sender,
        receiver,
        tmdb_id,
        media_type,
        message,
        created_at,
        comments,
    } = item;

    const posterUrl = getImageUrl(tmdbData.poster, "w200");

    const handlePress = () => {
        onToggleExpand(item.id);

        if (!isExpanded && comments && comments.length > 0) {
            const hasUnread = comments.some(c => !c.is_read && c.user_id !== currentUserId);
            if (hasUnread) {
                onMarkCommentsRead(item.id);
            }
        }
    };

    const hasUnreadReply = !isReceived &&
        comments != null &&
        comments.some(c => c.user_id !== currentUserId && !c.is_read);

    const handleSubmitComment = async () => {
        if (!commentText.trim()) return;

        setIsSubmittingComment(true);
        try {
            const success = await onAddComment(item.id, commentText);
            if (success) {
                setCommentText("");
            }
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleNavigateToContent = () => {
        if (media_type === "movie") {
            router.push(`/movie/${tmdb_id}`);
        } else {
            router.push(`/tv/${tmdb_id}`);
        }
    };

    const handleDeleteRecommendation = () => {
        Alert.alert(
            "Eliminar Recomendación",
            "¿Estás seguro de que quieres eliminar esta recomendación? Esta acción no se puede deshacer.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        const success = await onDeleteRecommendation(item.id);
                        if (!success) {
                            Alert.alert("Error", "No se pudo eliminar la recomendación. Inténtalo de nuevo.");
                        }
                    },
                },
            ]
        );
    };

    const dateObj = new Date(created_at);
    const formattedDate = dateObj.toLocaleDateString("es-ES", {
        day: 'numeric', month: 'short'
    });

    return (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.header}
                onPress={handlePress}
                activeOpacity={0.8}
            >
                <TouchableOpacity onPress={handleNavigateToContent}>
                    {posterUrl ? (
                        <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" />
                    ) : (
                        <View style={styles.posterPlaceholder}>
                            <Text>🎬</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    <View style={styles.topRow}>
                        <Text style={styles.title} numberOfLines={1}>
                            {tmdbData.title || "Cargando..."}
                        </Text>
                        <Text style={styles.date}>
                            {formattedDate}
                        </Text>
                    </View>

                    <Text style={styles.userText}>
                        {isReceived ? `De: ${sender?.username || "Usuario"}` : `Para: ${receiver?.username || "Usuario"}`}
                    </Text>

                    {message && (
                        <Text style={styles.note} numberOfLines={isExpanded ? undefined : 2}>
                            "{message}"
                        </Text>
                    )}

                    <View style={styles.statusRow}>
                        {/* Rating badge removed as requested */}
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.actionButtonContainer}
                    onPress={handleDeleteRecommendation}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    {hasUnreadReply && (
                        <View style={styles.unreadDot} />
                    )}
                    <Ionicons name="trash-outline" size={20} color={Colors.metalSilver} />
                </TouchableOpacity>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.expandedContent}>
                    {/* Your Rating section removed as requested */}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Comentarios</Text>

                        {comments && comments.length > 0 ? (
                            <View style={styles.commentsList}>
                                {comments.map((comment) => {
                                    const isCurrentUser = comment.user_id === currentUserId;
                                    const isSender = comment.user_id === sender?.user_id;
                                    const otherUserName = isSender ? sender?.username : receiver?.username;
                                    const username = isCurrentUser ? "Tú" : otherUserName;

                                    return (
                                        <View key={comment.id} style={styles.commentItem}>
                                            <View style={styles.commentHeader}>
                                                <Text style={styles.commentUser}>
                                                    {username}:
                                                </Text>
                                                {(isCurrentUser || isReceived) && (
                                                    <TouchableOpacity
                                                        onPress={async () => {
                                                            const success = await onDeleteComment(item.id, comment.id);
                                                            if (!success) {
                                                                Alert.alert("Error", "No se pudo eliminar el comentario.");
                                                            }
                                                        }}
                                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                    >
                                                        <Ionicons name="trash-outline" size={14} color={Colors.metalSilver} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                            <Text style={styles.commentText}>{comment.text}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <Text style={styles.noCommentsText}>No hay comentarios aún.</Text>
                        )}

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Escribe un comentario..."
                                placeholderTextColor={Colors.metalSilver}
                                value={commentText}
                                onChangeText={setCommentText}
                            />
                            <TouchableOpacity
                                style={styles.sendButton}
                                onPress={handleSubmitComment}
                                disabled={isSubmittingComment || !commentText.trim()}
                            >
                                {isSubmittingComment ? (
                                    <ActivityIndicator size="small" color={Colors.white} />
                                ) : (
                                    <Ionicons name="send" size={20} color={Colors.white} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // starContainer and star styles removed
    card: {
        backgroundColor: "rgba(30, 30, 30, 0.9)",
        borderRadius: 12,
        marginBottom: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.metalGray,
    } as ViewStyle,
    header: {
        flexDirection: "row",
        padding: 12,
    } as ViewStyle,
    poster: {
        width: 80,
        height: 120,
        borderRadius: 8,
        backgroundColor: Colors.metalGray,
    } as ImageStyle,
    posterPlaceholder: {
        width: 80,
        height: 120,
        borderRadius: 8,
        backgroundColor: Colors.metalGray,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    headerContent: {
        flex: 1,
        marginLeft: 12,
    } as ViewStyle,
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 4,
    } as ViewStyle,
    title: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        flex: 1,
        marginRight: 8,
    } as TextStyle,
    date: {
        color: Colors.metalSilver,
        fontSize: 10,
    } as TextStyle,
    userText: {
        color: Colors.bloodRed,
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 6,
    } as TextStyle,
    note: {
        color: "#e4e4e7",
        fontSize: 14,
        fontStyle: "italic",
        marginBottom: 8,
    } as TextStyle,
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: "auto",
    } as ViewStyle,
    // ratingBadge and ratingText styles removed
    actionButtonContainer: {
        marginLeft: 8,
        alignSelf: "flex-start",
        alignItems: "center",
    } as ViewStyle,
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.bloodRed,
        marginBottom: 4,
    } as ViewStyle,
    expandedContent: {
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
        backgroundColor: "rgba(0,0,0,0.2)",
    } as ViewStyle,
    section: {
        marginBottom: 16,
    } as ViewStyle,
    sectionTitle: {
        color: Colors.metalSilver,
        fontSize: 12,
        fontWeight: "bold",
        marginBottom: 8,
        textTransform: "uppercase",
    } as TextStyle,
    commentsList: {
        marginBottom: 12,
        gap: 8,
    } as ViewStyle,
    commentItem: {
        backgroundColor: "rgba(255,255,255,0.05)",
        padding: 8,
        borderRadius: 6,
    } as ViewStyle,
    commentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 2,
    } as ViewStyle,
    commentUser: {
        color: Colors.bloodRed,
        fontSize: 10,
        fontWeight: "bold",
        marginBottom: 2,
    } as TextStyle,
    commentText: {
        color: "#fff",
        fontSize: 13,
    } as TextStyle,
    noCommentsText: {
        color: Colors.metalSilver,
        fontSize: 12,
        fontStyle: "italic",
        marginBottom: 12,
    } as TextStyle,
    inputContainer: {
        flexDirection: "row",
        gap: 8,
    } as ViewStyle,
    input: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        color: "#fff",
        fontSize: 14,
    } as TextStyle,
    sendButton: {
        backgroundColor: Colors.bloodRed,
        width: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
    } as ViewStyle,
});

export default RecommendationCard;