import React from "react";
import { View, TouchableOpacity, Text, Dimensions, StyleSheet, type ViewStyle, type TextStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BACKDROP_ASPECT_RATIO = 0.56;

/**
 * Props for ContentBackdrop component
 */
export interface ContentBackdropProps {
    backdropUrl: string | null;
    trailerKey?: string | null;
    onPlayTrailer?: () => void;
}

/**
 * Shared backdrop component for content detail screens
 * Displays backdrop image with optional play button overlay for trailers
 */
export function ContentBackdrop({
    backdropUrl,
    trailerKey,
    onPlayTrailer,
}: ContentBackdropProps): React.JSX.Element {
    const backdropHeight = SCREEN_WIDTH * BACKDROP_ASPECT_RATIO;

    return (
        <View style={styles.backdropContainer}>
            {backdropUrl ? (
                <Image
                    source={{ uri: backdropUrl }}
                    style={{ width: SCREEN_WIDTH, height: backdropHeight }}
                    contentFit="cover"
                />
            ) : (
                <View
                    style={[
                        styles.backdropPlaceholder,
                        { width: SCREEN_WIDTH, height: backdropHeight },
                    ]}
                />
            )}

            {trailerKey && onPlayTrailer && (
                <TouchableOpacity
                    style={styles.playButtonOverlay}
                    onPress={onPlayTrailer}
                >
                    <Ionicons
                        name="play-circle"
                        size={80}
                        color="rgba(255,255,255,0.8)"
                    />
                    <Text style={styles.playTrailerText}>Ver Trailer</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    backdropContainer: {
        position: "relative",
    } as ViewStyle,
    backdropPlaceholder: {
        backgroundColor: "#27272a",
    } as ViewStyle,
    playButtonOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.2)",
    } as ViewStyle,
    playTrailerText: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
        marginTop: -10,
        textShadowColor: "rgba(0,0,0,0.75)",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    } as TextStyle,
});

export default ContentBackdrop;
