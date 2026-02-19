import React, { useEffect } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import { Colors, Fonts } from "../../constants/Colors";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    withTiming,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";

interface TMDBDisclaimerModalProps {
    visible: boolean;
    onClose: () => void;
}

export const TMDBDisclaimerModal: React.FC<TMDBDisclaimerModalProps> = ({
    visible,
    onClose,
}) => {
    const translateY = useSharedValue(0);

    const animatedCardStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (e.translationY > 0) {
                translateY.value = e.translationY;
            }
        })
        .onEnd((e) => {
            if (e.translationY > 100 || e.velocityY > 500) {
                translateY.value = withTiming(1000, {}, () => {
                    runOnJS(onClose)();
                });
            } else {
                translateY.value = withSpring(0);
            }
        });

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(0);
        } else {
            translateY.value = 0;
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            {/* Full-screen backdrop */}
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            >
                {/* Card — stop touch propagation */}
                <GestureDetector gesture={panGesture}>
                    <Animated.View
                        style={[styles.card, animatedCardStyle]}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={styles.modalHandleContainer}>
                            <View style={styles.modalHandle} />
                        </View>

                        {/* Close button */}
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>

                        {/* TMDB logo row */}
                        <View style={styles.tmdbRow}>
                            <View style={styles.tmdbLogo}>
                                <Text style={styles.tmdbLogoText}>TMDB</Text>
                            </View>
                            <Text style={styles.tmdbBadge}>Fuente de datos</Text>
                        </View>

                        {/* Disclaimer text */}
                        <Text style={styles.disclaimerText}>
                            La información sobre películas y series (títulos, sinopsis, pósters,
                            fechas de estreno y valoraciones) es proporcionada por{" "}
                            <Text style={styles.link}>The Movie Database (TMDB)</Text>
                            {". "}
                            Esta aplicación utiliza la API de TMDB pero no está respaldada ni
                            certificada por TMDB.
                        </Text>

                        {/* Rating info box */}
                        <View style={styles.ratingBox}>
                            <Text style={styles.ratingTitle}>¿Cómo se calcula la puntuación?</Text>
                            <Text style={styles.ratingText}>
                                La puntuación <Text style={{ color: Colors.tmdbYellow, fontWeight: "bold" }}>⭐ TMDB</Text> refleja la valoración media de los usuarios de The Movie Database.
                            </Text>
                            <View style={styles.divider} />
                            <Text style={styles.ratingText}>
                                La puntuación <Text style={{ color: Colors.communityPurple, fontWeight: "bold" }}>👥 Comunidad</Text> refleja el promedio de votos (0-10) de los usuarios de esta aplicación.
                            </Text>
                        </View>
                    </Animated.View>
                </GestureDetector>
            </TouchableOpacity>
        </Modal>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    } as ViewStyle,
    card: {
        backgroundColor: "#141414ff",
        borderWidth: 1,
        borderColor: "#1e2330",
        borderRadius: 16,
        padding: 20,
        paddingTop: 8,
        width: "100%",
        maxWidth: 400,
    } as ViewStyle,
    modalHandleContainer: {
        width: "100%",
        height: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    } as ViewStyle,
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#ffffff22",
        borderRadius: 2,
    } as ViewStyle,
    closeButton: {
        position: "absolute",
        top: 12,
        right: 14,
        zIndex: 10,
        padding: 4,
    } as ViewStyle,
    closeIcon: {
        color: Colors.bloodRed,
        fontSize: 18,
        fontWeight: "bold",
    } as TextStyle,
    tmdbRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
        marginTop: 4,
    } as ViewStyle,
    tmdbLogo: {
        backgroundColor: Colors.tmdbBlue,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
    } as ViewStyle,
    tmdbLogoText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#0d0f14",
        letterSpacing: 0.5,
        fontFamily: Fonts.bebas,
    } as TextStyle,
    tmdbBadge: {
        fontSize: 12,
        color: Colors.metalSilver,
        textTransform: "uppercase",
        letterSpacing: 1,
        fontFamily: Fonts.bebas,
    } as TextStyle,
    disclaimerText: {
        fontSize: 13,
        color: "#8892a4",
        lineHeight: 20,
        marginBottom: 16,
        fontFamily: Fonts.inter,
    } as TextStyle,
    link: {
        color: Colors.tmdbBlue,
        fontWeight: "600",
    } as TextStyle,
    ratingBox: {
        backgroundColor: Colors.metalBlack,
        borderRadius: 10,
        padding: 16,
        borderLeftWidth: 3,
        borderLeftColor: Colors.communityPurple,
    } as ViewStyle,
    ratingTitle: {
        fontSize: 12,
        color: Colors.metalSilver,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
        fontWeight: "bold",
        fontFamily: Fonts.bebas,
    } as TextStyle,
    ratingText: {
        fontSize: 12,
        color: "#8892a4",
        lineHeight: 19,
        fontFamily: Fonts.inter,
    } as TextStyle,
    ratingBold: {
        color: "#c8d0de",
        fontWeight: "600",
    } as TextStyle,
    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.1)",
        marginVertical: 12,
    } as ViewStyle,
});

export default TMDBDisclaimerModal;
