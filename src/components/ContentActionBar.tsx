import React from "react";
import {
    View,
    StyleSheet,
    type ViewStyle,
} from "react-native";
import type { MediaType } from "../types/movieDetail.types";
import { ActionButton } from "./ActionButton";

/**
 * Props for ContentActionBar component
 */
export interface ContentActionBarProps {
    readonly contentId: number;
    readonly mediaType: MediaType;
    readonly isFavorite: boolean;
    readonly isInWatchlist: boolean;
    readonly isWatched: boolean;
    readonly onToggleFavorite: () => void;
    readonly onToggleWatchlist: () => void;
    readonly onToggleWatched: () => void;
    readonly currentUserId?: string;
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
}: Readonly<ContentActionBarProps>): React.JSX.Element | null {
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
                activeIcon="bookmark"
                inactiveIcon="bookmark-outline"
                activeLabel="En Lista"
                inactiveLabel="Watchlist"
                onPress={onToggleWatchlist}
                iconFamily="Ionicons"
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
