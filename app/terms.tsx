import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';

export default function TermsOfServiceScreen(): React.JSX.Element {
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('terms.title')}</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.lastUpdated}>{t('terms.lastUpdated')}</Text>

                <Text style={styles.paragraph}>
                    {t('terms.p1')}
                </Text>

                <Text style={styles.sectionTitle}>{t('terms.s1Title')}</Text>
                <Text style={styles.paragraph}>
                    {t('terms.s1Text')}
                </Text>

                <Text style={styles.sectionTitle}>{t('terms.s2Title')}</Text>
                <Text style={styles.paragraph}>
                    {t('terms.s2Text')}
                </Text>

                <Text style={styles.sectionTitle}>{t('terms.s3Title')}</Text>
                <Text style={styles.paragraph}>
                    {t('terms.s3Text')}
                </Text>

                <Text style={styles.sectionTitle}>{t('terms.s4Title')}</Text>
                <Text style={styles.paragraph}>
                    {t('terms.s4Text')}
                </Text>

                <Text style={styles.sectionTitle}>{t('terms.s5Title')}</Text>
                <Text style={styles.paragraph}>
                    {t('terms.s5Text')}
                </Text>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: 20,
        fontFamily: 'BebasNeue_400Regular',
    },
    headerRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
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
