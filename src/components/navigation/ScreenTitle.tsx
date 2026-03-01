import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ScreenTitleProps {
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    containerStyle?: ViewStyle;
}

export default function ScreenTitle({
    title,
    subtitle,
    rightElement,
    containerStyle
}: Readonly<ScreenTitleProps>): React.JSX.Element {
    return (
        <View style={[styles.container, containerStyle]}>
            <View style={styles.titleRow}>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
                </View>
                {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
            </View>
            <View style={styles.underline} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
        backgroundColor: 'transparent',
    } as ViewStyle,
    titleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 8,
    } as ViewStyle,
    titleContainer: {
        flex: 1,
    } as ViewStyle,
    titleText: {
        color: Colors.white,
        fontSize: 32,
        fontFamily: 'BebasNeue_400Regular',
        letterSpacing: 1,
    } as TextStyle,
    subtitleText: {
        color: Colors.metalSilver,
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        marginTop: -2,
    } as TextStyle,
    rightElement: {
        marginLeft: 16,
    } as ViewStyle,
    underline: {
        height: 3,
        width: 40,
        backgroundColor: Colors.vibrantRed,
        borderRadius: 2,
    } as ViewStyle,
});
