import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

interface WatchlistHeaderProps {
    activeTab: "movies" | "tv";
    onTabChange: (tab: "movies" | "tv") => void;
    title: string;
}

export const WatchlistHeader: React.FC<WatchlistHeaderProps> = ({ activeTab, onTabChange, title }) => {
    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <View style={styles.titleContainer}>
                    <Ionicons name="bookmark" size={24} color={Colors.vibrantRed} style={styles.icon} />
                    <Text style={styles.title}>{title}</Text>
                </View>

                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "movies" && styles.activeTab]}
                        onPress={() => onTabChange("movies")}
                    >
                        <Ionicons name="film-outline" size={16} color={activeTab === "movies" ? Colors.white : Colors.metalSilver} />
                        <Text style={[styles.tabText, activeTab === "movies" && styles.activeTabText]}>Movies</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === "tv" && styles.activeTab]}
                        onPress={() => onTabChange("tv")}
                    >
                        <Ionicons name="tv-outline" size={16} color={activeTab === "tv" ? Colors.white : Colors.metalSilver} />
                        <Text style={[styles.tabText, activeTab === "tv" && styles.activeTabText]}>TV</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    icon: {
        marginRight: 8,
    },
    title: {
        color: Colors.white,
        fontSize: 24,
        fontWeight: "bold",
    },
    tabsContainer: {
        flexDirection: "row",
        backgroundColor: "transparent",
        padding: 4,
        borderRadius: 12,
    },
    tab: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    activeTab: {
        backgroundColor: "rgba(239, 68, 68, 0.2)", // vibrantRed translucent
    },
    tabText: {
        color: Colors.metalSilver,
        fontSize: 13,
        fontWeight: "600",
    },
    activeTabText: {
        color: Colors.vibrantRed,
    },
});
