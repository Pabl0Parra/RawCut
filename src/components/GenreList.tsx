import React from "react";
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from "react-native";
import { Colors } from "../constants/Colors";

/**
 * Genre type
 */
export interface Genre {
    id: number;
    name: string;
}

/**
 * Props for GenreList component
 */
export interface GenreListProps {
    genres: Genre[];
}

/**
 * Shared genre list component for content detail screens
 * Displays genre badges in a horizontal row
 */
export function GenreList({ genres }: GenreListProps): React.JSX.Element | null {
    if (!genres || genres.length === 0) return null;

    return (
        <View style={styles.genresContainer}>
            {genres.map((genre) => (
                <View key={genre.id} style={styles.genreBadge}>
                    <Text style={styles.genreText}>{genre.name}</Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    genresContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginVertical: 12,
    } as ViewStyle,
    genreBadge: {
        backgroundColor: Colors.metalGray,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    } as ViewStyle,
    genreText: {
        color: "#f4f4f5",
        fontSize: 12,
        fontWeight: "600",
    } as TextStyle,
});

export default GenreList;
