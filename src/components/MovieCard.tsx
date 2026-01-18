import { View, Text, TouchableOpacity, Dimensions, StyleSheet, Modal, TouchableWithoutFeedback } from "react-native";
import { useState } from "react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons, Entypo } from "@expo/vector-icons";
import { getImageUrl, Movie, TVShow } from "../lib/tmdb";
import { Colors } from "../constants/Colors";

interface MovieCardProps {
    item: Movie | TVShow;
    mediaType: "movie" | "tv";
    isFavorite?: boolean;
    inWatchlist?: boolean;
    isWatched?: boolean;
    onToggleFavorite?: () => void;
    onToggleWatchlist?: () => void;
    onToggleWatched?: () => void;
    onRecommend?: () => void;
}

const { width } = Dimensions.get("window");
const cardWidth = (width - 40) / 3; // Three columns with padding/gaps

export default function MovieCard({
    item,
    mediaType,
    isFavorite = false,
    inWatchlist = false,
    isWatched = false,
    onToggleFavorite,
    onToggleWatchlist,
    onToggleWatched,
    onRecommend,
}: MovieCardProps) {
    const [menuVisible, setMenuVisible] = useState(false);
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

    const toggleMenu = (e: any) => {
        e.stopPropagation();
        setMenuVisible(!menuVisible);
    };

    const handleAction = (action?: () => void) => {
        setMenuVisible(false);
        if (action) action();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            style={[styles.container, { width: cardWidth }]}
        >
            <View style={styles.card}>
                {/* Poster Image */}
                <View style={{ position: 'relative' }}>
                    {posterUrl ? (
                        <Image
                            source={{ uri: posterUrl }}
                            style={{ width: "100%", height: cardWidth * 1.2 }}
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

                    {/* VISTO Overlay */}
                    {isWatched && (
                        <View style={styles.watchedOverlay}>
                            <Ionicons name="checkmark-circle" size={32} color={Colors.white} />
                            <Text style={styles.watchedText}>VISTO</Text>
                        </View>
                    )}

                    {/* Three dots button */}
                    <TouchableOpacity
                        style={styles.moreButton}
                        onPress={toggleMenu}
                    >
                        <Entypo name="dots-three-horizontal" size={16} color="white" />
                    </TouchableOpacity>
                </View>

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

                    {/* Rating and Active Status Icons */}
                    <View style={styles.metaContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.rating}>⭐ {rating}</Text>
                            <View style={styles.miniActions}>
                                {isFavorite && (
                                    <Ionicons name="skull" size={14} color={Colors.bloodRed} />
                                )}
                                {inWatchlist && (
                                    <MaterialCommunityIcons name="sword-cross" size={14} color={Colors.bloodRed} />
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Context Menu Modal */}
            <Modal
                transparent={true}
                visible={menuVisible}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.menuContainer}>
                            <TouchableOpacity style={styles.menuItem} onPress={() => handleAction(onToggleWatched)}>
                                <Ionicons name={isWatched ? "eye" : "eye-outline"} size={20} color={isWatched ? Colors.bloodRed : "#52525b"} />
                                <Text style={styles.menuItemText}>{isWatched ? "Quitar de vistos" : "Marcar como visto"}</Text>
                            </TouchableOpacity>
                            <View style={styles.separator} />

                            <TouchableOpacity style={styles.menuItem} onPress={() => handleAction(() => { })}>
                                <Ionicons name="list" size={20} color="#52525b" />
                                <Text style={styles.menuItemText}>Añadir a la lista</Text>
                            </TouchableOpacity>
                            <View style={styles.separator} />

                            <TouchableOpacity style={styles.menuItem} onPress={() => handleAction(onToggleFavorite)}>
                                <Ionicons name={isFavorite ? "skull" : "skull-outline"} size={20} color={isFavorite ? Colors.bloodRed : "#52525b"} />
                                <Text style={styles.menuItemText}>Favorito</Text>
                            </TouchableOpacity>
                            <View style={styles.separator} />

                            <TouchableOpacity style={styles.menuItem} onPress={() => handleAction(onToggleWatchlist)}>
                                <MaterialCommunityIcons name={inWatchlist ? "sword-cross" : "sword"} size={20} color={inWatchlist ? Colors.bloodRed : "#52525b"} />
                                <Text style={styles.menuItemText}>Lista de seguimiento</Text>
                            </TouchableOpacity>
                            <View style={styles.separator} />

                            <TouchableOpacity style={styles.menuItem} onPress={() => handleAction(() => { })}>
                                <Ionicons name="star" size={20} color="#52525b" />
                                <Text style={styles.menuItemText}>Tu valoración</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
        fontSize: 36,
    },
    moreButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(24, 1, 1, 0.6)',
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
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
        marginTop: 6,
    },
    rating: {
        color: "#eab308", // yellow-500
        fontSize: 11,
    },
    miniActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        width: 250,
        padding: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25, shadowRadius: 3.84,
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    menuItemText: {
        fontSize: 16,
        color: '#18181b', // zinc-900
    },
    separator: {
        height: 1,
        backgroundColor: '#e4e4e7', // zinc-200
        marginHorizontal: 4,
    },
    watchedOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(220, 38, 38, 0.4)", // bloodRed with opacity
        justifyContent: "center",
        alignItems: "center",
        zIndex: 5,
    },
    watchedText: {
        color: Colors.white,
        fontWeight: "bold",
        fontSize: 14,
        marginTop: 4,
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
});
