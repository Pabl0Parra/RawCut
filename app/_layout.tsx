// app/_layout.tsx
import { Stack, SplashScreen, useRouter, useSegments } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState, useCallback, useRef } from "react";
import {
    View,
    StyleSheet,
    ActivityIndicator,
    Text,
    TouchableOpacity,
} from "react-native";
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

const SESSION_INIT_TIMEOUT_MS = 10_000;

/**
 * Only these auth events should trigger a profile re-fetch.
 * Notably excludes INITIAL_SESSION (handled by initSession)
 * and TOKEN_REFRESHED (session exists, profile unchanged).
 */
const PROFILE_FETCH_EVENTS = new Set<AuthChangeEvent>([
    "SIGNED_IN",
    "USER_UPDATED",
]);

/**
 * Specific error messages that indicate an invalid/expired refresh token.
 * Intentionally narrow — we never want to swallow unrelated 400s.
 */
const INVALID_TOKEN_MESSAGES = [
    "refresh_token_not_found",
    "Refresh Token Not Found",
    "Invalid Refresh Token",
] as const;

function isInvalidTokenError(error: { message: string }): boolean {
    return INVALID_TOKEN_MESSAGES.some((msg) => error.message.includes(msg));
}

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
 * Races a promise against a timeout. The original promise continues executing
 * in the background if the timeout wins — callers should handle cleanup if needed.
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

/**
 * Non-critical profile fetch with its own timeout.
 * Failures are logged but never propagated — the profile will be
 * retried by useFocusEffect in HomeScreen.
 */
async function fetchProfileSafely(): Promise<void> {
    try {
        await withTimeout(
            useAuthStore.getState().fetchProfile(),
            SESSION_INIT_TIMEOUT_MS,
            "Profile fetch timed out",
        );
    } catch (err) {
        console.warn("[RootLayout] Profile fetch failed (non-fatal):", err);
    }
}

// ============================================================================
// Root Layout
// ============================================================================

