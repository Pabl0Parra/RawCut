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
import { useTranslation, Trans } from "react-i18next";
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
    const { t } = useTranslation();
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
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            >
                <GestureDetector gesture={panGesture}>
                    <Animated.View
                        style={[styles.card, animatedCardStyle]}
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={styles.modalHandleContainer}>
                            <View style={styles.modalHandle} />
                        </View>

                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>

                        <View style={styles.tmdbRow}>
                            <View style={styles.tmdbLogo}>
                                <Text style={styles.tmdbLogoText}>TMDB</Text>
                            </View>
                            <Text style={styles.tmdbBadge}>{t('disclaimer.badge')}</Text>
                        </View>

                        <Text style={styles.disclaimerText}>
                            <Trans
                                i18nKey="disclaimer.text"
                                components={[<Text style={styles.link} key="tmdb-link" />]}
                            />
                        </Text>

                        <View style={styles.ratingBox}>
                            <Text style={styles.ratingTitle}>{t('disclaimer.ratingTitle')}</Text>
                            <Text style={styles.ratingText}>
                                <Trans
                                    i18nKey="disclaimer.ratingTmdb"
                                    components={[<Text style={{ color: Colors.tmdbYellow, fontWeight: "bold" }} key="tmdb-bold" />]}
                                />
                            </Text>
                            <View style={styles.divider} />
                            <Text style={styles.ratingText}>
                                <Trans
                                    i18nKey="disclaimer.ratingCommunity"
                                    components={[<Text style={{ color: Colors.communityPurple, fontWeight: "bold" }} key="community-bold" />]}
                                />
                            </Text>
                        </View>
                    </Animated.View>
                </GestureDetector>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    } as ViewStyle,
    card: {
        backgroundColor: Colors.panelBackground,
        borderWidth: 1,
        borderColor: Colors.panelBorder,
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
        backgroundColor: Colors.glassWhiteSubtle,
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
        color: Colors.vibrantRed,
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
        color: Colors.metalBlack,
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
        color: Colors.textMuted,
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
        color: Colors.textMuted,
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
