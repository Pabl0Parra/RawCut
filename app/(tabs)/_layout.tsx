import { useEffect } from "react";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../src/constants/Colors";
import { useAuthStore } from "../../src/stores/authStore";
import { useContentStore } from "../../src/stores/contentStore";
import { useRecommendationStore } from "../../src/stores/recommendationStore";

import { HeaderLeft } from "../../src/components/navigation/HeaderLeft";
import { HeaderRight } from "../../src/components/navigation/HeaderRight";
import {
    HomeIcon,
    FavoritesIcon,
    WatchlistIcon,
    RecommendationsIcon,
    ProfileIcon
} from "../../src/components/navigation/TabBarIcons";

export default function TabLayout() {
    const insets = useSafeAreaInsets();
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
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: Colors.metalGray,
                    borderTopColor: Colors.metalSilver,
                    borderTopWidth: 0.5,
                    height: 52 + insets.bottom,
                    paddingBottom: insets.bottom,

                },
                tabBarActiveTintColor: Colors.bloodRed,
                tabBarInactiveTintColor: Colors.metalSilver,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontFamily: "Inter_500Medium",
                },
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
            // @ts-ignore
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
                    tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
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
