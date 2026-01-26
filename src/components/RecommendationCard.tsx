import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert } from "react-native";

import type {
    RecommendationWithRelations,
    TmdbContentData,
    StarRatingProps,
} from "../types/recommendations.types";
import { STAR_RATINGS } from "../types/recommendations.types";
import { Colors } from "../constants/Colors";
import { getImageUrl } from "../lib/tmdb";

/**
 * Reusable star rating component
 * Displays 5 stars with optional interactivity for rating
 */
export const StarRating: React.FC<StarRatingProps> = ({
    recommendationId,
    currentRating,
    canRate,
    onRate,
}) => {
    const handlePress = (star: number): void => {
        if (canRate) {
            onRate(recommendationId, star);
        }
    };

    const isStarFilled = (star: number): boolean => {
        return star <= currentRating;
    };

    return (
        <View style={styles.starContainer}>
            {STAR_RATINGS.map((star) => (
                <TouchableOpacity
                    key={star}
                    onPress={() => handlePress(star)}
                    disabled={!canRate}
                    activeOpacity={canRate ? 0.7 : 1}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                    <Text style={styles.star}>
                        {isStarFilled(star) ? "⭐" : "☆"}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

interface RecommendationCardProps {
    item: RecommendationWithRelations;
    tmdbData: TmdbContentData;
    isExpanded: boolean;
    isReceived: boolean;
    currentUserId: string | undefined;
    onToggleExpand: (id: string) => void;
    onAddComment: (recommendationId: string, text: string) => Promise<boolean>;
    onAddRating: (recommendationId: string, rating: number) => Promise<void>;
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
    onAddRating,
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
        rating,
        comments,
    } = item;

    // tmdbData.poster is string | null (path)
    const posterUrl = getImageUrl(tmdbData.poster, "w200");

    const handlePress = () => {
        onToggleExpand(item.id);

        // If expanding and there are unread comments, mark them as read
        if (!isExpanded && comments && comments.length > 0) {
            const hasUnread = comments.some(c => !c.is_read && c.user_id !== currentUserId);
            if (hasUnread) {
                onMarkCommentsRead(item.id);
            }
        }
    };

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
                    onPress: () => onDeleteRecommendation(item.id),
                },
            ]
        );
    };

    const numericRating = rating ? rating.rating : 0;

    // Formatting date manually to avoid external dependency issues
    const dateObj = new Date(created_at);
    const formattedDate = dateObj.toLocaleDateString("es-ES", {
        day: 'numeric', month: 'short'
    });
    // Fallback if locale fails or native not supported (unlikely in RN)
    // const formattedDateText = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;


    return (
        <View style={styles.card}>
            {/* Header / Summary */}
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
                        {numericRating > 0 && (
                            <View style={styles.ratingBadge}>
                                <Text style={styles.ratingText}>⭐ {numericRating}/5</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Delete Button (Header Top Right) */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteRecommendation}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="trash-outline" size={20} color={Colors.metalSilver} />
                </TouchableOpacity>
            </TouchableOpacity>

            {/* Expanded Content */}
            {isExpanded && (
                <View style={styles.expandedContent}>
                    {/* Rating Section (Only for receiver) */}
                    {isReceived && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Tu Calificación</Text>
                            <StarRating
                                recommendationId={item.id}
                                currentRating={numericRating}
                                canRate={true}
                                onRate={onAddRating}
                            />
                        </View>
                    )}

                    {/* Comments Section */}
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
                                                        onPress={() => onDeleteComment(item.id, comment.id)}
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
    starContainer: {
        flexDirection: "row",
        gap: 4,
    } as ViewStyle,
    star: {
        fontSize: 24,
    } as TextStyle,
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
    ratingBadge: {
        flexDirection: "row",
        alignItems: "center",
    } as ViewStyle,
    ratingText: {
        color: "#eab308",
        fontSize: 12,
        fontWeight: "bold",
    } as TextStyle,
    deleteButton: {
        marginLeft: 8,
        alignSelf: "flex-start",
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