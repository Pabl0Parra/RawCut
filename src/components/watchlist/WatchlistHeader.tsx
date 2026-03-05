import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors, Fonts } from "../../constants/Colors";

interface WatchlistHeaderProps {
    activeTab: "movies" | "tv";
    onTabChange: (tab: "movies" | "tv") => void;
    title: string;
}

export const WatchlistHeader: React.FC<WatchlistHeaderProps> = ({ activeTab, onTabChange, title }) => {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <View style={styles.titleRow}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                </View>

                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "movies" && styles.activeTab]}
                        onPress={() => onTabChange("movies")}
                    >
                        <Ionicons name="film-outline" size={16} color={activeTab === "movies" ? Colors.white : Colors.metalSilver} />
                        <Text style={[styles.tabText, activeTab === "movies" && styles.activeTabText]}>
                            {t("tabs.movies")}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === "tv" && styles.activeTab]}
                        onPress={() => onTabChange("tv")}
                    >
                        <Ionicons name="tv-outline" size={16} color={activeTab === "tv" ? Colors.white : Colors.metalSilver} />
                        <Text style={[styles.tabText, activeTab === "tv" && styles.activeTabText]}>
                            {t("tabs.tv")}
                        </Text>
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
    title: {
        fontSize: 28,
        fontFamily: Fonts.bebas,
        color: Colors.white,
        letterSpacing: 1,
    },
    tabsContainer: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        borderRadius: 20,
        padding: 2,
        gap: 2,
    },
    tab: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 18,
        gap: 6,
    },
    activeTab: {
        backgroundColor: Colors.vibrantRed,
    },
    tabText: {
        fontSize: 12,
        fontFamily: Fonts.interSemiBold,
        color: Colors.metalSilver,
    },
    activeTabText: {
        color: Colors.white,
    },
});
