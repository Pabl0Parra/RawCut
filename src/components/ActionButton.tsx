import React from "react";
import {
    TouchableOpacity,
    View,
    Text,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import type { ActionButtonProps } from "../types/movieDetail.types";

type IoniconsName = keyof typeof Ionicons.glyphMap;
type MaterialCommunityIconsName = keyof typeof MaterialCommunityIcons.glyphMap;

export const ActionButton: React.FC<ActionButtonProps> = ({
    isActive,
    activeIcon,
    inactiveIcon,
    activeLabel,
    inactiveLabel,
    onPress,
    iconFamily = "Ionicons",
}) => {
    const iconName = isActive ? activeIcon : inactiveIcon;
    const label = isActive ? activeLabel : inactiveLabel;
    const iconColor = isActive ? Colors.white : Colors.textPrimary;

    const renderIcon = (): React.JSX.Element => {
        if (iconFamily === "MaterialCommunityIcons") {
            return (
                <MaterialCommunityIcons
                    name={iconName as MaterialCommunityIconsName}
                    size={18}
                    color={iconColor}
                />
            );
        }

        return (
            <Ionicons
                name={iconName as IoniconsName}
                size={18}
                color={iconColor}
            />
        );
    };

    return (
        <TouchableOpacity
            style={[
                styles.actionButton,
                isActive ? styles.activeButton : styles.inactiveButton,
            ]}
            onPress={onPress}
        >
            <View style={styles.buttonContent}>
                {renderIcon()}
                <Text
                    style={isActive ? styles.activeButtonText : styles.inactiveButtonText}
                    numberOfLines={1}
                >
                    {label}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    actionButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: "center",
        marginHorizontal: 4,
    } as ViewStyle,
    activeButton: {
        backgroundColor: Colors.vibrantRed,
    } as ViewStyle,
    inactiveButton: {
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    } as ViewStyle,
    buttonContent: {
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
        gap: 4,
    } as ViewStyle,
    activeButtonText: {
        color: Colors.white,
        fontWeight: "bold",
        fontSize: 12,
    } as TextStyle,
    inactiveButtonText: {
        color: Colors.textPrimary,
        fontSize: 12,
    } as TextStyle,
});

export default ActionButton;