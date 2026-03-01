import React, { useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Alert,
    Dimensions,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    scrollTo,
    useAnimatedRef,
    useAnimatedScrollHandler,
    withSpring,
} from "react-native-reanimated";
import { Image } from "expo-image";
import ScreenTitle from "../../src/components/navigation/ScreenTitle";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "../../src/constants/Colors";
import { useAuthStore } from "../../src/stores/authStore";
import { useSocialStore } from "../../src/stores/socialStore";
import FollowButton from "../../src/components/FollowButton";
import { searchUsers } from "../../src/utils/movieDetail.utils";
import type { Profile } from "../../src/lib/supabase";

const AVATAR_BASE = "https://ui-avatars.com/api/?background=1c1c1e&color=e5e5e5&bold=true&size=64&name=";

function getAvatarUri(profile: Profile): string {
    if (profile.avatar_url) return profile.avatar_url;
    return AVATAR_BASE + encodeURIComponent(profile.username ?? "U");
}

// ─── User Row ───────────────────────────────────────────────────────────────
const UserRow = React.memo(({ profile }: { profile: Profile }) => (
    <View style={styles.userRow}>
        <Image
            source={{ uri: getAvatarUri(profile) }}
            style={styles.avatar}
            contentFit="cover"
        />
        <View style={styles.userInfo}>
            <Text style={styles.displayName} numberOfLines={1}>
                @{profile.username}
            </Text>
        </View>
        <FollowButton targetUserId={profile.user_id} compact />
    </View>
));

