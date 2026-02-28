import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface ScreenHeaderProps {
    title: string;
    onBack?: () => void;
}

export default function ScreenHeader({ title, onBack }: Readonly<ScreenHeaderProps>): React.JSX.Element {
    const router = useRouter();

    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={onBack ?? (() => router.back())} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.headerRight} />
        </View>
    );
}

export const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    } as ViewStyle,
    backButton: {
        padding: 8,
    } as ViewStyle,
    headerTitle: {
        color: Colors.white,
        fontSize: 20,
        fontFamily: 'BebasNeue_400Regular',
    } as TextStyle,
    headerRight: {
        width: 40,
    } as ViewStyle,
});