import { Tabs } from "expo-router";
import { View, Text, Platform, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
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
                    fontSize: 28,

                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Inicio",
                    headerTitle: "CortoCrudo",
                    headerLeft: () => (
                        <Image
                            source={require('../../assets/icons/metal-hand.png')}
                            style={{ width: 40, height: 40, marginLeft: 16, tintColor: "#fff" }}
                            resizeMode="contain"
                        />
                    ),
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="castle" size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    title: "Favoritos",
                    headerLeft: () => (
                        <Image
                            source={require('../../assets/icons/metal-hand.png')}
                            style={{ width: 40, height: 40, marginLeft: 16, tintColor: "#fff" }}
                            resizeMode="contain"
                        />
                    ),
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="skull-outline" size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="watchlist"
                options={{
                    title: "Lista pa ver",
                    headerLeft: () => (
                        <Image
                            source={require('../../assets/icons/metal-hand.png')}
                            style={{ width: 40, height: 40, marginLeft: 16, tintColor: "#fff" }}
                            resizeMode="contain"
                        />
                    ),
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
        </Tabs>
    );
}
