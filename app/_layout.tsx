import { Stack, SplashScreen, useRouter, useSegments } from "expo-router";
import * as Linking from "expo-linking";
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
import VideoSplash from "../src/components/VideoSplash";
import SmokeBackground from "../src/components/SmokeBackground";
import { ThemeProvider, DarkTheme } from "@react-navigation/native";

import { HeaderLeft } from "../src/components/navigation/HeaderLeft";
import { HeaderRight } from "../src/components/navigation/HeaderRight";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const TransparentTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: 'transparent',
    },
};

const renderHeaderLeft = () => <HeaderLeft />;
const renderHeaderRight = () => <HeaderRight />;

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
        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    if (error.message.includes("refresh_token_not_found") || error.message.includes("Refresh Token Not Found")) {
                        console.warn("Invalid refresh token found, signing out...");
                        await supabase.auth.signOut();
                        setSession(null);
                    } else {
                        console.error("Initial session error:", error);
                    }
                } else {
                    setSession(session);
                    if (session?.user) {
                        await fetchProfile();
                    }
                }
            } catch (err) {
                console.error("Failed to get initial session:", err);
            } finally {
                setIsReady(true);
            }
        };

        initSession();

        // Deep linking handler
        const handleDeepLink = async (url: string | null) => {
            if (!url) return;
            const { queryParams } = Linking.parse(url);

            if (queryParams?.access_token && queryParams?.refresh_token) {
                const { data, error } = await supabase.auth.setSession({
                    access_token: queryParams.access_token as string,
                    refresh_token: queryParams.refresh_token as string,
                });

                if (error) {
                    console.error("Deep link auth error:", error);
                }

                if (data.session) {
                    setSession(data.session);
                }
            }
        };

        // Listen for deep links
        const deepLinkSubscription = Linking.addEventListener("url", (event) => {
            handleDeepLink(event.url);
        });

        // Initial link check
        Linking.getInitialURL().then(handleDeepLink);

        return () => {
            subscription.unsubscribe();
            deepLinkSubscription.remove();
        };
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

    return (
        <ThemeProvider value={TransparentTheme}>
            <View style={styles.container}>
                {isReady && (
                    <>
                        <SmokeBackground />
                        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="login" options={{ headerShown: false }} />
                            <Stack.Screen name="register" options={{ headerShown: false }} />
                        </Stack>
                    </>
                )}
                {!isSplashFinished && (
                    <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
                        <VideoSplash onFinish={() => setIsSplashFinished(true)} />
                    </View>
                )}
            </View>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
});
