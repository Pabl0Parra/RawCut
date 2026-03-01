import React from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors, Fonts } from "../../constants/Colors";
import type { Movie, TVShow } from "../../lib/tmdb";
import type { MediaType } from "../../types/homeScreen.types";

interface HomeSectionProps {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    data: (Movie | TVShow)[];
    mediaType: MediaType;
    onViewAll?: () => void;
    renderItem: ({ item, index }: { item: Movie | TVShow; index: number }) => JSX.Element;
}

export const HomeSection = ({
    title,
    icon,
    data,
    mediaType,
    onViewAll,
    renderItem,
}: HomeSectionProps) => {
    const { t } = useTranslation();

    if (!data || data.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Ionicons name={icon} size={20} color={Colors.vibrantRed} />
                    <Text style={styles.title}>{title}</Text>
                </View>
                {onViewAll && (
                    <TouchableOpacity style={styles.viewAll} onPress={onViewAll}>
                        <Text style={styles.viewAllText}>{t("common.viewAll")}</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.metalSilver} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={data.slice(0, 10)}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => `${mediaType}-${item.id}`}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontFamily: Fonts.bebas,
        color: Colors.white,
        letterSpacing: 0.5,
    },
    viewAll: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    viewAllText: {
        fontSize: 12,
        fontFamily: Fonts.interMedium,
        color: Colors.metalSilver,
    },
    listContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
});
