import "../src/lib/i18n";
import { Stack, SplashScreen, useRouter, useSegments } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState, useCallback, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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
import SmokeBackground from "../src/components/SmokeBackground";
import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import AnimatedSplash from "../src/components/AnimatedSplash";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

SplashScreen.preventAutoHideAsync();

const SESSION_INIT_TIMEOUT_MS = 8_000;

const PROFILE_FETCH_EVENTS = new Set<AuthChangeEvent>([
    "SIGNED_IN",
    "USER_UPDATED",
]);

const INVALID_TOKEN_MESSAGES = [
    "refresh_token_not_found",
    "Refresh Token Not Found",
    "Invalid Refresh Token",
] as const;

function isInvalidTokenError(error: { message: string }): boolean {
    return INVALID_TOKEN_MESSAGES.some((msg) => error.message.includes(msg));
}

const TransparentTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: "transparent",
    },
};

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

function isNetworkError(err: unknown): boolean {
    if (!(err instanceof Error)) return false;
    const msg = err.message.toLowerCase();
    return (
        msg.includes("network request failed") ||
        msg.includes("network error") ||
        msg.includes("failed to fetch") ||
        msg.includes("could not connect") ||
        msg.includes("etimedout") ||
        msg.includes("econnrefused")
    );
}

async function fetchProfileSafely(): Promise<boolean> {
    try {
        await withTimeout(
            useAuthStore.getState().fetchProfile(),
            SESSION_INIT_TIMEOUT_MS,
            "Profile fetch timed out",
        );
        return false;
    } catch (err) {
        console.warn("[RootLayout] Profile fetch failed (non-fatal):", err);
        return isTimeoutError(err) || isNetworkError(err);
    }
}

export default function RootLayout() {
    const segments = useSegments();
    const router = useRouter();

    const [isReady, setIsReady] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const mountedRef = useRef(true);

    const user = useAuthStore((s) => s.user);

    const [fontsLoaded, fontError] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        BebasNeue_400Regular,
    });

    useEffect(() => {
        mountedRef.current = true;

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                if (!mountedRef.current) return;

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

        const handleSessionError = (error: { message: string }): void => {
            if (isInvalidTokenError(error)) {
                console.warn(
                    "[RootLayout] Invalid/Expired session detected, clearing local state…",
                );
                useAuthStore.getState().setSession(null);
            } else {
                console.error("[RootLayout] Session error:", error);
                setInitError(error.message || "Failed to initialize session");
            }
        };

        const handleSessionSuccess = async (session: Session | null): Promise<void> => {
            useAuthStore.getState().setSession(session);
            if (!session?.user) return;
            const networkFailed = await fetchProfileSafely();
            if (networkFailed && mountedRef.current) {
                setIsOffline(true);
            }
        };

        const initSession = async (): Promise<void> => {
            try {
                const { data: { session }, error } = await withTimeout(
                    supabase.auth.getSession(),
                    SESSION_INIT_TIMEOUT_MS,
                    "Session initialization timed out",
                );

                if (!mountedRef.current) return;
                if (error) { handleSessionError(error); return; }

                await handleSessionSuccess(session);
            } catch (err) {
                if (!mountedRef.current) return;

                if (isTimeoutError(err) || isNetworkError(err)) {
                    console.warn(
                        "[RootLayout] Session init failed due to network/timeout, proceeding offline",
                    );
                    setIsOffline(true);
                } else {
                    console.error("[RootLayout] initSession error:", err);
                    setInitError(
                        err instanceof Error ? err.message : "Unknown error",
                    );
                }
            } finally {
                if (mountedRef.current) {
                    setIsReady(true);
                }
            }
        };

        initSession();

        const handleDeepLink = async (url: string | null): Promise<void> => {
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

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    useEffect(() => {
        if (!isReady) return;

        const currentRoot = segments[0];
        const inAuthGroup = currentRoot === "(tabs)";
        const inPublicRoute =
            currentRoot === "login" || currentRoot === "register";

        if (!user && inAuthGroup) {
            router.replace("/login");
        } else if (user && (inPublicRoute || currentRoot === undefined)) {
            router.replace("/(tabs)");
        }
    }, [user, segments, isReady]);

    const handleRetryInit = useCallback(() => {
        setInitError(null);
        setIsOffline(false);
        setIsReady(false);

        withTimeout(
            supabase.auth.getSession(),
            SESSION_INIT_TIMEOUT_MS,
            "Session initialization timed out",
        )
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
                if (isTimeoutError(err) || isNetworkError(err)) {
                    console.warn("[RootLayout] Retry failed due to network/timeout, proceeding offline");
                    setIsOffline(true);
                } else {
                    setInitError(
                        err instanceof Error ? err.message : "Retry failed",
                    );
                }
                setIsReady(true);
            });
    }, []);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    const appReady = isReady && !initError;
    const showOfflineBanner = isOffline;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
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

                        {showOfflineBanner && (
                            <View style={styles.offlineBanner} pointerEvents="box-none">
                                <Text style={styles.offlineBannerText}>
                                    📡 Sin conexión — algunas funciones no estarán disponibles
                                </Text>
                            </View>
                        )}

                        {!isReady && (
                            <AnimatedSplash />
                        )}

                        {initError && (
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
                    </View>
                </ThemeProvider>
            </ErrorBoundary>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
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
    offlineBanner: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 997,
        backgroundColor: "rgba(30, 30, 30, 0.92)",
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    offlineBannerText: {
        fontSize: 13,
        fontFamily: "Inter_400Regular",
        color: Colors.metalSilver,
        textAlign: "center",
    },
});