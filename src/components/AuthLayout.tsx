import React, { type ReactNode } from "react";
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Image,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { Colors } from "../constants/Colors";

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
    linkHref: string;
    showLogo?: boolean;
}

/**
 * Shared layout component for authentication screens
 * Provides consistent structure for login and register screens
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
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Logo/Title - Static Header (only for login) */}
            {showLogo && (
                <View style={styles.logoContainer}>
                    <Text
                        style={[styles.logoText, { fontFamily: "BebasNeue_400Regular" }]}
                    >
                        CortoCrudo
                    </Text>
                    <Image
                        source={require("../../assets/corto-crudo-logo.png")}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.logoSubtitle}>
                        Tu guía de cine y series
                    </Text>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.contentContainer}>
                        {/* Logo/Title (for register) */}
                        {!showLogo && (
                            <View style={styles.logoContainer}>
                                <Text
                                    style={[
                                        styles.logoText,
                                        { fontFamily: "BebasNeue_400Regular" },
                                    ]}
                                >
                                    {title}
                                </Text>
                                <Text style={styles.logoSubtitle}>{subtitle}</Text>
                            </View>
                        )}

                        {/* Error Message */}
                        {!!error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Form Fields (children) */}
                        {children}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                isLoading && styles.buttonDisabled,
                            ]}
                            onPress={onSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#0a0a0a" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {submitButtonText}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Link to other auth screen */}
                        <View style={styles.linkContainer}>
                            <Text style={styles.linkText}>{linkText} </Text>
                            <Link href={linkHref} asChild>
                                <TouchableOpacity>
                                    <Text style={styles.link}>{linkLabel}</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    } as ViewStyle,
    keyboardAvoidingView: {
        flex: 1,
    } as ViewStyle,
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: "center",
    } as ViewStyle,
    contentContainer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        width: "100%",
    } as ViewStyle,
    logoContainer: {
        alignItems: "center",
        marginBottom: 32,
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
