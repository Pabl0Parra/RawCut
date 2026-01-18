import { useEffect, useState } from "react";
import { Tabs, router } from "expo-router";
import { View, Text, Platform, Image, TouchableOpacity, Modal, StyleSheet, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../../src/constants/Colors";
import { useAuthStore } from "../../src/stores/authStore";
import { useRecommendationStore } from "../../src/stores/recommendationStore";

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const { user, profile, signOut } = useAuthStore();
    const { unreadCount, fetchRecommendations, subscribeToRealtime } = useRecommendationStore();
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        if (user) {
            fetchRecommendations();
            const unsubscribe = subscribeToRealtime();
            return unsubscribe;
        }
    }, [user]);

    const handleSignOut = () => {
        setMenuVisible(false);
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro de que quieres cerrar sesión?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Cerrar Sesión", style: "destructive", onPress: signOut }
            ]
        );
    };

    const goToProfile = () => {
        setMenuVisible(false);
        router.push("/profile");
    };

    return (
        <>
            <Tabs
                screenOptions={{
                    tabBarStyle: {
                        backgroundColor: Colors.metalGray,
                        borderTopColor: Colors.metalSilver,
                        borderTopWidth: 0.5,
                        height: 60 + insets.bottom,
                        paddingBottom: insets.bottom,
                        paddingTop: 8,
                    },
                    tabBarActiveTintColor: Colors.bloodRed,
                    tabBarInactiveTintColor: Colors.metalSilver,
                    tabBarLabelStyle: {
                        fontSize: 10,
                        fontFamily: "Inter_500Medium",
                        marginBottom: 4,
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
                    headerLeft: () => (
                        <Image
                            source={require('../../assets/icons/metal-hand.png')}
                            style={{ width: 40, height: 40, marginLeft: 16, tintColor: "#fff" }}
                            resizeMode="contain"
                        />
                    ),
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => setMenuVisible(true)}
                            style={{ marginRight: 16 }}
                        >
                            <Ionicons name="person-circle-outline" size={32} color={Colors.white} />
                        </TouchableOpacity>
                    ),
                }}
                // @ts-ignore
                sceneContainerStyle={{ backgroundColor: 'transparent' }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Inicio",
                        tabBarIcon: ({ color }) => (
                            <MaterialIcons name="castle" size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="favorites"
                    options={{
                        title: "Favoritos",
                        tabBarIcon: ({ color }) => (
                            <Ionicons name="skull-outline" size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="watchlist"
                    options={{
                        title: "Watchlist",
                        tabBarIcon: ({ color }) => (
                            <MaterialCommunityIcons name="sword" size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="recommendations"
                    options={{
                        title: "Sugeridas",
                        tabBarIcon: ({ color }) => (
                            <MaterialCommunityIcons name="email-outline" size={24} color={color} />
                        ),
                        tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: "Perfil",
                        tabBarIcon: ({ color }) => (
                            <MaterialCommunityIcons name="shield-sword-outline" size={24} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="movie/[id]"
                    options={{
                        href: null,
                        headerShown: false,
                    }}
                />
                <Tabs.Screen
                    name="tv/[id]"
                    options={{
                        href: null,
                        headerShown: false,
                    }}
                />
            </Tabs>

            <Modal
                visible={menuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setMenuVisible(false)}
                >
                    <View
                        style={[
                            styles.menuContent,
                            { top: Platform.OS === "ios" ? insets.top + 50 : 50 }
                        ]}
                    >
                        <View style={styles.userInfo}>
                            <Text style={styles.usernameText}>@{profile?.username || 'usuario'}</Text>
                            <Text style={styles.emailText}>{user?.email}</Text>
                        </View>

                        <TouchableOpacity style={styles.menuItem} onPress={goToProfile}>
                            <Ionicons name="person-outline" size={20} color={Colors.white} />
                            <Text style={styles.menuItemText}>Mi Perfil</Text>
                        </TouchableOpacity>

                        <View style={styles.separator} />

                        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                            <Ionicons name="log-out-outline" size={20} color={Colors.bloodRed} />
                            <Text style={[styles.menuItemText, { color: Colors.bloodRed }]}>Cerrar Sesión</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    menuContent: {
        position: "absolute",
        right: 16,
        backgroundColor: Colors.metalGray,
        borderRadius: 12,
        padding: 8,
        minWidth: 200,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        // Shadow for iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        // Elevation for Android
        elevation: 10,
    },
    userInfo: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.1)",
        marginBottom: 4,
    },
    usernameText: {
        color: Colors.white,
        fontWeight: "bold",
        fontSize: 14,
    },
    emailText: {
        color: Colors.metalSilver,
        fontSize: 12,
        marginTop: 2,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        gap: 12,
        borderRadius: 8,
    },
    menuItemText: {
        color: Colors.white,
        fontSize: 16,
    },
    separator: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginVertical: 4,
    },
});
