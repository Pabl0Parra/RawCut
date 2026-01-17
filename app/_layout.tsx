import { Slot, Stack, SplashScreen, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from "@expo-google-fonts/inter";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { supabase } from "../src/lib/supabase";
import { useAuthStore } from "../src/stores/authStore";
import { Colors } from "../src/constants/Colors";
import VideoSplash from "../src/components/VideoSplash"; // Import VideoSplash

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const { user, setSession, fetchProfile } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);
    const [isSplashFinished, setIsSplashFinished] = useState(false); // Splash state

    const [fontsLoaded, fontError] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        BebasNeue_400Regular,
    });

    // Listen for auth state changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                if (session?.user) {
                    await fetchProfile();
                }
            }
        );

        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchProfile();
            }
            setIsReady(true);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Handle Native Splash hiding
    useEffect(() => {
        // Hide native splash once fonts are loaded
        // We don't wait for isReady here because we want to show our VideoSplash ASAP
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    // Auth-based routing
    useEffect(() => {
        if (!isReady) return;

        const inAuthGroup = segments[0] === "(tabs)";
        const inPublicRoute = segments[0] === "login" || segments[0] === "register";

        if (!user && inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace("/login");
        } else if (user && (inPublicRoute || segments[0] === undefined)) {
            // Redirect to home if authenticated and on auth screens
            router.replace("/(tabs)");
        }
    }, [user, segments, isReady]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    // We no longer return null if !isReady, because we want to show the Splash
    // But we only render Slot when isReady is true

    return (
        <View style={styles.container}>
            {isReady && (
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.metalBlack } }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="movie/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="tv/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="register" options={{ headerShown: false }} />
                </Stack>
            )}
            {!isSplashFinished && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
                    <VideoSplash onFinish={() => setIsSplashFinished(true)} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
});
