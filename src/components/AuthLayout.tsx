import React, { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
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

const ANIMATION_CONFIG = {
    duration: 300,
    useNativeDriver: true,
    logoScaleKeyboardOpen: 0.85,
    logoScaleKeyboardClosed: 1,
    logoOpacityKeyboardOpen: 1,
    logoOpacityKeyboardClosed: 1,
} as const;

const SCROLL_CONFIG = {
    extraScrollHeight: Platform.select({ ios: 10, android: 5 }) ?? 10,
    extraHeight: Platform.select({ ios: 50, android: 40 }) ?? 45,
    enableOnAndroid: true,
    enableAutomaticScroll: true,
    keyboardOpeningTime: 250,
} as const;

export interface AuthLayoutProps {
    readonly children: ReactNode;
    readonly title: string;
    readonly subtitle: string;
    readonly error?: string | null;
    readonly isLoading: boolean;
    readonly onSubmit: () => void;
    readonly submitButtonText: string;
    readonly linkText: string;
    readonly linkLabel: string;
    readonly linkHref: LinkProps["href"];
    readonly showLogo?: boolean;
    readonly largeLogo?: boolean;
}

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

function dismissKeyboard(): void {
    Keyboard.dismiss();
}

interface AnimatedLogoProps {
    readonly scale: Animated.Value;
    readonly opacity: Animated.Value;
    readonly largeLogo?: boolean;
}

function AnimatedLogo({ scale, opacity, largeLogo }: Readonly<AnimatedLogoProps>): React.JSX.Element {
    const { i18n } = useTranslation();
    const textLogoSource = i18n.language === "en"
        ? require("../../assets/icons/rawcut-text-logo.png")
        : require("../../assets/icons/cortocrudotextlogo.png");

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
            <Image
                source={textLogoSource}
                style={[styles.logoTextImage, largeLogo && styles.logoTextImageLarge]}
                resizeMode="contain"
            />
            <Image
                source={require("../../assets/corto-crudo-logo.png")}
                style={[styles.logoImage, largeLogo && styles.logoImageLarge]}
                resizeMode="contain"
            />
            <Text style={styles.logoSubtitle}>Tu guía de cine y series</Text>
        </Animated.View>
    );
}

interface StaticLogoProps {
    readonly title: string;
    readonly subtitle: string;
    readonly largeLogo?: boolean;
}

function StaticLogo({ title, subtitle, largeLogo }: Readonly<StaticLogoProps>): React.JSX.Element {
    const { i18n } = useTranslation();
    const textLogoSource = i18n.language === "en"
        ? require("../../assets/icons/rawcut-text-logo.png")
        : require("../../assets/icons/cortocrudotextlogo.png");

    return (
        <View style={styles.logoContainer}>
            <Image
                source={textLogoSource}
                style={[styles.logoTextImage, largeLogo && styles.logoTextImageLarge]}
                resizeMode="contain"
            />
            <Text style={styles.logoSubtitle}>{subtitle}</Text>
        </View>
    );
}

interface ErrorMessageProps {
    readonly message: string;
}

function ErrorMessage({ message }: Readonly<ErrorMessageProps>): React.JSX.Element {
    return (
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{message}</Text>
        </View>
    );
}

interface SubmitButtonProps {
    readonly onPress: () => void;
    readonly isLoading: boolean;
    readonly text: string;
}

function SubmitButton({ onPress, isLoading, text }: Readonly<SubmitButtonProps>): React.JSX.Element {
    return (
        <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={onPress}
            disabled={isLoading}
            activeOpacity={0.8}
        >
            {isLoading ? (
                <ActivityIndicator color={Colors.white} />
            ) : (
                <Text style={styles.buttonText}>{text}</Text>
            )}
        </TouchableOpacity>
    );
}

interface AuthLinkProps {
    readonly text: string;
    readonly label: string;
    readonly href: LinkProps["href"];
}

function AuthLink({ text, label, href }: Readonly<AuthLinkProps>): React.JSX.Element {
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
    largeLogo = false,
}: Readonly<AuthLayoutProps>): React.JSX.Element {
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
                        enableResetScrollToCoords={false}
                        bounces={false}
                    >
                        { }
                        {showLogo && (
                            <AnimatedLogo scale={logoScale} opacity={logoOpacity} largeLogo={largeLogo} />
                        )}

                        {!showLogo && <StaticLogo title={title} subtitle={subtitle} largeLogo={largeLogo} />}

                        <View style={styles.formContainer}>
                            { }
                            {!!error && <ErrorMessage message={error} />}

                            { }
                            {children}

                            { }
                            <SubmitButton
                                onPress={onSubmit}
                                isLoading={isLoading}
                                text={submitButtonText}
                            />

                            { }
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
        paddingTop: 40,
        paddingBottom: Platform.select({ ios: 20, android: 40 }),
    } as ViewStyle,
    formContainer: {
        paddingHorizontal: 24,
        width: "100%",
    } as ViewStyle,
    logoContainer: {
        alignItems: "center",
        marginBottom: 24,
    } as ViewStyle,
    animatedLogoContainer: {

        overflow: "visible",
    } as ViewStyle,
    logoTextImage: {
        width: 240,
        height: 60,
        marginBottom: -10, // Tighter gap with the skull logo
    } as ImageStyle,
    logoTextImageLarge: {
        width: 300,
        height: 80,
    } as ImageStyle,
    logoImage: {
        width: 160,
        height: 160,
        marginBottom: -10, // Tighter gap with the subtitle
    } as ImageStyle,
    logoImageLarge: {
        width: 200,
        height: 200,
    } as ImageStyle,
    logoSubtitle: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginTop: 0,
    } as TextStyle,
    errorContainer: {
        backgroundColor: "rgba(220, 38, 38, 0.2)",
        borderColor: Colors.errorRed,
        borderWidth: 1,
        borderRadius: 4,
        padding: 12,
        marginBottom: 16,
    } as ViewStyle,
    errorText: {
        color: Colors.errorRed,
        textAlign: "center",
    } as TextStyle,
    button: {
        backgroundColor: Colors.vibrantRed,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 4,
        marginTop: 24,
    } as ViewStyle,
    buttonDisabled: {
        opacity: 0.5,
    } as ViewStyle,
    buttonText: {
        color: Colors.white,
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
        color: Colors.vibrantRed,
        fontWeight: "bold",
    } as TextStyle,
});

export default AuthLayout;