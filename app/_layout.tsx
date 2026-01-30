import { Stack, SplashScreen, useRouter, useSegments } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
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
import { ErrorBoundary } from "../src/components/ErrorBoundary";

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
    const [isSplashFinished, setIsSplashFinished] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);

    const [fontsLoaded, fontError] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        BebasNeue_400Regular,
    });

    // Listen for auth state changes
    useEffect(() => {
        console.log('[RootLayout] Setting up auth listeners...');

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[RootLayout] Auth state changed:', { event, hasSession: !!session });
                setSession(session);
                if (session?.user) {
                    await fetchProfile();
                }
            }
        );

        // Check initial session
        const initSession = async () => {
            console.log('[RootLayout] Initializing session...');
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    const isInvalidToken =
                        error.message.includes("refresh_token_not_found") ||
                        error.message.includes("Refresh Token Not Found") ||
                        error.message.includes("Invalid Refresh Token") ||
                        error.status === 400; // Common status for bad tokens

                    if (isInvalidToken) {
                        console.warn("[RootLayout] Invalid/Expired session found, clearing auth...");
                        await supabase.auth.signOut();
                        setSession(null);
                    } else {
                        console.error("[RootLayout] Initial session error:", error);
                        setInitError(error.message || "Failed to initialize session");
                    }
                } else {
                    console.log('[RootLayout] Session initialized:', { hasSession: !!session });
                    setSession(session);
                    if (session?.user) {
                        await fetchProfile();
                    }
                }
            } catch (err) {
                console.error("[RootLayout] Failed to get initial session:", err);
                setInitError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                console.log('[RootLayout] Session init complete, setting isReady = true');
                setIsReady(true);
            }
        };

        initSession();

        // Deep linking handler
        const handleDeepLink = async (url: string | null) => {
            if (!url) return;
            console.log('[RootLayout] Handling deep link:', url);
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
            console.log('[RootLayout] Fonts loaded, hiding native splash', { fontsLoaded, fontError });
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    // Auth-based routing
    useEffect(() => {
        if (!isReady) {
            console.log('[RootLayout] Not ready yet, skipping routing');
            return;
        }

        console.log('[RootLayout] Checking auth routing', { user: !!user, segments });

        const inAuthGroup = segments[0] === "(tabs)";
        const inPublicRoute = segments[0] === "login" || segments[0] === "register";

        if (!user && inAuthGroup) {
            console.log('[RootLayout] Not authenticated, redirecting to login');
            // Redirect to login if not authenticated
            router.replace("/login");
        } else if (user && (inPublicRoute || segments[0] === undefined)) {
            console.log('[RootLayout] Authenticated, redirecting to home');
            // Redirect to home if authenticated and on auth screens
            router.replace("/(tabs)");
        }
    }, [user, segments, isReady]);

    // Track splash finish
    useEffect(() => {
        console.log('[RootLayout] State update:', {
            fontsLoaded,
            fontError,
            isReady,
            isSplashFinished,
            shouldShowContent: isReady && isSplashFinished
        });
    }, [fontsLoaded, fontError, isReady, isSplashFinished]);

    if (!fontsLoaded && !fontError) {
        console.log('[RootLayout] Waiting for fonts...');
        return null;
    }

    // Critical: Only show content when BOTH conditions are met
    const shouldShowContent = isReady && isSplashFinished;

    // Show error screen if initialization failed
    if (initError && isSplashFinished) {
        return (
            <ThemeProvider value={TransparentTheme}>
                <View style={styles.container}>
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorTitle}>Error de Inicialización</Text>
                        <Text style={styles.errorMessage}>{initError}</Text>
                        <Text style={styles.errorHint}>
                            Por favor, verifica tu conexión e intenta de nuevo.
                        </Text>
                    </View>
                </View>
            </ThemeProvider>
        );
    }

    return (
        <ErrorBoundary>
            <ThemeProvider value={TransparentTheme}>
                <View style={styles.container}>
                    {shouldShowContent ? (
                        <>
                            <SmokeBackground />
                            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
                                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                                <Stack.Screen name="login" options={{ headerShown: false }} />
                                <Stack.Screen name="register" options={{ headerShown: false }} />
                            </Stack>
                        </>
                    ) : (
                        // Transitional state: splash finished but app not ready
                        isSplashFinished && !isReady && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={Colors.bloodRed} />
                                <Text style={styles.loadingText}>Preparando la aplicación...</Text>
                            </View>
                        )
                    )}
                    {!isSplashFinished && (
                        <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]}>
                            <VideoSplash onFinish={() => {
                                console.log('[RootLayout] Video splash finished');
                                setIsSplashFinished(true);
                            }} />
                        </View>
                    )}
                </View>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        fontSize: 24,
        fontFamily: 'Inter_700Bold',
        color: Colors.bloodRed,
        marginBottom: 12,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        color: Colors.white,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorHint: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: Colors.metalSilver,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
        color: Colors.metalSilver,
        marginTop: 16,
    },
});

