import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "../../constants/Colors";

interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number;
    subValue?: string;
    halfWidth?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subValue, halfWidth }) => {
    return (
        <View style={[styles.card, halfWidth && styles.halfWidth]}>
            <View style={styles.header}>
                <Ionicons name={icon} size={13} color={Colors.cinematicGold} />
                <Text style={styles.label}>{label}</Text>
            </View>
            <Text style={styles.value}>{value}</Text>
            {subValue && <Text style={styles.subValue}>{subValue}</Text>}
        </View>
    );
};

export const SplitStatRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <View style={styles.row}>{children}</View>;
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.panelBackground, // Back to solid deep dark
        borderRadius: 8, // More subtle rounding
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.04)", // Extremely subtle border
        marginBottom: 12,
        minHeight: 110,
        justifyContent: "center",
    },
    halfWidth: {
        flex: 1,
        marginBottom: 0,
    },
    row: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    label: {
        color: Colors.metalSilver,
        fontSize: 10,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    value: {
        color: Colors.white, // Back to White for a professional look
        fontSize: 34,
        fontWeight: "bold",
        fontFamily: Fonts.bebas,
        textAlign: "center",
        letterSpacing: 1.5,
    },
    subValue: {
        color: Colors.metalSilver,
        fontSize: 11,
        textAlign: "center",
        marginTop: 6,
        fontWeight: "500",
    },
});
