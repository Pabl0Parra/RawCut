import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { Colors } from "../constants/Colors";

interface UnauthenticatedStateProps {
    readonly message: string;
    readonly buttonLabel: string;
}

export function UnauthenticatedState({ message, buttonLabel }: UnauthenticatedStateProps): React.JSX.Element {
    return (
        <View style={styles.emptyContainer}>
            <Text style={styles.largeIcon}>🔒</Text>
            <Text style={styles.emptyTitle}>{message}</Text>
            <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push("/login")}
            >
                <Text style={styles.loginButtonText}>{buttonLabel}</Text>
            </TouchableOpacity>
        </View>
    );
}

export function LoadingState(): React.JSX.Element {
    return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.bloodRed} />
        </View>
    );
}

interface EmptyStateProps {
    readonly title: string;
    readonly subtitle: string;
    readonly icon: string;
    readonly asset?: any;
}

export function EmptyState({ title, subtitle, icon, asset }: EmptyStateProps): React.JSX.Element {
    return (
        <View style={styles.emptyContainer}>
            {asset ? (
                <Image source={asset} style={styles.emptyImage} contentFit="contain" />
            ) : (
                <Text style={styles.largeIcon}>{icon}</Text>
            )}
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptySubtitle}>{subtitle}</Text>
        </View>
    );
}

export const contentLayoutStyles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
    } as ViewStyle,
    largeIcon: {
        fontSize: 60,
        marginBottom: 16,
    } as TextStyle,
    emptyImage: {
        width: 240,
        height: 240,
        marginBottom: 24,
    },
    emptyTitle: {
        color: Colors.textPrimary,
        fontSize: 18,
        textAlign: "center",
        marginBottom: 8,
    } as TextStyle,
    emptySubtitle: {
        color: Colors.metalSilver,
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
    } as TextStyle,
    loginButton: {
        backgroundColor: Colors.bloodRed,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 4,
        marginTop: 16,
    } as ViewStyle,
    loginButtonText: {
        color: Colors.metalBlack,
        fontWeight: "bold",
        textTransform: "uppercase",
    } as TextStyle,
});

const styles = contentLayoutStyles;