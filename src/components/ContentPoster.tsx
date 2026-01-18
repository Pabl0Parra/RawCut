import React from "react";
import { View, Text, StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from "react-native";
import { Image } from "expo-image";
import { Colors } from "../constants/Colors";

/**
 * Props for ContentPoster component
 */
export interface ContentPosterProps {
    posterUrl: string | null;
    placeholderIcon?: string;
}

/**
 * Shared poster component for content detail screens
 * Displays poster image with placeholder fallback
 */
export function ContentPoster({
    posterUrl,
    placeholderIcon = "🎬",
}: ContentPosterProps): React.JSX.Element {
    if (posterUrl) {
        return (
            <Image
                source={{ uri: posterUrl }}
                style={styles.poster}
                contentFit="cover"
            />
        );
    }

    return (
        <View style={styles.posterPlaceholder}>
            <Text style={styles.posterPlaceholderIcon}>{placeholderIcon}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    poster: {
        width: 120,
        height: 180,
        borderRadius: 8,
    } as ImageStyle,
    posterPlaceholder: {
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        width: 120,
        height: 180,
    } as ViewStyle,
    posterPlaceholderIcon: {
        fontSize: 36,
    } as TextStyle,
});

export default ContentPoster;
