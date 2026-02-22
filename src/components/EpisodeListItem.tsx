import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../constants/Colors";
import type { EpisodeListItemProps } from "../types/tvDetail.types";
import { getStillUrl, formatRating } from "../utils/tvDetail.utils";

export const EpisodeListItem: React.FC<EpisodeListItemProps> = ({
    episode,
    tvShowId,
    seasonNumber,
    isWatched,
    onToggleWatched,
    onPress,
}) => {
    const stillUrl = getStillUrl(episode.still_path, "w300");

    const renderStill = (): React.JSX.Element => {
        if (stillUrl) {
            return (
                <Image
                    source={{ uri: stillUrl }}
                    style={styles.image}
                    contentFit="cover"
                />
            );
        }

        return (
            <View style={styles.placeholder}>
                <Text style={styles.placeholderIcon}>📺</Text>
            </View>
        );
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            {renderStill()}

            <View style={styles.content}>
                <Text style={styles.title}>
                    {episode.episode_number}. {episode.name}
                </Text>
                <Text style={styles.overview} numberOfLines={3}>
                    {episode.overview || "Sin descripción."}
                </Text>
                <Text style={styles.meta}>
                    ⭐ {formatRating(episode.vote_average)} • {episode.air_date}
                </Text>
            </View>

            <TouchableOpacity
                style={styles.watchedToggle}
                onPress={onToggleWatched}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons
                    name={isWatched ? "checkbox" : "square-outline"}
                    size={24}
                    color={isWatched ? Colors.vibrantRed : Colors.metalSilver}
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        marginBottom: 16,
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        overflow: "hidden",
    } as ViewStyle,
    image: {
        width: 120,
        height: 80,
    } as ImageStyle,
    placeholder: {
        width: 120,
        height: 80,
        backgroundColor: Colors.metalBlack,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    placeholderIcon: {
        fontSize: 24,
    } as TextStyle,
    content: {
        flex: 1,
        padding: 8,
        justifyContent: "center",
    } as ViewStyle,
    title: {
        color: Colors.textPrimary,
        fontWeight: "bold",
        fontSize: 14,
        marginBottom: 4,
    } as TextStyle,
    overview: {
        color: Colors.metalSilver,
        fontSize: 12,
        marginBottom: 4,
    } as TextStyle,
    meta: {
        color: Colors.metalGold,
        fontSize: 10,
    } as TextStyle,
    watchedToggle: {
        padding: 12,
        justifyContent: "center",
        alignItems: "center",
    } as ViewStyle,
});

export default EpisodeListItem;