import React, { useState } from "react";
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSocialStore } from "../stores/socialStore";
import { Colors } from "../constants/Colors";
import { router } from "expo-router";

interface FollowButtonProps {
    targetUserId: string;
    /** Compact mode for use inside lists */
    compact?: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({ targetUserId, compact = false }) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const status = useSocialStore((s) => s.getFollowStatus(targetUserId));
    const follow = useSocialStore((s) => s.follow);
    const unfollow = useSocialStore((s) => s.unfollow);

    const handlePress = async () => {
        if (isLoading) return;

        if (status === "accepted") {
            Alert.alert(
                t("social.unfollowConfirmTitle"),
                t("social.unfollowConfirmText"),
                [
                    { text: t("common.cancel"), style: "cancel" },
                    {
                        text: t("social.unfollow"),
                        style: "destructive",
                        onPress: async () => {
                            setIsLoading(true);
                            const ok = await unfollow(targetUserId);
                            setIsLoading(false);
                            if (!ok) Alert.alert(t("profile.alerts.errorTitle"), t("social.errorUnfollow"));
                        },
                    },
                ]
            );
            return;
        }

        if (status === "pending") {
            // Pending: tapping withdraws the request (same as unfollow)
            setIsLoading(true);
            const ok = await unfollow(targetUserId);
            setIsLoading(false);
            if (!ok) Alert.alert(t("profile.alerts.errorTitle"), t("social.errorUnfollow"));
            return;
        }

        // status === "none" → follow
        setIsLoading(true);
        const ok = await follow(targetUserId);
        setIsLoading(false);
        if (!ok) Alert.alert(t("profile.alerts.errorTitle"), t("social.errorFollow"));
    };

    const label =
        status === "accepted"
            ? t("social.following")
            : status === "pending"
                ? t("social.pending")
                : t("social.follow");

    const buttonStyle = [
        styles.button,
        compact && styles.buttonCompact,
        status === "accepted" && styles.buttonFollowing,
        status === "pending" && styles.buttonPending,
        status === "none" && styles.buttonFollow,
    ];

    const textStyle = [
        styles.label,
        compact && styles.labelCompact,
        status === "accepted" && styles.labelFollowing,
        status === "pending" && styles.labelPending,
        status === "none" && styles.labelFollow,
    ];

    return (
        <TouchableOpacity
            style={buttonStyle}
            onPress={handlePress}
            disabled={isLoading}
            activeOpacity={0.7}
        >
            {isLoading ? (
                <ActivityIndicator
                    size="small"
                    color={status === "none" ? Colors.white : Colors.vibrantRed}
                />
            ) : (
                <Text style={textStyle}>{label}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 90,
    } as ViewStyle,
    buttonCompact: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        minWidth: 76,
    } as ViewStyle,
    buttonFollow: {
        backgroundColor: Colors.vibrantRed,
    } as ViewStyle,
    buttonFollowing: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    } as ViewStyle,
    buttonPending: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: Colors.vibrantRed,
    } as ViewStyle,
    label: {
        fontFamily: "Inter_600SemiBold",
        fontSize: 13,
    } as TextStyle,
    labelCompact: {
        fontSize: 12,
    } as TextStyle,
    labelFollow: {
        color: Colors.white,
    } as TextStyle,
    labelFollowing: {
        color: Colors.metalSilver,
    } as TextStyle,
    labelPending: {
        color: Colors.vibrantRed,
    } as TextStyle,
});

export default FollowButton;
