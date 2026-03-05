import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "../../constants/Colors";

interface RatedItemCardProps {
    type: "movie" | "tv";
    label: string;
    title: string;
    rating: number;
}

export const RatedItemCard: React.FC<RatedItemCardProps> = ({ type, label, title, rating }) => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Ionicons name={type === "movie" ? "film" : "tv"} size={13} color={Colors.cinematicGold} />
                <Text style={styles.label}>{label}</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color={Colors.cinematicGold} />
                    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                    <Text style={styles.myRating}>My rating</Text>
                </View>
            </View>
        </View>
    );
};

export const GenreTable: React.FC<{ genres: { name: string; count: number }[]; title: string }> = ({ genres, title }) => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Ionicons name="stats-chart" size={13} color={Colors.cinematicGold} />
                <Text style={styles.label}>{title}</Text>
            </View>
            <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Genre</Text>
                <Text style={styles.tableHeaderText}>Count</Text>
            </View>
            {genres.map((g, i) => (
                <View key={g.name} style={[styles.tableRow, i === genres.length - 1 && styles.lastRow]}>
                    <Text style={styles.genreName}>{g.name}</Text>
                    <Text style={styles.genreCount}>{g.count}</Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.panelBackground,
        borderRadius: 8,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.04)",
        marginBottom: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 14,
    },
    label: {
        color: Colors.metalSilver,
        fontSize: 10,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    content: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
    },
    title: {
        color: Colors.white,
        fontSize: 24,
        fontWeight: "bold",
        fontFamily: Fonts.bebas,
        flex: 1,
        letterSpacing: 0.5,
    },
    ratingBadge: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderRadius: 6,
        padding: 8,
        alignItems: "center",
        minWidth: 70,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
    },
    ratingText: {
        color: Colors.cinematicGold,
        fontSize: 18,
        fontWeight: "800",
    },
    myRating: {
        color: Colors.metalSilver,
        fontSize: 8,
        textTransform: "uppercase",
        fontWeight: "600",
        marginTop: 2,
    },
    tableHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.08)",
        marginBottom: 8,
    },
    tableHeaderText: {
        color: Colors.metalSilver,
        fontSize: 10,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    tableRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.02)",
    },
    lastRow: {
        borderBottomWidth: 0,
    },
    genreName: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: "600",
    },
    genreCount: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: "700",
        fontFamily: Fonts.bebas,
    },
});
