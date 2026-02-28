import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "../constants/Colors";
import { detailScreenStyles } from "../styles/detailScreenStyles";

interface RecommendButtonProps {
    readonly onPress: () => void;
}

export function RecommendButton({ onPress }: Readonly<RecommendButtonProps>): React.JSX.Element {
    const { t } = useTranslation();

    return (
        <TouchableOpacity
            style={detailScreenStyles.recommendButton}
            onPress={onPress}
        >
            <View style={detailScreenStyles.recommendButtonContent}>
                <MaterialCommunityIcons
                    name="email-outline"
                    size={24}
                    color={Colors.white}
                />
                <Text style={detailScreenStyles.recommendButtonText}>
                    {t("details.recommend")}
                </Text>
            </View>
        </TouchableOpacity>
    );
}