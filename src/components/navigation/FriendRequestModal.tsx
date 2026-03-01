import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Colors, Fonts } from "../../constants/Colors";
import ModalShell from "../ModalShell";
import { useSocialStore } from "../../stores/socialStore";
import { Ionicons } from "@expo/vector-icons";

interface FriendRequestModalProps {
    visible: boolean;
    onClose: () => void;
}

export const FriendRequestModal: React.FC<FriendRequestModalProps> = ({
    visible,
    onClose,
}) => {
    const { t } = useTranslation();
    const router = useRouter();

    const handleGoToFriends = () => {
        onClose();
        router.push("/(tabs)/find-friends");
    };

    return (
        <ModalShell
            visible={visible}
            onClose={onClose}
            title={t("social.summonedTitle")}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <View style={styles.outerRing}>
                        <View style={styles.innerRing}>
                            <Ionicons name="people-circle" size={80} color={Colors.vibrantRed} />
                        </View>
                    </View>
                </View>

                <Text style={styles.description}>
                    {t("social.summonedDescription")}
                </Text>

                <TouchableOpacity style={styles.primaryButton} onPress={handleGoToFriends}>
                    <Text style={styles.primaryButtonText}>
                        {t("social.viewRequest")}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.metalBlack} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                    <Text style={styles.secondaryButtonText}>
                        {t("common.close")}
                    </Text>
                </TouchableOpacity>
            </View>
        </ModalShell>
    );
};

const styles = StyleSheet.create({
    content: {
        alignItems: "center",
        paddingBottom: 20,
    },
    iconContainer: {
        marginVertical: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    outerRing: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 1,
        borderColor: "rgba(239, 68, 68, 0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    innerRing: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: "rgba(239, 68, 68, 0.05)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(239, 68, 68, 0.4)",
    },
    description: {
        fontSize: 16,
        color: Colors.textMuted,
        textAlign: "center",
        fontFamily: Fonts.inter,
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    primaryButton: {
        backgroundColor: Colors.white,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        gap: 8,
        width: "100%",
        marginBottom: 12,
    },
    primaryButtonText: {
        color: Colors.metalBlack,
        fontSize: 16,
        fontWeight: "bold",
        fontFamily: Fonts.bebas,
        letterSpacing: 0.5,
    },
    secondaryButton: {
        paddingVertical: 12,
        width: "100%",
        alignItems: "center",
    },
    secondaryButtonText: {
        color: Colors.textMuted,
        fontSize: 14,
        fontFamily: Fonts.inter,
    },
});

export default FriendRequestModal;
