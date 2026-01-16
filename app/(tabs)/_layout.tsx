import { Tabs } from "expo-router";
import { View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../src/constants/Colors";

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
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
                    fontSize: 24,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Inicio",
                    headerTitle: "RawCut",
                    tabBarIcon: ({ color }) => (
                        <Text style={{ fontSize: 20 }}>🏠</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    title: "Favoritos",
                    tabBarIcon: ({ color }) => (
                        <Text style={{ fontSize: 20 }}>❤️</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="watchlist"
                options={{
                    title: "Watchlist",
                    tabBarIcon: ({ color }) => (
                        <Text style={{ fontSize: 20 }}>📌</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="recommendations"
                options={{
                    title: "Recomen...",
                    tabBarIcon: ({ color }) => (
                        <Text style={{ fontSize: 20 }}>💌</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Perfil",
                    tabBarIcon: ({ color }) => (
                        <Text style={{ fontSize: 20 }}>👤</Text>
                    ),
                }}
            />
        </Tabs>
    );
}
