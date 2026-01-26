import React, { useEffect, useState, useCallback } from "react";
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
import { useFocusEffect, router } from "expo-router";

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

// ============================================================================
// Main Component
// ============================================================================

export default function RecommendationsScreen(): React.JSX.Element {
    const { user } = useAuthStore();
    const {
        sent,
        received,
        isLoading,
        addComment,
        addRating,
        markAllAsRead,
        markCommentsAsRead,
        deleteComment,
        deleteRecommendation,
    } = useRecommendationStore();

    const [state, setState] = useState<RecommendationsScreenState>(INITIAL_RECOMMENDATIONS_STATE);

    const { activeTab, tmdbData, expandedId } = state;

    // ========================================================================
    // State Helpers
    // ========================================================================

    const updateState = (updates: Partial<RecommendationsScreenState>): void => {
        setState((prev) => ({ ...prev, ...updates }));
    };

    // ========================================================================
    // Effects
    // ========================================================================

    // Mark as read when screen focuses
    useFocusEffect(
        useCallback(() => {
            if (user && activeTab === "received") {
                markAllAsRead();
            }
        }, [user, activeTab, markAllAsRead])
    );

    // Fetch TMDb data for all recommendations
    useEffect(() => {
        const loadTmdbData = async (): Promise<void> => {
            // Cast to proper type - the store should return this shape
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

    // ========================================================================
    // Handlers
    // ========================================================================

    const handleToggleExpand = (id: string): void => {
        updateState({ expandedId: id || null });
    };

    const handleAddComment = async (
        recommendationId: string,
        text: string
    ): Promise<boolean> => {
        return await addComment(recommendationId, text);
    };

    const handleAddRating = async (
        recommendationId: string,
        rating: number
    ): Promise<void> => {
        await addRating(recommendationId, rating);
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

    // ========================================================================
    // Derived Data
    // ========================================================================

    const data = activeTab === "received"
        ? (received as RecommendationWithRelations[])
        : (sent as RecommendationWithRelations[]);

    const isReceived = activeTab === "received";

    // ========================================================================
    // Render Helpers
    // ========================================================================

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
            onAddRating={handleAddRating}
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
                    Inicia sesión para ver tus recomendaciones
                </Text>
                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleNavigateToLogin}
                >
                    <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderLoadingState = (): React.JSX.Element => (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#dc2626" />
        </View>
    );

    const renderEmptyState = (): React.JSX.Element => {
        const isReceivedTab = activeTab === "received";

        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📬</Text>
                <Text style={styles.emptyText}>
                    {isReceivedTab
                        ? "No tienes recomendaciones"
                        : "No has enviado recomendaciones"}
                </Text>
                <Text style={styles.emptySubtext}>
                    {isReceivedTab
                        ? "Cuando alguien te recomiende algo, aparecerá aquí"
                        : "Explora películas y series para recomendar a tus amigos"}
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
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        );
    };

    // ========================================================================
    // Main Render
    // ========================================================================

    if (!user) {
        return renderUnauthenticatedState();
    }

    return (
        <View style={[styles.safeArea, styles.paddedTop]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                {/* Tab Switcher */}
                <View style={styles.tabsContainer}>
                    <View style={styles.tabsWrapper}>
                        {renderTab("received", "Recibidas", received.length)}
                        {renderTab("sent", "Enviadas", sent.length)}
                    </View>
                </View>

                {/* Content */}
                {renderContent()}
            </KeyboardAvoidingView>
        </View>
    );
}

// ============================================================================
// Styles
// ============================================================================

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
    tabsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    } as ViewStyle,
    tabsWrapper: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        padding: 4,
        borderRadius: 9999,
    } as ViewStyle,
    tab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 9999,
    } as ViewStyle,
    activeTab: {
        backgroundColor: Colors.bloodRed,
    } as ViewStyle,
    inactiveTab: {
        backgroundColor: "transparent",
    } as ViewStyle,
    tabText: {
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 14,
    } as TextStyle,
    activeTabText: {
        color: Colors.metalBlack,
    } as TextStyle,
    inactiveTabText: {
        color: Colors.metalSilver,
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
        color: "#f4f4f5",
        fontSize: 18,
        textAlign: "center",
        marginBottom: 8,
    } as TextStyle,
    loginButton: {
        backgroundColor: Colors.bloodRed,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
        marginTop: 16,
    } as ViewStyle,
    loginButtonText: {
        color: Colors.metalBlack,
        fontWeight: "bold",
        textTransform: "uppercase",
    } as TextStyle,
    listContent: {
        paddingBottom: 20,
    } as ViewStyle,
});