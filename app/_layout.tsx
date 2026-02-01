import { Stack, SplashScreen, useRouter, useSegments } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState, useCallback } from "react";
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

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

// Prevent the native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// ============================================================================
// Constants
// ============================================================================

/** Maximum time to wait for session initialization before proceeding unauthenticated */
const SESSION_INIT_TIMEOUT_MS = 10_000;

/** Auth events that warrant a profile re-fetch */
const PROFILE_FETCH_EVENTS = new Set<AuthChangeEvent>([
    "SIGNED_IN",
    "USER_UPDATED",
]);

// ============================================================================
// Helpers
// ============================================================================

const TransparentTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: "transparent",
    },
};

/**
 * Races a promise against a timeout.
 * Rejects with `Error(message)` if the deadline fires first.
 */
function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    message: string,
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeout = new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), ms);
    });

    return Promise.race([promise, timeout]).finally(() =>
        clearTimeout(timeoutId),
    );
}

function isTimeoutError(err: unknown): boolean {
    return err instanceof Error && err.message.includes("timed out");
}

// ============================================================================
// Root Layout
// ============================================================================

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

    // ────────────────────────────────────────────────────────────────────────
    // Auth initialization
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        console.log("[RootLayout] Setting up auth listeners…");

        // 1. Subscribe to ongoing auth changes.
        //    Skip INITIAL_SESSION to avoid a double fetchProfile (initSession
        //    handles it below).
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                console.log("[RootLayout] Auth state changed:", {
                    event,
                    hasSession: !!session,
                });

                setSession(session);

                if (PROFILE_FETCH_EVENTS.has(event) && session?.user) {
                    try {
                        await fetchProfile();
                    } catch (err) {
                        console.warn(
                            "[RootLayout] fetchProfile (onAuthStateChange) failed:",
                            err,
                        );
                    }
                }
            },
        );

        // 2. Initialise the session from storage (with a hard timeout).
        const initSession = async (): Promise<void> => {
            console.log("[RootLayout] Initializing session…");

            try {
                const {
                    data: { session },
                    error,
                } = await withTimeout(
                    supabase.auth.getSession(),
                    SESSION_INIT_TIMEOUT_MS,
                    "Session initialization timed out",
                );

                if (error) {
                    const isInvalidToken =
                        error.message.includes("refresh_token_not_found") ||
                        error.message.includes("Refresh Token Not Found") ||
                        error.message.includes("Invalid Refresh Token") ||
                        error.status === 400;

                    if (isInvalidToken) {
                        // Supabase auto-signs-out on invalid refresh tokens
                        // (fires SIGNED_OUT before INITIAL_SESSION), so we
                        // only need to clear local state — no redundant signOut().
                        console.warn(
                            "[RootLayout] Invalid/Expired session detected, clearing local state…",
                        );
                        setSession(null);
                    } else {
                        console.error("[RootLayout] Session error:", error);
                        setInitError(
                            error.message || "Failed to initialize session",
                        );
                    }
                } else {
                    console.log("[RootLayout] Session initialized:", {
                        hasSession: !!session,
                    });
                    setSession(session);

                    if (session?.user) {
                        // Profile fetch is non-critical – wrap with its own timeout
                        try {
                            await withTimeout(
                                fetchProfile(),
                                SESSION_INIT_TIMEOUT_MS,
                                "Profile fetch timed out",
                            );
                        } catch (profileErr) {
                            console.warn(
                                "[RootLayout] Profile fetch failed (non-fatal):",
                                profileErr,
                            );
                            // The profile will be fetched again by useFocusEffect
                            // in the home screen – don't block startup.
                        }
                    }
                }
            } catch (err) {
                if (isTimeoutError(err)) {
                    // Timeout: proceed as unauthenticated – the user can still
                    // log in and a fresh session will be established.
                    console.warn(
                        "[RootLayout] Session init timed out, proceeding without session",
                    );
                } else {
                    console.error("[RootLayout] initSession error:", err);
                    setInitError(
                        err instanceof Error ? err.message : "Unknown error",
                    );
                }
            } finally {
                console.log(
                    "[RootLayout] Session init complete → isReady = true",
                );
                setIsReady(true);
            }
        };

        initSession();

        // 3. Deep-link handler
        const handleDeepLink = async (url: string | null): Promise<void> => {
            if (!url) return;
            console.log("[RootLayout] Handling deep link:", url);

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

        const deepLinkSub = Linking.addEventListener("url", (event) => {
            handleDeepLink(event.url);
        });
        Linking.getInitialURL().then(handleDeepLink);

        return () => {
            subscription.unsubscribe();
            deepLinkSub.remove();
        };
    }, []);

    // ────────────────────────────────────────────────────────────────────────
    // Hide the native splash as soon as fonts are available so our custom
    // VideoSplash can take over.
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (fontsLoaded || fontError) {
            console.log("[RootLayout] Fonts loaded, hiding native splash");
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    // ────────────────────────────────────────────────────────────────────────
    // Auth-based routing – only fires once BOTH the session is resolved AND
    // the splash is dismissed, guaranteeing the Stack navigator is mounted.
    // ────────────────────────────────────────────────────────────────────────
    const shouldShowContent = isReady && isSplashFinished;

    useEffect(() => {
        if (!shouldShowContent) {
            console.log("[RootLayout] Not fully ready, deferring routing");
            return;
        }

        console.log("[RootLayout] Auth routing check:", {
            user: !!user,
            segments,
        });

        const inAuthGroup = segments[0] === "(tabs)";
        const inPublicRoute =
            segments[0] === "login" || segments[0] === "register";

        if (!user && inAuthGroup) {
            console.log("[RootLayout] Unauthenticated → /login");
            router.replace("/login");
        } else if (user && (inPublicRoute || segments[0] === undefined)) {
            console.log("[RootLayout] Authenticated → /(tabs)");
            router.replace("/(tabs)");
        }
    }, [user, segments, shouldShowContent]);

    // ────────────────────────────────────────────────────────────────────────
    // Splash callback (stable reference)
    // ────────────────────────────────────────────────────────────────────────
    const handleSplashFinish = useCallback(() => {
        console.log("[RootLayout] Video splash finished");
        setIsSplashFinished(true);
    }, []);

    // ────────────────────────────────────────────────────────────────────────
    // Early bail: fonts not ready yet
    // ────────────────────────────────────────────────────────────────────────
    if (!fontsLoaded && !fontError) {
        return null;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Render
    //
    // KEY ARCHITECTURAL CHANGE: The Stack is ALWAYS mounted.
    // Splash, loading and error states render as overlays on top.
    // This prevents the race condition where router.replace() fires
    // before the navigator exists.
    // ────────────────────────────────────────────────────────────────────────
    return (
        <ErrorBoundary>
            <ThemeProvider value={TransparentTheme}>
                <View style={styles.container}>
                    {/* Smoke background – only once the app is fully ready */}
                    {shouldShowContent && <SmokeBackground />}

                    {/* Always-mounted navigator */}
                    <Stack
                        screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: "transparent" },
                        }}
                    >
                        <Stack.Screen
                            name="(tabs)"
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="login"
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="register"
                            options={{ headerShown: false }}
                        />
                    </Stack>

                    {/* ── Overlay: loading (splash done, session still loading) ── */}
                    {isSplashFinished && !isReady && (
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                styles.loadingOverlay,
                            ]}
                        >
                            <ActivityIndicator
                                size="large"
                                color={Colors.bloodRed}
                            />
                            <Text style={styles.loadingText}>
                                Preparando la aplicación…
                            </Text>
                        </View>
                    )}

                    {/* ── Overlay: fatal init error ── */}
                    {initError && isSplashFinished && (
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                styles.errorOverlay,
                            ]}
                        >
                            <Text style={styles.errorTitle}>
                                Error de Inicialización
                            </Text>
                            <Text style={styles.errorMessage}>
                                {initError}
                            </Text>
                            <Text style={styles.errorHint}>
                                Por favor, verifica tu conexión e intenta de
                                nuevo.
                            </Text>
                        </View>
                    )}

                    {/* ── Overlay: video splash (highest z-index) ── */}
                    {!isSplashFinished && (
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                styles.splashOverlay,
                            ]}
                        >
                            <VideoSplash onFinish={handleSplashFinish} />
                        </View>
                    )}
                </View>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
    splashOverlay: {
        zIndex: 999,
    },
    loadingOverlay: {
        zIndex: 998,
        backgroundColor: Colors.metalBlack,
        justifyContent: "center",
        alignItems: "center",
    },
    errorOverlay: {
        zIndex: 998,
        backgroundColor: Colors.metalBlack,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorTitle: {
        fontSize: 24,
        fontFamily: "Inter_700Bold",
        color: Colors.bloodRed,
        marginBottom: 12,
        textAlign: "center",
    },
    errorMessage: {
        fontSize: 16,
        fontFamily: "Inter_400Regular",
        color: Colors.white,
        marginBottom: 8,
        textAlign: "center",
    },
    errorHint: {
        fontSize: 14,
        fontFamily: "Inter_400Regular",
        color: Colors.metalSilver,
        textAlign: "center",
    },
    loadingText: {
        fontSize: 16,
        fontFamily: "Inter_400Regular",
        color: Colors.metalSilver,
        marginTop: 16,
    },
});