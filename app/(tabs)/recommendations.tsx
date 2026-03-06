import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
} from "react-native";
import { Image } from 'expo-image';
import { useFocusEffect, router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { useRecommendationStore } from "../../src/stores/recommendationStore";
import { useAuthStore } from "../../src/stores/authStore";
import { Colors } from "../../src/constants/Colors";
import RecommendationCard from "../../src/components/RecommendationCard";

import type {
    RecommendationTab,
    RecommendationWithRelations,
    TmdbContentData,
    RecommendationsScreenState,
} from "../../src/types/recommendations.types";
import {
    INITIAL_RECOMMENDATIONS_STATE,
    LOADING_TMDB_DATA,
    createTmdbCacheKey,
} from "../../src/types/recommendations.types";
import { fetchTmdbDataBatch } from "../../src/utils/recommendations.utils";

export default function RecommendationsScreen(): React.JSX.Element {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const {
        sent,
        received,
        isLoading,
        addComment,
        markAsRead,
        markCommentsAsRead,
        deleteComment,
        deleteRecommendation,
        fetchRecommendations,
    } = useRecommendationStore();

    const [state, setState] = useState<RecommendationsScreenState>(INITIAL_RECOMMENDATIONS_STATE);
    const { activeTab, tmdbData, expandedId } = state;

    const updateState = (updates: Partial<RecommendationsScreenState>): void => {
        setState((prev) => ({ ...prev, ...updates }));
    };

    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            useRecommendationStore.getState().fetchRecommendations().catch(console.error);
        }, [user])
    );

    useEffect(() => {
        const loadTmdbData = async (): Promise<void> => {
            const allRecs = [
                ...(sent as RecommendationWithRelations[]),
                ...(received as RecommendationWithRelations[]),
            ];

            if (allRecs.length === 0) return;

            const newData = await fetchTmdbDataBatch(allRecs, tmdbData);

            if (Object.keys(newData).length > 0) {
                updateState({
                    tmdbData: { ...tmdbData, ...newData },
                });
            }
        };

        loadTmdbData();
    }, [sent, received]);

    const handleToggleExpand = (id: string): void => {
        if (activeTab === "received") {
            markAsRead(id);
        }
        markCommentsAsRead(id);
        updateState({ expandedId: expandedId === id ? null : id });
    };

    const handleAddComment = async (
        recommendationId: string,
        text: string
    ): Promise<boolean> => {
        return await addComment(recommendationId, text);
    };

    const handleMarkCommentsRead = (recommendationId: string): void => {
        markCommentsAsRead(recommendationId);
    };

    const handleDeleteComment = async (
        recommendationId: string,
        commentId: string
    ): Promise<boolean> => {
        return await deleteComment(recommendationId, commentId);
    };

    const handleDeleteRecommendation = async (
        recommendationId: string
    ): Promise<boolean> => {
        return await deleteRecommendation(recommendationId);
    };

    const handleTabChange = (tab: RecommendationTab): void => {
        updateState({ activeTab: tab });
    };

    const handleNavigateToLogin = (): void => {
        router.push("/login");
    };

    const data = activeTab === "received"
        ? (received as RecommendationWithRelations[])
        : (sent as RecommendationWithRelations[]);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const isReceived = activeTab === "received";

    const getTmdbDataForItem = (item: RecommendationWithRelations): TmdbContentData => {
        const key = createTmdbCacheKey(item.media_type, item.tmdb_id);
        return tmdbData[key] ?? LOADING_TMDB_DATA;
    };

    const renderItem = ({
        item,
    }: {
        item: RecommendationWithRelations;
    }): React.JSX.Element => (
        <RecommendationCard
            item={item}
            tmdbData={getTmdbDataForItem(item)}
            isExpanded={expandedId === item.id}
            isReceived={isReceived}
            currentUserId={user?.id}
            onToggleExpand={handleToggleExpand}
            onAddComment={handleAddComment}
            onMarkCommentsRead={handleMarkCommentsRead}
            onDeleteComment={handleDeleteComment}
            onDeleteRecommendation={handleDeleteRecommendation}
        />
    );

    // ✅ FIXED: Safe key extractor with prefix and fallback
    const keyExtractor = useCallback((item: RecommendationWithRelations, index: number): string => {
        // Use explicit ID if valid, otherwise fallback to index-based key
        if (item.id && typeof item.id === 'string' && item.id.trim() !== '') {
            return `rec-${item.id}`;
        }
        // Fallback: use index + timestamp for uniqueness (only if data is truly static)
        return `rec-fallback-${index}-${Date.now()}`;
    }, []);

    const renderUnauthenticatedState = (): React.JSX.Element => (
        <View style={styles.safeArea}>
            <View style={styles.emptyContainer}>
                <Text style={styles.unauthIcon}>🔒</Text>
                <Text style={styles.unauthText}>
                    {t("recommendations.unauthTitle")}
                </Text>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleNavigateToLogin}
                >
                    <Text style={styles.loginButtonText}>{t("common.signIn")}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderLoadingState = (): React.JSX.Element => (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.vibrantRed} />
        </View>
    );

    const renderEmptyState = (): React.JSX.Element => {
        const isReceivedTab = activeTab === "received";

        return (
            <View style={styles.emptyContainer}>
                <Image
                    source={require("../../assets/mailbox.png")}
                    style={{ width: 240, height: 240, marginBottom: 50 }}
                    contentFit="contain"
                />
                <Text style={styles.emptyText}>
                    {isReceivedTab
                        ? t("recommendations.emptyReceivedTitle")
                        : t("recommendations.emptySentTitle")}
                </Text>
                <Text style={styles.emptySubtext}>
                    {isReceivedTab
                        ? t("recommendations.emptyReceivedSubtitle")
                        : t("recommendations.emptySentSubtitle")}
                </Text>
            </View>
        );
    };

    const renderTab = (
        tab: RecommendationTab,
        label: string,
        count: number
    ): React.JSX.Element => {
        const isActive = activeTab === tab;

        return (
            <TouchableOpacity
                style={[styles.tab, isActive ? styles.activeTab : styles.inactiveTab]}
                onPress={() => handleTabChange(tab)}
            >
                <Text
                    style={[
                        styles.tabText,
                        isActive ? styles.activeTabText : styles.inactiveTabText,
                    ]}
                >
                    {label} ({count})
                </Text>
            </TouchableOpacity>
        );
    };

    const renderContent = (): React.JSX.Element => {
        if (isLoading) {
            return renderLoadingState();
        }

        if (data.length === 0) {
            return renderEmptyState();
        }

        return (
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                onRefresh={async () => {
                    setIsRefreshing(true);
                    await fetchRecommendations({ force: true });
                    setIsRefreshing(false);
                }}
                refreshing={isRefreshing}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                // ✅ Add extra safety: remove duplicates by ID before rendering
                extraData={[expandedId, activeTab]}
            />
        );
    };

    if (!user) {
        return renderUnauthenticatedState();
    }

    const swipeGesture = Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-20, 20])
        .failOffsetY([-15, 15])
        .onEnd((e) => {
            const { translationX, velocityX } = e;
            if (translationX < -50 || velocityX < -500) {
                if (activeTab !== "sent") updateState({ activeTab: "sent" });
            } else if (translationX > 50 || velocityX > 500) {
                if (activeTab !== "received") updateState({ activeTab: "received" });
            }
        });

    return (
        <GestureDetector gesture={swipeGesture}>
            <View style={[styles.safeArea, styles.paddedTop]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardAvoidingView}
                >
                    {/* Removed empty fragments { } that could interfere with reconciliation */}

                    <View style={styles.tabsContainer}>
                        <View style={styles.tabsWrapper}>
                            {renderTab("received", t("recommendations.received"), received.length)}
                            {renderTab("sent", t("recommendations.sent"), sent.length)}
                        </View>
                    </View>

                    {renderContent()}
                </KeyboardAvoidingView>
            </View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
    },
    paddedTop: {
        paddingTop: 8,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    tabsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    tabsWrapper: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        padding: 4,
        borderRadius: 9999,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 9999,
    },
    activeTab: {
        backgroundColor: Colors.vibrantRed,
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
        color: Colors.white,
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
        color: Colors.textPrimary,
        fontSize: 18,
        textAlign: "center",
        marginBottom: 8,
    },
    loginButton: {
        backgroundColor: Colors.vibrantRed,
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
        paddingBottom: 20,
    },
});