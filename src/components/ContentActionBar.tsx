import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import type { MediaType } from "../types/movieDetail.types";
import { ActionButton } from "./ActionButton";

/**
 * Props for ContentActionBar component
 */
export interface ContentActionBarProps {
    contentId: number;
    mediaType: MediaType;
    isFavorite: boolean;
    isInWatchlist: boolean;
    isWatched: boolean;
    onToggleFavorite: () => void;
    onToggleWatchlist: () => void;
    onToggleWatched: () => void;
    currentUserId?: string;
}

/**
 * Shared action button bar for content detail screens
 * Displays favorite, watchlist, and watched toggle buttons
 */
export function ContentActionBar({
    isFavorite,
    isInWatchlist,
    isWatched,
    onToggleFavorite,
    onToggleWatchlist,
    onToggleWatched,
    currentUserId,
}: ContentActionBarProps): React.JSX.Element | null {
    if (!currentUserId) return null;

    return (
        <View style={styles.actionButtonsRow}>
            <ActionButton
                isActive={isFavorite}
                activeIcon="skull"
                inactiveIcon="skull-outline"
                activeLabel="En Favoritos"
                inactiveLabel="Añadir"
                onPress={onToggleFavorite}
                iconFamily="Ionicons"
            />
            <ActionButton
                isActive={isInWatchlist}
                activeIcon="sword-cross"
                inactiveIcon="sword"
                activeLabel="En Lista"
                inactiveLabel="Watchlist"
                onPress={onToggleWatchlist}
                iconFamily="MaterialCommunityIcons"
            />
            <ActionButton
                isActive={isWatched}
                activeIcon="eye"
                inactiveIcon="eye-outline"
                activeLabel="Ya Visto"
                inactiveLabel="Marcar Visto"
                onPress={onToggleWatched}
                iconFamily="Ionicons"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    actionButtonsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: 16,
    } as ViewStyle,
});

export default ContentActionBar;
