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
    type ViewStyle,
    type TextStyle,
} from "react-native";
import { Image } from 'expo-image';
import { Ionicons } from "@expo/vector-icons";
import ScreenTitle from "../../src/components/navigation/ScreenTitle";
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

    // handleAddRating removed as requested.

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

    const keyExtractor = (item: RecommendationWithRelations): string => item.id;

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
                    source={require("../../assets/icons/mail-fire.png")}
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
        const iconName = tab === "received" ? "download-outline" : "paper-plane-outline";

        return (
            <TouchableOpacity
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => handleTabChange(tab)}
            >
                <Ionicons
                    name={iconName as any}
                    size={16}
                    color={isActive ? Colors.white : Colors.metalSilver}
                />
                <Text
                    style={[
                        styles.tabText,
                        isActive && styles.activeTabText,
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
                    <View style={styles.headerContainer}>
                        <View style={styles.headerRow}>
                            <View style={styles.headerTitleContainer}>
                                <Ionicons name="mail" size={24} color={Colors.vibrantRed} style={styles.headerIcon} />
                                <Text style={styles.headerTitle}>{t("tabs.recommendations").toUpperCase()}</Text>
                            </View>

                            <View style={styles.tabsWrapper}>
                                {renderTab("received", t("recommendations.received"), received.length)}
                                {renderTab("sent", t("recommendations.sent"), sent.length)}
                            </View>
                        </View>
                    </View>

                    { }
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
    } as ViewStyle,
    paddedTop: {
        paddingTop: 8,
    } as ViewStyle,
    keyboardAvoidingView: {
        flex: 1,
    } as ViewStyle,
    headerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    headerIcon: {
        marginRight: 8,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: 24,
        fontWeight: "bold",
    },
    tabsWrapper: {
        flexDirection: "row",
        backgroundColor: "transparent",
        padding: 4,
        borderRadius: 12,
    } as ViewStyle,
    tab: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
    } as ViewStyle,
    activeTab: {
        backgroundColor: "rgba(239, 68, 68, 0.2)",
    } as ViewStyle,
    inactiveTab: {
        backgroundColor: "transparent",
    } as ViewStyle,
    tabText: {
        textAlign: "center",
        fontWeight: "600",
        fontSize: 12,
        color: Colors.metalSilver,
    } as TextStyle,
    activeTabText: {
        color: Colors.vibrantRed,
    } as TextStyle,
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    } as ViewStyle,
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
    } as TextStyle,
    emptyText: {
        color: Colors.metalSilver,
        fontSize: 18,
        textAlign: "center",
    } as TextStyle,
    emptySubtext: {
        color: Colors.metalSilver,
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
    } as TextStyle,
    unauthIcon: {
        fontSize: 60,
        marginBottom: 16,
    } as TextStyle,
    unauthText: {
        color: Colors.textPrimary,
        fontSize: 18,
        textAlign: "center",
        marginBottom: 8,
    } as TextStyle,
    loginButton: {
        backgroundColor: Colors.vibrantRed,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
        marginTop: 16,
    } as ViewStyle,
    loginButtonText: {
        color: Colors.white,
        fontWeight: "bold",
        textTransform: "uppercase",
    } as TextStyle,
    listContent: {
        paddingBottom: 20,
    } as ViewStyle,
});