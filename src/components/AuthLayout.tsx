import React, { useEffect, useRef, type ReactNode } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Image,
    Animated,
    Keyboard,
    TouchableWithoutFeedback,
    Platform,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, type LinkProps } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Colors } from "../constants/Colors";

/** Animation configuration constants */
const ANIMATION_CONFIG = {
    duration: 300,
    useNativeDriver: true,
    logoScaleKeyboardOpen: 0.6,
    logoScaleKeyboardClosed: 1,
    logoOpacityKeyboardOpen: 0.85,
    logoOpacityKeyboardClosed: 1,
} as const;

/** KeyboardAwareScrollView configuration */
const SCROLL_CONFIG = {
    extraScrollHeight: Platform.select({ ios: 40, android: 20 }) ?? 30,
    extraHeight: Platform.select({ ios: 120, android: 100 }) ?? 110,
    enableOnAndroid: true,
    enableAutomaticScroll: true,
    keyboardOpeningTime: 250,
} as const;

/**
 * Props for AuthLayout component
 */
export interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    error?: string | null;
    isLoading: boolean;
    onSubmit: () => void;
    submitButtonText: string;
    linkText: string;
    linkLabel: string;
    linkHref: LinkProps["href"];
    showLogo?: boolean;
}

/**
 * Custom hook to handle keyboard-driven logo animations
 * Returns animated values for scale and opacity transitions
 */
function useKeyboardAnimation() {
    const logoScale = useRef(new Animated.Value(ANIMATION_CONFIG.logoScaleKeyboardClosed)).current;
    const logoOpacity = useRef(new Animated.Value(ANIMATION_CONFIG.logoOpacityKeyboardClosed)).current;

    useEffect(() => {
        const animateLogo = (isKeyboardVisible: boolean) => {
            const toScale = isKeyboardVisible
                ? ANIMATION_CONFIG.logoScaleKeyboardOpen
                : ANIMATION_CONFIG.logoScaleKeyboardClosed;
            const toOpacity = isKeyboardVisible
                ? ANIMATION_CONFIG.logoOpacityKeyboardOpen
                : ANIMATION_CONFIG.logoOpacityKeyboardClosed;

            Animated.parallel([
                Animated.timing(logoScale, {
                    toValue: toScale,
                    duration: ANIMATION_CONFIG.duration,
                    useNativeDriver: ANIMATION_CONFIG.useNativeDriver,
                }),
                Animated.timing(logoOpacity, {
                    toValue: toOpacity,
                    duration: ANIMATION_CONFIG.duration,
                    useNativeDriver: ANIMATION_CONFIG.useNativeDriver,
                }),
            ]).start();
        };

        // Platform-specific keyboard event names
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const keyboardShowListener = Keyboard.addListener(showEvent, () => {
            animateLogo(true);
        });

        const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
            animateLogo(false);
        });

        return () => {
            keyboardShowListener.remove();
            keyboardHideListener.remove();
        };
    }, [logoScale, logoOpacity]);

    return { logoScale, logoOpacity };
}

/**
 * Dismisses the keyboard when called
 */
function dismissKeyboard(): void {
    Keyboard.dismiss();
}

/**
 * Animated Logo component for the login screen
 */
interface AnimatedLogoProps {
    scale: Animated.Value;
    opacity: Animated.Value;
}

function AnimatedLogo({ scale, opacity }: AnimatedLogoProps): React.JSX.Element {
    return (
        <Animated.View
            style={[
                styles.logoContainer,
                styles.animatedLogoContainer,
                {
                    transform: [{ scale }],
                    opacity,
                },
            ]}
        >
            <Text style={[styles.logoText, { fontFamily: "BebasNeue_400Regular" }]}>
                CortoCrudo
            </Text>
            <Image
                source={require("../../assets/2.png")}
                style={styles.logoImage}
                resizeMode="contain"
            />
            <Text style={styles.logoSubtitle}>Tu guía de cine y series</Text>
        </Animated.View>
    );
}

/**
 * Static Logo component for the register screen
 */
interface StaticLogoProps {
    title: string;
    subtitle: string;
}

function StaticLogo({ title, subtitle }: StaticLogoProps): React.JSX.Element {
    return (
        <View style={styles.logoContainer}>
            <Text style={[styles.logoText, { fontFamily: "BebasNeue_400Regular" }]}>
                {title}
            </Text>
            <Text style={styles.logoSubtitle}>{subtitle}</Text>
        </View>
    );
}

/**
 * Error message display component
 */
interface ErrorMessageProps {
    message: string;
}

function ErrorMessage({ message }: ErrorMessageProps): React.JSX.Element {
    return (
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{message}</Text>
        </View>
    );
}

/**
 * Submit button component
 */
interface SubmitButtonProps {
    onPress: () => void;
    isLoading: boolean;
    text: string;
}

