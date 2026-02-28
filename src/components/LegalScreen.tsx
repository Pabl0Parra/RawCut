import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import ScreenHeader from './ScreenHeader';
import { screenStyles } from '../styles/screenStyles';

interface LegalScreenProps {
    namespace: string;
    sectionCount: number;
}

export default function LegalScreen({ namespace, sectionCount }: Readonly<LegalScreenProps>): React.JSX.Element {
    const { t } = useTranslation();
    const sections = Array.from({ length: sectionCount }, (_, i) => i + 1);

    return (
        <SafeAreaView style={screenStyles.safeArea}>
            <ScreenHeader title={t(`${namespace}.title`)} />
            <ScrollView style={screenStyles.scrollView} contentContainerStyle={screenStyles.scrollContent}>
                <Text style={styles.lastUpdated}>{t(`${namespace}.lastUpdated`)}</Text>
                <Text style={styles.paragraph}>{t(`${namespace}.p1`)}</Text>
                {sections.map((i) => (
                    <React.Fragment key={i}>
                        <Text style={styles.sectionTitle}>{t(`${namespace}.s${i}Title`)}</Text>
                        <Text style={styles.paragraph}>{t(`${namespace}.s${i}Text`)}</Text>
                    </React.Fragment>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    lastUpdated: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginBottom: 24,
        fontStyle: 'italic',
    },
    sectionTitle: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 24,
        marginBottom: 12,
    },
    paragraph: {
        color: Colors.textPrimary,
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 8,
    },
});