import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    type ViewStyle,
    type TextStyle,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import SmokeBackground from './SmokeBackground';

interface AuthLayoutProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    error?: string | null;
    isLoading?: boolean;
    onSubmit: () => void;
    submitButtonText: string;
    linkText: string;
    linkLabel: string;
    linkHref: string;
    showLogo?: boolean;
}

export function AuthLayout({
    title,
    subtitle,
    children,
    error,
    isLoading,
    onSubmit,
    submitButtonText,
    linkText,
    linkLabel,
    linkHref,
    showLogo = true,
}: AuthLayoutProps) {
    return (
        <SafeAreaView style={styles.container}>
            <SmokeBackground />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        {showLogo && (
                            <Text style={styles.logo}>CORTOCRUDO</Text>
                        )}
                        <Text style={styles.title}>{title}</Text>
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </View>

                    <View style={styles.formContainer}>
                        {children}

                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={onSubmit}
                            disabled={isLoading}
                            activeOpacity={0.8}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.submitButtonText}>{submitButtonText}</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footerLink}>
                            <Text style={styles.linkText}>{linkText} </Text>
                            <Link href={linkHref as any} asChild>
                                <TouchableOpacity>
                                    <Text style={styles.linkLabel}>{linkLabel}</Text>
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
    container: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    } as ViewStyle,
    keyboardView: {
        flex: 1,
    } as ViewStyle,
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    } as ViewStyle,
    header: {
        alignItems: 'center',
        marginBottom: 40,
    } as ViewStyle,
    logo: {
        fontSize: 48,
        fontFamily: 'BebasNeue_400Regular',
        color: Colors.bloodRed,
        marginBottom: 8,
    } as TextStyle,
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.white,
        textAlign: 'center',
    } as TextStyle,
    subtitle: {
        fontSize: 16,
        color: Colors.metalSilver,
        marginTop: 8,
        textAlign: 'center',
    } as TextStyle,
    formContainer: {
        width: '100%',
    } as ViewStyle,
    errorContainer: {
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        padding: 12,
        borderRadius: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(220, 38, 38, 0.3)',
    } as ViewStyle,
    errorText: {
        color: Colors.bloodRed,
        fontSize: 14,
        textAlign: 'center',
    } as TextStyle,
    submitButton: {
        backgroundColor: Colors.bloodRed,
        paddingVertical: 16,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 8,
    } as ViewStyle,
    submitButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    } as TextStyle,
    footerLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    } as ViewStyle,
    linkText: {
        color: Colors.metalSilver,
        fontSize: 14,
    } as TextStyle,
    linkLabel: {
        color: Colors.bloodRed,
        fontSize: 14,
        fontWeight: 'bold',
    } as TextStyle,
});

export default AuthLayout;
