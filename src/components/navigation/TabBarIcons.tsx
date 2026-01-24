import React from 'react';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

interface TabBarIconProps {
    color: string;
    focused: boolean;
}

// Increased size to 24 for better visibility with animated background
const ICON_SIZE = 24;

export const HomeIcon = ({ color }: TabBarIconProps) => (
    <MaterialIcons name="castle" size={ICON_SIZE} color={color} />
);

export const FavoritesIcon = ({ color, focused }: TabBarIconProps) => (
    <Ionicons name={focused ? "skull" : "skull-outline"} size={ICON_SIZE} color={color} />
);

export const WatchlistIcon = ({ color, focused }: TabBarIconProps) => (
    <Ionicons name={focused ? "bookmark" : "bookmark-outline"} size={ICON_SIZE} color={color} />
);

export const RecommendationsIcon = ({ color, focused }: TabBarIconProps) => (
    <MaterialCommunityIcons name={focused ? "email" : "email-outline"} size={ICON_SIZE} color={color} />
);

export const ProfileIcon = ({ color, focused }: TabBarIconProps) => (
    <MaterialCommunityIcons name={focused ? "shield-sword" : "shield-sword-outline"} size={ICON_SIZE} color={color} />
);