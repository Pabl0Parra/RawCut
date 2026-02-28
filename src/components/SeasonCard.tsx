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
import type { SeasonCardProps } from "../types/tvDetail.types";
import { getPosterUrl } from "../utils/tvDetail.utils";

export const SeasonCard: React.FC<SeasonCardProps> = ({
    season,
    isWatched,
    onPress,
}) => {
    const posterUrl = getPosterUrl(season.poster_path, "w200");

    const handlePress = (): void => {
        onPress(season.season_number);
    };

    const renderPoster = (): React.JSX.Element => {
        if (posterUrl) {
            return (
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: posterUrl }}
                        style={styles.image}
                        contentFit="cover"
                    />
                    {isWatched && renderWatchedOverlay()}
                </View>
            );
        }

        return (
            <View style={styles.placeholder}>
                <Text style={styles.placeholderIcon}>📺</Text>
                {isWatched && renderWatchedOverlay()}
            </View>
        );
    };

    const renderWatchedOverlay = (): React.JSX.Element => (
        <View style={styles.watchedOverlay}>
            <Ionicons name="checkmark-circle" size={32} color={Colors.white} />
            <Text style={styles.watchedText}>VISTO</Text>
        </View>
    );

    return (
        <TouchableOpacity style={styles.container} onPress={handlePress}>
            {renderPoster()}
            <Text style={styles.name} numberOfLines={1}>
                {season.name}
            </Text>
            <Text style={styles.episodeCount}>
                {season.episode_count} eps
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 100,
        marginRight: 12,
    } as ViewStyle,
    imageContainer: {
        position: "relative",
        width: 100,
        height: 150,
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 8,
    } as ViewStyle,
    image: {
        width: 100,
        height: 150,
        borderRadius: 8,
    } as ImageStyle,
    placeholder: {
        width: 100,
        height: 150,
        borderRadius: 8,
        backgroundColor: Colors.metalGray,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
        position: "relative",
        overflow: "hidden",
    } as ViewStyle,
    placeholderIcon: {
        fontSize: 32,
    } as TextStyle,
    watchedOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: Colors.glassRed,
        justifyContent: "center",
        alignItems: "center",
    } as ViewStyle,
    watchedText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: "bold",
        marginTop: 4,
        fontFamily: "BebasNeue_400Regular",
        letterSpacing: 1,
    } as TextStyle,
    name: {
        color: Colors.textPrimary,
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
    } as TextStyle,
    episodeCount: {
        color: Colors.metalSilver,
        fontSize: 10,
        textAlign: "center",
        marginTop: 2,
    } as TextStyle,
});

export default SeasonCard;