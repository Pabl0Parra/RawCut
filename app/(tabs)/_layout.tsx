import { useEffect } from "react";
import { Tabs } from "expo-router";
import { Colors } from "../../src/constants/Colors";
import { useAuthStore } from "../../src/stores/authStore";
import { useContentStore } from "../../src/stores/contentStore";
import { useRecommendationStore } from "../../src/stores/recommendationStore";

import { HeaderLeft } from "../../src/components/navigation/HeaderLeft";
import { HeaderRight } from "../../src/components/navigation/HeaderRight";
import AnimatedTabBar from "../../src/components/navigation/AnimatedTabBar";
import {
    HomeIcon,
    FavoritesIcon,
    WatchlistIcon,
    RecommendationsIcon,
    ProfileIcon
} from "../../src/components/navigation/TabBarIcons";

export default function TabLayout() {
    const { user } = useAuthStore();
    const { unreadCount, fetchRecommendations, subscribeToRealtime } = useRecommendationStore();
    const { fetchUserContent, fetchTVProgress } = useContentStore();

    useEffect(() => {
        if (user) {
            fetchRecommendations();
            fetchUserContent();
            fetchTVProgress();
            const unsubscribe = subscribeToRealtime();
            return unsubscribe;
        }
    }, [user]);

    return (
        <Tabs
            tabBar={(props) => <AnimatedTabBar {...props} />}
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.metalBlack,
                },
                headerTintColor: Colors.white,
                headerTitleStyle: {
                    fontFamily: "BebasNeue_400Regular",
                    fontSize: 28,
                },
                headerTitle: "CORTOCRUDO",
                headerTitleAlign: 'center',
                headerLeft: HeaderLeft,
                headerRight: HeaderRight,
            }}
            // @ts-ignore - sceneContainerStyle is supported by underlying navigator but not explicitly in expo-router Tabs type
            sceneContainerStyle={{ backgroundColor: 'transparent' }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Inicio",
                    tabBarIcon: HomeIcon,
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    title: "Favoritos",
                    headerTitle: "CORTOCRUDO - FAVORITOS",
                    tabBarIcon: FavoritesIcon,
                }}
            />
            <Tabs.Screen
                name="watchlist"
                options={{
                    title: "Watchlist",
                    headerTitle: "CORTOCRUDO - WATCHLIST",
                    tabBarIcon: WatchlistIcon,
                }}
            />
            <Tabs.Screen
                name="recommendations"
                options={{
                    title: "Sugeridas",
                    headerTitle: "CORTOCRUDO - SUGERIDAS",
                    tabBarIcon: RecommendationsIcon,
                    // Note: Badge is not supported in custom tab bar
                    // You'd need to add badge support to AnimatedTabBar if needed
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Perfil",
                    headerTitle: "CORTOCRUDO - PERFIL",
                    tabBarIcon: ProfileIcon,
                    href: null,
                }}
            />
            <Tabs.Screen
                name="movie/[id]"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="tv/[id]"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}