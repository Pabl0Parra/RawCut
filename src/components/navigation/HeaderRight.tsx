import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

interface HeaderRightProps {
    onPress: () => void;
}

export const HeaderRight = ({ onPress }: HeaderRightProps) => (
    <TouchableOpacity
        onPress={onPress}
        style={{ marginRight: 16 }}
    >
        <Ionicons name="person-circle-outline" size={32} color={Colors.white} />
    </TouchableOpacity>
);
