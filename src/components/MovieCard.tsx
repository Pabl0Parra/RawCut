import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getImageUrl, Movie, TVShow } from "../lib/tmdb";
import { Colors } from "../constants/Colors";

interface MovieCardProps {
    item: Movie | TVShow;
    mediaType: "movie" | "tv";
    isFavorite?: boolean;
    inWatchlist?: boolean;
    onToggleFavorite?: () => void;
    onToggleWatchlist?: () => void;
    onRecommend?: () => void;
}

const { width } = Dimensions.get("window");
const cardWidth = (width - 40) / 3; // Three columns with padding/gaps

export default function MovieCard({
    item,
    mediaType,
    isFavorite = false,
    inWatchlist = false,
    onToggleFavorite,
    onToggleWatchlist,
    onRecommend,
}: MovieCardProps) {
    const title = "title" in item ? item.title : item.name;
    const posterUrl = getImageUrl(item.poster_path, "w300");
    const rating = item.vote_average.toFixed(1);

    const handlePress = () => {
        if (mediaType === "movie") {
            router.push(`/movie/${item.id}`);
        } else {
            router.push(`/tv/${item.id}`);
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            style={[styles.container, { width: cardWidth }]}
        >
            <View style={styles.card}>
                {/* Poster Image */}
                {posterUrl ? (
                    <Image
                        source={{ uri: posterUrl }}
                        style={{ width: "100%", height: cardWidth * 1.5 }}
                        contentFit="cover"
                        transition={300}
                    />
                ) : (
                    <View
                        style={[styles.placeholder, { height: cardWidth * 1.5 }]}
                    >
                        <Text style={styles.placeholderIcon}>🎬</Text>
                    </View>
                )}

                {/* Content */}
                <View style={styles.content}>
                    {/* Title */}
                    <Text
                        style={styles.title}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                    >
                        {title}
                    </Text>

                    {/* Rating */}
                    <View style={styles.metaContainer}>
                        <Text style={styles.rating}>⭐ {rating}/10</Text>

                        {/* Action buttons */}
                        <View style={styles.actions}>
                            {onToggleFavorite && (
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        onToggleFavorite();
                                    }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons
                                        name={isFavorite ? "skull" : "skull-outline"}
                                        size={18}
                                        color={isFavorite ? Colors.bloodRed : "#f4f4f5"}
                                    />
                                </TouchableOpacity>
                            )}
                            {onToggleWatchlist && (
                                <TouchableOpacity
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        onToggleWatchlist();
                                    }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <MaterialCommunityIcons
                                        name={inWatchlist ? "sword-cross" : "sword"}
                                        size={18}
                                        color={inWatchlist ? Colors.bloodRed : "#f4f4f5"}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    card: {
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        overflow: "hidden",
        borderColor: Colors.metalSilver,
        borderWidth: 1,
    },
    placeholder: {
        width: "100%",
        backgroundColor: Colors.metalBlack,
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderIcon: {
        fontSize: 36, // ~text-4xl
    },
    content: {
        padding: 8,
    },
    title: {
        color: "#f4f4f5", // zinc-100
        fontWeight: "bold",
        fontSize: 12,
        height: 32, // Fixed height for 2 lines of text
    },
    metaContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 8,
    },
    rating: {
        color: "#eab308", // yellow-500
        fontSize: 11,
    },
    actions: {
        flexDirection: "row",
        gap: 8,
    },
    actionIcon: {
        fontSize: 18,
    },
});
