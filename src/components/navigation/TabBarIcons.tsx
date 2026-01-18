import React from 'react';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

interface TabBarIconProps {
    color: string;
}

export const HomeIcon = ({ color }: TabBarIconProps) => (
    <MaterialIcons name="castle" size={24} color={color} />
);

export const FavoritesIcon = ({ color }: TabBarIconProps) => (
    <Ionicons name="skull-outline" size={24} color={color} />
);

export const WatchlistIcon = ({ color }: TabBarIconProps) => (
    <MaterialCommunityIcons name="sword" size={24} color={color} />
);

export const RecommendationsIcon = ({ color }: TabBarIconProps) => (
    <MaterialCommunityIcons name="email-outline" size={24} color={color} />
);

export const ProfileIcon = ({ color }: TabBarIconProps) => (
    <MaterialCommunityIcons name="shield-sword-outline" size={24} color={color} />
);