function SubmitButton({ onPress, isLoading, text }: SubmitButtonProps): React.JSX.Element {
    return (
        <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={onPress}
            disabled={isLoading}
            activeOpacity={0.8}
        >
            {isLoading ? (
                <ActivityIndicator color={Colors.metalBlack} />
            ) : (
                <Text style={styles.buttonText}>{text}</Text>
            )}
        </TouchableOpacity>
    );
}

/**
 * Navigation link component
 */
interface AuthLinkProps {
    text: string;
    label: string;
    href: LinkProps["href"];
}

function AuthLink({ text, label, href }: AuthLinkProps): React.JSX.Element {
    return (
        <View style={styles.linkContainer}>
            <Text style={styles.linkText}>{text} </Text>
            <Link href={href} asChild>
                <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.link}>{label}</Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}

/**
 * Shared layout component for authentication screens
 * Provides consistent structure for login and register screens
 *
 * Features:
 * - Animated logo that shrinks when keyboard appears (login only)
 * - Auto-scroll to focused input field
 * - Tap outside to dismiss keyboard
 * - Platform-specific keyboard handling (iOS/Android)
 * - Accessible and properly typed
 */
export function AuthLayout({
    children,
    title,
    subtitle,
    error,
    isLoading,
    onSubmit,
    submitButtonText,
    linkText,
    linkLabel,
    linkHref,
    showLogo = false,
}: AuthLayoutProps): React.JSX.Element {
    const { logoScale, logoOpacity } = useKeyboardAnimation();

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
                <View style={styles.container}>
                    <KeyboardAwareScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollViewContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        extraScrollHeight={SCROLL_CONFIG.extraScrollHeight}
                        extraHeight={SCROLL_CONFIG.extraHeight}
                        enableOnAndroid={SCROLL_CONFIG.enableOnAndroid}
                        enableAutomaticScroll={SCROLL_CONFIG.enableAutomaticScroll}
                        keyboardOpeningTime={SCROLL_CONFIG.keyboardOpeningTime}
                        bounces={false}
                    >
                        {/* Animated Logo for Login Screen */}
                        {showLogo && (
                            <AnimatedLogo scale={logoScale} opacity={logoOpacity} />
                        )}

                        {/* Static Logo for Register Screen */}
                        {!showLogo && <StaticLogo title={title} subtitle={subtitle} />}

                        <View style={styles.formContainer}>
                            {/* Error Message */}
                            {!!error && <ErrorMessage message={error} />}

                            {/* Form Fields */}
                            {children}

                            {/* Submit Button */}
                            <SubmitButton
                                onPress={onSubmit}
                                isLoading={isLoading}
                                text={submitButtonText}
                            />

                            {/* Navigation Link */}
                            <AuthLink text={linkText} label={linkLabel} href={linkHref} />
                        </View>
                    </KeyboardAwareScrollView>
                </View>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
    } as ViewStyle,
    container: {
        flex: 1,
    } as ViewStyle,
    scrollView: {
        flex: 1,
    } as ViewStyle,
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingBottom: Platform.select({ ios: 20, android: 40 }),
    } as ViewStyle,
    formContainer: {
        paddingHorizontal: 24,
        width: "100%",
    } as ViewStyle,
    logoContainer: {
        alignItems: "center",
        marginBottom: 32,
    } as ViewStyle,
    animatedLogoContainer: {
        // Prevent layout shift during animation
        overflow: "visible",
    } as ViewStyle,
    logoText: {
        color: Colors.bloodRed,
        fontSize: 48,
        lineHeight: 52,
        marginBottom: 8,
    } as TextStyle,
    logoImage: {
        width: 200,
        height: 200,
        marginBottom: 8,
    } as ImageStyle,
    logoSubtitle: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginTop: 0,
    } as TextStyle,
    errorContainer: {
        backgroundColor: "rgba(220, 38, 38, 0.2)",
        borderColor: Colors.bloodRed,
        borderWidth: 1,
        borderRadius: 4,
        padding: 12,
        marginBottom: 16,
    } as ViewStyle,
    errorText: {
        color: Colors.bloodRed,
        textAlign: "center",
    } as TextStyle,
    button: {
        backgroundColor: Colors.bloodRed,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 4,
        marginTop: 24,
    } as ViewStyle,
    buttonDisabled: {
        opacity: 0.5,
    } as ViewStyle,
    buttonText: {
        color: Colors.metalBlack,
        fontWeight: "bold",
        textAlign: "center",
        textTransform: "uppercase",
        fontSize: 18,
    } as TextStyle,
    linkContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 24,
        paddingBottom: 16,
    } as ViewStyle,
    linkText: {
        color: Colors.metalSilver,
    } as TextStyle,
    link: {
        color: Colors.bloodRed,
        fontWeight: "bold",
    } as TextStyle,
});

export default AuthLayout;