// ─── Pending Request Row ─────────────────────────────────────────────────────
const PendingRow = React.memo(
    ({
        profile,
        followId,
        onAccept,
        onDecline,
    }: {
        profile: Profile;
        followId: string;
        onAccept: () => void;
        onDecline: () => void;
    }) => {
        const { t } = useTranslation();
        return (
            <View style={styles.userRow}>
                <Image
                    source={{ uri: getAvatarUri(profile) }}
                    style={styles.avatar}
                    contentFit="cover"
                />
                <View style={styles.userInfo}>
                    <Text style={styles.displayName} numberOfLines={1}>
                        @{profile.username}
                    </Text>
                </View>
                <View style={styles.pendingActions}>
                    <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
                        <Text style={styles.acceptText}>{t("social.accept")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.declineBtn} onPress={onDecline} activeOpacity={0.8}>
                        <Ionicons name="close" size={18} color={Colors.metalSilver} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function FindFriendsScreen() {
    const { t } = useTranslation();
    const user = useAuthStore((s) => s.user);
    const { following, followers, pendingIncoming, fetchFollowData, acceptRequest, declineRequest } =
        useSocialStore();

    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<"search" | "following" | "followers">("search");

    const scrollX = useSharedValue(0);
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const { width: SCREEN_WIDTH } = Dimensions.get("window");

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    const indicatorStyle = useAnimatedStyle(() => {
        const tabWidth = SCREEN_WIDTH / 3;
        return {
            width: tabWidth - 32, // Adjusting for padding
            transform: [{ translateX: (scrollX.value / SCREEN_WIDTH) * tabWidth + 16 }],
        };
    });

    const handleTabPress = (index: number, tabName: "search" | "following" | "followers") => {
        setActiveTab(tabName);
        scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    };

    // Refresh on focus
    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            fetchFollowData({ force: true });
        }, [user, fetchFollowData])
    );

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearching(true);
            const results = await searchUsers(query, user?.id);
            setSearchResults(results);
            setIsSearching(false);
        }, 350);
        return () => clearTimeout(timer);
    }, [query, user?.id]);

    const handleAccept = useCallback(
        async (followId: string, followerUserId: string) => {
            const ok = await acceptRequest(followId, followerUserId);
            if (!ok) Alert.alert(t("profile.alerts.errorTitle"), t("social.errorAccept"));
        },
        [acceptRequest, t]
    );

    const handleDecline = useCallback(
        async (followId: string) => {
            const ok = await declineRequest(followId);
            if (!ok) Alert.alert(t("profile.alerts.errorTitle"), t("social.errorDecline"));
        },
        [declineRequest, t]
    );

    const renderSearchContent = () => {
        if (isSearching && searchResults.length === 0) {
            return <ActivityIndicator style={styles.centered} color={Colors.vibrantRed} />;
        }
        if (query.length < 2) {
            return (
                <View style={styles.centered}>
                    <Image
                        source={require("../../assets/icons/spy.png")}
                        style={styles.emptyIcon as any}
                        contentFit="contain"
                    />
                    <Text style={styles.hintText}>{t("social.searchPlaceholder")}</Text>
                </View>
            );
        }
        if (searchResults.length === 0) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>{t("common.noResults")}</Text>
                </View>
            );
        }
        return (
            <FlatList
                data={searchResults}
                keyExtractor={(item) => item.user_id}
                renderItem={({ item }) => <UserRow profile={item} />}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
            />
        );
    };

    const renderFollowingContent = () => {
        if (following.length === 0) {
            return (
                <View style={styles.centered}>
                    <Image
                        source={require("../../assets/icons/follow.png")}
                        style={styles.emptyIcon as any}
                        contentFit="contain"
                    />
                    <Text style={styles.emptyTitle}>{t("social.noFollowing")}</Text>
                    <Text style={styles.emptySubtitle}>{t("social.noFollowingSubtitle")}</Text>
                </View>
            );
        }
        return (
            <FlatList
                data={following}
                keyExtractor={(item) => item.user_id}
                renderItem={({ item }) => <UserRow profile={item} />}
                contentContainerStyle={styles.list}
            />
        );
    };

    const renderFollowersContent = () => {
        if (pendingIncoming.length > 0) {
            return (
                <FlatList
                    data={[
                        // Show pending at the top
                        ...pendingIncoming.map((f) => ({ type: "pending" as const, follow: f })),
                        ...followers.map((p) => ({ type: "accepted" as const, profile: p })),
                    ]}
                    keyExtractor={(item) =>
                        item.type === "pending" ? item.follow.id : item.profile.user_id
                    }
                    ListHeaderComponent={
                        pendingIncoming.length > 0 ? (
                            <Text style={styles.sectionLabel}>{t("social.pendingRequests")}</Text>
                        ) : null
                    }
                    renderItem={({ item }) => {
                        if (item.type === "pending") {
                            const { follow } = item;
                            return follow.profile ? (
                                <PendingRow
                                    profile={follow.profile}
                                    followId={follow.id}
                                    onAccept={() => handleAccept(follow.id, follow.follower_id)}
                                    onDecline={() => handleDecline(follow.id)}
                                />
                            ) : null;
                        }
                        return <UserRow profile={item.profile} />;
                    }}
                    contentContainerStyle={styles.list}
                />
            );
        }

        if (followers.length === 0) {
            return (
                <View style={styles.centered}>
                    <Image
                        source={require("../../assets/icons/run.png")}
                        style={styles.emptyIconLarge as any}
                        contentFit="contain"
                    />
                    <Text style={styles.emptyTitle}>{t("social.noFollowers")}</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={followers}
                keyExtractor={(item) => item.user_id}
                renderItem={({ item }) => <UserRow profile={item} />}
                contentContainerStyle={styles.list}
            />
        );
    };

    return (
        <View style={styles.container}>
            <ScreenTitle title={t("social.findFriendsHeader").toUpperCase()} />
            {/* Search Bar */}
            <View style={styles.searchBar}>
                <View style={styles.searchIconContainer}>
                    {isSearching ? (
                        <ActivityIndicator size="small" color={Colors.vibrantRed} />
                    ) : (
                        <Ionicons name="search" size={18} color={Colors.metalSilver} />
                    )}
                </View>
                <TextInput
                    style={styles.searchInput}
                    placeholder={t("social.searchPlaceholder")}
                    placeholderTextColor={Colors.metalSilver}
                    value={query}
                    onChangeText={(text) => {
                        setQuery(text);
                        if (text.length >= 2) setActiveTab("search");
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {(["search", "following", "followers"] as const).map((tab, index) => (
                    <TouchableOpacity
                        key={tab}
                        style={styles.tab}
                        onPress={() => handleTabPress(index, tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === "search"
                                ? t("common.search")
                                : tab === "following"
                                    ? `${t("social.followingCount")} (${following.length})`
                                    : `${t("social.followers")} (${followers.length + pendingIncoming.length})`}
                        </Text>
                    </TouchableOpacity>
                ))}
                <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
            </View>

            {/* Content */}
            <Animated.ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                style={styles.content}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                    const tabs: Array<"search" | "following" | "followers"> = ["search", "following", "followers"];
                    setActiveTab(tabs[index]);
                }}
            >
                <View style={{ width: SCREEN_WIDTH }}>
                    {renderSearchContent()}
                </View>
                <View style={{ width: SCREEN_WIDTH }}>
                    {renderFollowingContent()}
                </View>
                <View style={{ width: SCREEN_WIDTH }}>
                    {renderFollowersContent()}
                </View>
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    } as ViewStyle,
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.metalGray,
        borderRadius: 10,
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    } as ViewStyle,
    searchIconContainer: {
        width: 20,
        marginRight: 8,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    searchInput: {
        flex: 1,
        color: Colors.white,
        fontFamily: "Inter_400Regular",
        fontSize: 15,
        paddingVertical: 12,
    } as TextStyle,
    tabs: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.08)",
        marginTop: 8,
    } as ViewStyle,
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
    } as ViewStyle,
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: Colors.vibrantRed,
    } as ViewStyle,
    tabText: {
        color: Colors.metalSilver,
        fontFamily: "Inter_400Regular",
        fontSize: 13,
        textTransform: "capitalize",
    } as TextStyle,
    tabTextActive: {
        color: Colors.white,
        fontFamily: "Inter_600SemiBold",
    } as TextStyle,
    tabIndicator: {
        position: "absolute",
        bottom: 0,
        height: 2,
        backgroundColor: Colors.vibrantRed,
    } as ViewStyle,
    content: {
        flex: 1,
    } as ViewStyle,
    list: {
        paddingTop: 4,
        paddingBottom: 24,
    } as ViewStyle,
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    } as ViewStyle,
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.metalGray,
    },
    userInfo: {
        flex: 1,
        marginLeft: 12,
    } as ViewStyle,
    displayName: {
        color: Colors.white,
        fontFamily: "Inter_600SemiBold",
        fontSize: 14,
    } as TextStyle,
    username: {
        color: Colors.metalSilver,
        fontFamily: "Inter_400Regular",
        fontSize: 12,
    } as TextStyle,
    pendingActions: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    } as ViewStyle,
    acceptBtn: {
        backgroundColor: Colors.vibrantRed,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    } as ViewStyle,
    acceptText: {
        color: Colors.white,
        fontFamily: "Inter_600SemiBold",
        fontSize: 12,
    } as TextStyle,
    declineBtn: {
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        padding: 6,
    } as ViewStyle,
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        gap: 12,
        marginTop: 48,
    } as ViewStyle,
    hintText: {
        color: Colors.metalSilver,
        fontFamily: "Inter_400Regular",
        fontSize: 14,
        textAlign: "center",
        marginTop: 12,
    } as TextStyle,
    emptyEmoji: {
        fontSize: 48,
    } as TextStyle,
    emptyIcon: {
        width: 200,
        height: 200,
        opacity: 0.8,
        marginBottom: 8,
    } as ViewStyle,
    emptyIconLarge: {
        width: 250,
        height: 250,
        opacity: 0.8,
        marginBottom: 8,
    } as ViewStyle,
    emptyTitle: {
        color: Colors.white,
        fontFamily: "Inter_600SemiBold",
        fontSize: 18,
        textAlign: "center",
    } as TextStyle,
    emptySubtitle: {
        color: Colors.metalSilver,
        fontFamily: "Inter_400Regular",
        fontSize: 14,
        textAlign: "center",
    } as TextStyle,
    emptyText: {
        color: Colors.metalSilver,
        fontFamily: "Inter_400Regular",
        fontSize: 15,
        textAlign: "center",
    } as TextStyle,
    sectionLabel: {
        color: Colors.metalSilver,
        fontFamily: "Inter_600SemiBold",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6,
    } as TextStyle,
});
