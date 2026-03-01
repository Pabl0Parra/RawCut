import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { getImageUrl } from "../../lib/tmdb";
import { WatchlistTVItem } from "../../hooks/useWatchlistData";

interface UpcomingCardProps {
    item: WatchlistTVItem;
    daysRemaining: number;
    onPress: () => void;
    onRemindMe: () => void;
}

export const UpcomingCard: React.FC<UpcomingCardProps> = ({ item, daysRemaining, onPress, onRemindMe }) => {
    const posterUrl = getImageUrl(item.poster_path, "w200");
    const nextEp = item.next_episode_to_air;

    return (
        <View style={styles.container}>
            <View style={styles.timeline}>
                <View style={[styles.dot, daysRemaining <= 7 && styles.urgentDot]}>
                    <Text style={styles.daysText}>{daysRemaining}</Text>
                    <Text style={styles.daysSubtext}>Days</Text>
                </View>
                <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
                {posterUrl ? (
                    <Image source={{ uri: posterUrl }} style={styles.poster} contentFit="cover" />
                ) : (
                    <View style={[styles.poster, { backgroundColor: Colors.metalGray }]} />
                )}

                <View style={styles.content}>
                    <View style={styles.info}>
                        <Text style={styles.title} numberOfLines={1}>{item.name} →</Text>
                        <Text style={styles.episodeText}>
                            E{nextEp?.episode_number} S{nextEp?.season_number} {nextEp?.air_date ? `| ${nextEp.air_date}` : ""}
                        </Text>
                        {nextEp?.name && <Text style={styles.epTitle} numberOfLines={1}>{nextEp.name}</Text>}
                    </View>

                    <TouchableOpacity style={styles.bellButton} onPress={onRemindMe}>
                        <Ionicons name="notifications-outline" size={20} color={Colors.successGreen} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        marginBottom: 12,
    },
    timeline: {
        width: 60,
        alignItems: "center",
    },
    dot: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.panelBackground,
        borderWidth: 2,
        borderColor: Colors.metalGray,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
    },
    urgentDot: {
        borderColor: Colors.successGreen,
    },
    daysText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: "bold",
    },
    daysSubtext: {
        color: Colors.metalSilver,
        fontSize: 8,
        textTransform: "uppercase",
    },
    line: {
        position: "absolute",
        top: 50,
        bottom: -12,
        width: 1,
        backgroundColor: Colors.metalGray,
    },
    card: {
        flex: 1,
        backgroundColor: Colors.panelBackground,
        borderRadius: 12,
        flexDirection: "row",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: Colors.metalGray,
    },
    poster: {
        width: 70,
        height: 100,
    },
    content: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
    },
    info: {
        flex: 1,
    },
    title: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginBottom: 2,
    },
    episodeText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: "bold",
    },
    epTitle: {
        color: Colors.metalSilver,
        fontSize: 12,
    },
    bellButton: {
        padding: 8,
        backgroundColor: "rgba(74, 222, 128, 0.1)",
        borderRadius: 20,
    },
});
