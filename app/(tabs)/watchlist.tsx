import { useCallback } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "expo-router";
import { useContentStore } from "../../src/stores/contentStore";
import { useAuthStore } from "../../src/stores/authStore";
import { useEnrichedContent } from "../../src/hooks/useEnrichedContent";
import { ContentListLayout } from "../../src/components/ContentListLayout";

export default function WatchlistScreen() {
    const { user } = useAuthStore();
    const { watchlist, fetchUserContent, removeFromWatchlist } = useContentStore();

    const { enrichedItems, isLoading } = useEnrichedContent(watchlist);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchUserContent();
            }
        }, [user])
    );

    const handleRemove = async (tmdbId: number, mediaType: "movie" | "tv") => {
        const success = await removeFromWatchlist(tmdbId, mediaType);
        if (!success) {
            Alert.alert(
                "Error",
                "No se pudo eliminar de la watchlist. Verifique sus permisos de base de datos (RLS Policies)."
            );
        }
    };

    return (
        <View style={styles.safeArea}>
            <ContentListLayout
                data={enrichedItems}
                isLoading={isLoading}
                isAuthenticated={!!user}
                emptyTitle="Tu lista está vacía"
                emptySubtitle="Añade películas y series que quieras ver más tarde"
                emptyIcon="📺"
                onRemove={handleRemove}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
        paddingTop: 16,
    },
});
