import { useEffect, useState, useCallback } from "react";
import { Platform, View, Text } from "react-native";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Colors } from "../../src/constants/Colors";
import { useAuthStore } from "../../src/stores/authStore";
import { useContentStore } from "../../src/stores/contentStore";
import { useRecommendationStore } from "../../src/stores/recommendationStore";
import { useSocialStore } from "../../src/stores/socialStore";

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
    FriendsIcon,
} from "../../src/components/navigation/TabBarIcons";
import { FriendRequestModal } from "../../src/components/navigation/FriendRequestModal";

const renderTabBar = (props: BottomTabBarProps) => (
    <AnimatedTabBar {...props} />
);
const renderHeaderRight = () => <HeaderRight />;

const HEADER_TITLE_STYLE = {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 26,
    color: Colors.white,
} as const;

const HeaderLogo = () => {
    const { i18n } = useTranslation();
    const logoSource = i18n.language === "en"
        ? require("../../assets/icons/rawcut-text-logo.png")
        : require("../../assets/icons/cortocrudotextlogo.png");

    return (
        <Image
            source={logoSource}
            style={{ width: 260, height: 56, marginTop: 6 }}
            contentFit="contain"
        />
    );
};

const CustomHeaderTitle = () => {
    return (
        <View style={{ height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
            <HeaderLogo />
        </View>
    );
};

export default function TabLayout() {
    const { t } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const unreadCount = useRecommendationStore((s) => s.unreadCount);
    const { pendingIncoming, justReceivedRequestId, setJustReceivedRequestId } = useSocialStore();
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
        const { fetchFollowData, subscribeToRealtime: subscribeSocial } = useSocialStore.getState();

        fetchRecommendations();
        fetchUserContent();
        fetchTVProgress();
        fetchFollowData();

        const unsubscribe = subscribeToRealtime();
        const unsubscribeSocial = subscribeSocial();

        return () => {
            unsubscribe();
            unsubscribeSocial();
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
                    headerTitle: () => <CustomHeaderTitle />,
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
                        title: t("tabs.home"),
                        tabBarIcon: HomeIcon,
                    }}
                />
                <Tabs.Screen
                    name="favorites"
                    options={{
                        title: t("tabs.favorites"),
                        tabBarIcon: FavoritesIcon,
                    }}
                />
                <Tabs.Screen
                    name="watchlist"
                    options={{
                        title: t("tabs.watchlist"),
                        tabBarIcon: WatchlistIcon,
                    }}
                />
                <Tabs.Screen
                    name="recommendations"
                    options={{
                        title: t("tabs.recommendations"),
                        tabBarIcon: RecommendationsIcon,
                        tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    }}
                />
                <Tabs.Screen
                    name="find-friends"
                    options={{
                        title: t("social.findFriends"),
                        tabBarIcon: FriendsIcon,
                        tabBarBadge: pendingIncoming.length > 0 ? pendingIncoming.length : undefined,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: t("tabs.profile"),
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
                        headerTitle: () => <CustomHeaderTitle />,
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

            <FriendRequestModal
                visible={!!justReceivedRequestId}
                onClose={() => setJustReceivedRequestId(null)}
            />
        </>
    );
}