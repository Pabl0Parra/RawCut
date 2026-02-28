import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors } from "../constants/Colors";

interface CommunityRatingBadgeProps {
    readonly rating: number | undefined;
    readonly onPress: () => void;
}

export function CommunityRatingBadge({ rating, onPress }: CommunityRatingBadgeProps): React.JSX.Element {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.communityBadge}
        >
            <Text style={styles.communityRatingText}>
                👥 {rating === undefined ? "—" : rating.toFixed(1)}/10
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    communityBadge: {
        backgroundColor: Colors.glassPurple,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.glassPurpleBorder,
    },
    communityRatingText: {
        color: Colors.communityPurple,
        fontSize: 14,
        fontWeight: "bold",
    },
});