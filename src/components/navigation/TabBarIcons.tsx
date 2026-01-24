import React from 'react';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

interface TabBarIconProps {
    color: string;
    focused: boolean;
}

export const HomeIcon = ({ color }: TabBarIconProps) => (
    <MaterialIcons name="castle" size={20} color={color} />
);

export const FavoritesIcon = ({ color, focused }: TabBarIconProps) => (
    <Ionicons name={focused ? "skull" : "skull-outline"} size={20} color={color} />
);

export const WatchlistIcon = ({ color, focused }: TabBarIconProps) => (
    <Ionicons name={focused ? "bookmark" : "bookmark-outline"} size={20} color={color} />
);

export const RecommendationsIcon = ({ color, focused }: TabBarIconProps) => (
    <MaterialCommunityIcons name={focused ? "email" : "email-outline"} size={20} color={color} />
);

export const ProfileIcon = ({ color, focused }: TabBarIconProps) => (
    <MaterialCommunityIcons name={focused ? "shield-sword" : "shield-sword-outline"} size={20} color={color} />
);