export default function RootLayout() {
    const segments = useSegments();
    const router = useRouter();

    const [isReady, setIsReady] = useState(false);
    const [isSplashFinished, setIsSplashFinished] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);

    // Track whether the component is still mounted for async safety.
    // Root layouts rarely unmount, but ErrorBoundary resets and
    // StrictMode double-effects in dev can cause it.
    const mountedRef = useRef(true);

    // Read auth state reactively for rendering/routing, but access
    // store methods via getState() inside effects to avoid stale closures.
    const user = useAuthStore((s) => s.user);

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
        mountedRef.current = true;
        console.log("[RootLayout] Setting up auth listeners…");

        // 1. Subscribe to ongoing auth changes.
        //    All store access goes through getState() — never from closures.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                if (!mountedRef.current) return;

                console.log("[RootLayout] Auth state changed:", {
                    event,
                    hasSession: !!session,
                });

                useAuthStore.getState().setSession(session);

                if (PROFILE_FETCH_EVENTS.has(event) && session?.user) {
                    try {
                        await useAuthStore.getState().fetchProfile();
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
        //    Cognitive complexity kept ≤ 15 by extracting handleSessionError
        //    and fetchProfileSafely.
        const handleSessionError = (
            error: { message: string },
        ): void => {
            if (isInvalidTokenError(error)) {
                // Supabase auto-signs-out on invalid refresh tokens
                // (fires SIGNED_OUT before INITIAL_SESSION), so we
                // only need to clear local state.
                console.warn(
                    "[RootLayout] Invalid/Expired session detected, clearing local state…",
                );
                useAuthStore.getState().setSession(null);
            } else {
                console.error("[RootLayout] Session error:", error);
                setInitError(error.message || "Failed to initialize session");
            }
        };

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

                if (!mountedRef.current) return;

                if (error) {
                    handleSessionError(error);
                    return;
                }

                console.log("[RootLayout] Session initialized:", {
                    hasSession: !!session,
                });
                useAuthStore.getState().setSession(session);

                if (session?.user) {
                    await fetchProfileSafely();
                }
            } catch (err) {
                if (!mountedRef.current) return;

                if (isTimeoutError(err)) {
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
                if (mountedRef.current) {
                    console.log(
                        "[RootLayout] Session init complete → isReady = true",
                    );
                    setIsReady(true);
                }
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
                if (data.session && mountedRef.current) {
                    useAuthStore.getState().setSession(data.session);
                }
            }
        };

        const deepLinkSub = Linking.addEventListener("url", (event) => {
            handleDeepLink(event.url);
        });

        Linking.getInitialURL()
            .then(handleDeepLink)
            .catch((err) => {
                console.warn("[RootLayout] getInitialURL failed:", err);
            });

        return () => {
            mountedRef.current = false;
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
    // Auth-based routing
    //
    // Depends on actual state values (isReady, isSplashFinished), not derived
    // variables, so the dependency array is honest and refactor-safe.
    // ────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isReady || !isSplashFinished) {
            return;
        }

        console.log("[RootLayout] Auth routing check:", {
            user: !!user,
            segments,
        });

        const currentRoot = segments[0];
        const inAuthGroup = currentRoot === "(tabs)";
        const inPublicRoute =
            currentRoot === "login" || currentRoot === "register";

        if (!user && inAuthGroup) {
            console.log("[RootLayout] Unauthenticated → /login");
            router.replace("/login");
        } else if (user && (inPublicRoute || currentRoot === undefined)) {
            console.log("[RootLayout] Authenticated → /(tabs)");
            router.replace("/(tabs)");
        }
    }, [user, segments, isReady, isSplashFinished]);

    // ────────────────────────────────────────────────────────────────────────
    // Stable callbacks
    // ────────────────────────────────────────────────────────────────────────
    const handleSplashFinish = useCallback(() => {
        console.log("[RootLayout] Video splash finished");
        setIsSplashFinished(true);
    }, []);

    const handleRetryInit = useCallback(() => {
        setInitError(null);
        setIsReady(false);

        supabase.auth
            .getSession()
            .then(({ data: { session }, error }) => {
                if (!mountedRef.current) return;

                if (error) {
                    setInitError(error.message);
                } else {
                    useAuthStore.getState().setSession(session);
                }
                setIsReady(true);
            })
            .catch((err) => {
                if (!mountedRef.current) return;
                setInitError(
                    err instanceof Error ? err.message : "Retry failed",
                );
                setIsReady(true);
            });
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
    // The Stack is ALWAYS mounted so router.replace() never fires against a
    // non-existent navigator. Overlays block interaction with pointerEvents
    // until the app is ready.
    //
    // IMPORTANT: Because the Stack mounts immediately, (tabs) will render
    // before auth resolves. Tab screens that make authenticated API calls
    // MUST guard with: if (!user) return;
    // This is the correct pattern — screens should be resilient to mounting
    // before auth is known.
    // ────────────────────────────────────────────────────────────────────────
    const appReady = isReady && isSplashFinished && !initError;

    return (
        <ErrorBoundary>
            <ThemeProvider value={TransparentTheme}>
                <View style={styles.container}>
                    {appReady && <SmokeBackground />}

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

                    {/* ── Overlay: loading (splash done, session still resolving) ── */}
                    {isSplashFinished && !isReady && (
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                styles.loadingOverlay,
                            ]}
                            pointerEvents="auto"
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

                    {/* ── Overlay: fatal init error with retry ── */}
                    {initError && isSplashFinished && (
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                styles.errorOverlay,
                            ]}
                            pointerEvents="auto"
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
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={handleRetryInit}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.retryButtonText}>
                                    Reintentar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ── Overlay: video splash (highest z-index) ── */}
                    {!isSplashFinished && (
                        <View
                            style={[
                                StyleSheet.absoluteFill,
                                styles.splashOverlay,
                            ]}
                            pointerEvents="auto"
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
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: Colors.bloodRed,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
        elevation: 3,
        shadowColor: Colors.bloodRed,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    retryButtonText: {
        fontSize: 16,
        fontFamily: "Inter_600SemiBold",
        color: Colors.white,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: "Inter_400Regular",
        color: Colors.metalSilver,
        marginTop: 16,
    },
});