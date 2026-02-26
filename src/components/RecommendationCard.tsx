import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
    const { t, i18n } = useTranslation();
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
        is_read,
    } = item;

    // Unread = received card that hasn't been opened yet
    const isUnread = isReceived && !is_read;

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
            t("recommendations.deleteTitle"),
            t("recommendations.deleteText"),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: async () => {
                        const success = await onDeleteRecommendation(item.id);
                        if (!success) {
                            Alert.alert(t("profile.alerts.errorTitle"), t("profile.alerts.errorDeleteAccount"));
                        }
                    },
                },
            ]
        );
    };

    const dateObj = new Date(created_at);
    const formattedDate = dateObj.toLocaleDateString(i18n.language === 'ca' ? 'ca-ES' : i18n.language === 'en' ? 'en-US' : 'es-ES', {
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
                            {tmdbData.title || t("common.loading")}
                        </Text>
                        <Text style={styles.date}>
                            {formattedDate}
                        </Text>
                    </View>

                    <View style={styles.userRow}>
                        <Text style={styles.userText}>
                            {isReceived
                                ? t("recommendations.from", { user: sender?.username || t("profile.title") })
                                : t("recommendations.to", { user: receiver?.username || t("profile.title") })}
                        </Text>
                        {isUnread && (
                            <View style={styles.newBadge}>
                                <Text style={styles.newBadgeText}>NEW</Text>
                            </View>
                        )}
                    </View>

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
                        <Text style={styles.sectionTitle}>{t("recommendations.comments")}</Text>

                        {comments && comments.length > 0 ? (
                            <View style={styles.commentsList}>
                                {comments.map((comment) => {
                                    const isCurrentUser = comment.user_id === currentUserId;
                                    const isSender = comment.user_id === sender?.user_id;
                                    const otherUserName = isSender ? sender?.username : receiver?.username;
                                    const username = isCurrentUser ? t("recommendations.you") : otherUserName;

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
                                                                Alert.alert(t("profile.alerts.errorTitle"), t("profile.alerts.errorDeleteAccount"));
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
                            <Text style={styles.noCommentsText}>{t("recommendations.noComments")}</Text>
                        )}

                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder={t("recommendations.writeComment")}
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
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 6,
    } as ViewStyle,
    userText: {
        color: Colors.bloodRed,
        fontSize: 12,
        fontWeight: "600",
    } as TextStyle,
    newBadge: {
        backgroundColor: Colors.bloodRed,
        borderRadius: 99,
        paddingHorizontal: 6,
        paddingVertical: 2,
    } as ViewStyle,
    newBadgeText: {
        color: Colors.white,
        fontSize: 9,
        fontWeight: "800",
        letterSpacing: 0.8,
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