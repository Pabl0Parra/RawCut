import React from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors } from "../constants/Colors";
import { detailScreenStyles } from "../styles/detailScreenStyles";

interface DetailScreenShellProps {
    readonly isLoading: boolean;
    readonly isEmpty: boolean;
    readonly errorText: string;
    readonly children: React.ReactNode;
}

export function DetailScreenShell({
    isLoading,
    isEmpty,
    errorText,
    children,
}: DetailScreenShellProps): React.JSX.Element {
    if (isLoading) {
        return (
            <SafeAreaView style={detailScreenStyles.safeArea}>
                <View style={detailScreenStyles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.bloodRed} />
                </View>
            </SafeAreaView>
        );
    }

    if (isEmpty) {
        return (
            <SafeAreaView style={detailScreenStyles.safeArea}>
                <View style={detailScreenStyles.centerContainer}>
                    <Text style={detailScreenStyles.errorText}>{errorText}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={detailScreenStyles.safeArea} edges={["left", "right"]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                    style={detailScreenStyles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={detailScreenStyles.backButtonText}>←</Text>
                </TouchableOpacity>
                {children}
            </ScrollView>
        </SafeAreaView>
    );
}