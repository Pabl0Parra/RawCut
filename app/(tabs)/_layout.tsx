import { useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Colors } from "../../src/constants/Colors";
import { useAuthStore } from "../../src/stores/authStore";
import { useContentStore } from "../../src/stores/contentStore";
import { useRecommendationStore } from "../../src/stores/recommendationStore";

import { HeaderLeft } from "../../src/components/navigation/HeaderLeft";
import { HeaderRight } from "../../src/components/navigation/HeaderRight";
import { TMDBDisclaimerModal } from "../../src/components/navigation/TMDBDisclaimerModal";
import AnimatedTabBar from "../../src/components/navigation/AnimatedTabBar";
import {
    HomeIcon,
    FavoritesIcon,
    WatchlistIcon,
    RecommendationsIcon,
    ProfileIcon,
} from "../../src/components/navigation/TabBarIcons";

const renderTabBar = (props: BottomTabBarProps) => (
    <AnimatedTabBar {...props} />
);
const renderHeaderRight = () => <HeaderRight />;

const HEADER_TITLE_STYLE = {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 26,
    marginTop: Platform.OS === "ios" ? 4 : 0,
};

export default function TabLayout() {
    const user = useAuthStore((s) => s.user);
    const unreadCount = useRecommendationStore((s) => s.unreadCount);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    const openDisclaimer = useCallback(() => setShowDisclaimer(true), []);
    const closeDisclaimer = useCallback(() => setShowDisclaimer(false), []);
    const renderHeaderLeft = useCallback(
        () => <HeaderLeft onPress={openDisclaimer} />,
        [openDisclaimer],
    );

    
    
    
    
    
    
    useEffect(() => {
        if (!user) return;

        const { fetchRecommendations, subscribeToRealtime } =
            useRecommendationStore.getState();
        const { fetchUserContent, fetchTVProgress } =
            useContentStore.getState();

        fetchRecommendations();
        fetchUserContent();
        fetchTVProgress();

        const unsubscribe = subscribeToRealtime();

        return () => {
            unsubscribe();
        };
    }, [user]);

    return (
        <>
            <Tabs
                tabBar={renderTabBar}
                screenOptions={{
                    headerStyle: {
                        backgroundColor: Colors.metalBlack,
                    },
                    headerTintColor: Colors.white,
                    headerTitleStyle: HEADER_TITLE_STYLE,
                    headerTitle: "CORTOCRUDO",
                    headerTitleAlign: "center",
                    headerLeft: renderHeaderLeft,
                    headerRight: renderHeaderRight,
                    headerLeftContainerStyle: { paddingLeft: 0 },
                    headerRightContainerStyle: { paddingRight: 0 },
                    headerTitleContainerStyle: { marginHorizontal: 0 },
                    sceneStyle: { backgroundColor: "transparent" },
                }}
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
                <Tabs.Screen
                    name="person/[id]"
                    options={{
                        href: null,
                        headerShown: true,
                        headerStyle: {
                            backgroundColor: Colors.metalBlack,
                        },
                        headerTintColor: Colors.white,
                        headerTitleStyle: HEADER_TITLE_STYLE,
                        headerTitle: "CORTOCRUDO",
                        headerTitleAlign: "center",
                        headerLeft: renderHeaderLeft,
                        headerRight: renderHeaderRight,
                        headerLeftContainerStyle: { paddingLeft: 0 },
                        headerRightContainerStyle: { paddingRight: 0 },
                        headerTitleContainerStyle: { marginHorizontal: 0 },
                    }}
                />
            </Tabs>

            <TMDBDisclaimerModal
                visible={showDisclaimer}
                onClose={closeDisclaimer}
            />
        </>
    );
}