import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Linking,
    Platform,
    LayoutAnimation,
    UIManager,
    type ViewStyle,
    type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';
import { screenStyles } from '../src/styles/screenStyles';
import ScreenHeader from '../src/components/ScreenHeader';



interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

const getFAQS = (t: any): FAQItem[] => [
    {
        id: '1',
        question: t('help.faqs.q1'),
        answer: t('help.faqs.a1'),
    },
    {
        id: '2',
        question: t('help.faqs.q2'),
        answer: t('help.faqs.a2'),
    },
    {
        id: '3',
        question: t('help.faqs.q3'),
        answer: t('help.faqs.a3'),
    },
    {
        id: '4',
        question: t('help.faqs.q4'),
        answer: t('help.faqs.a4'),
    },
    {
        id: '5',
        question: t('help.faqs.q5'),
        answer: t('help.faqs.a5'),
    },
    {
        id: '6',
        question: t('help.faqs.q6'),
        answer: t('help.faqs.a6'),
    },
    {
        id: '7',
        question: t('help.faqs.q7'),
        answer: t('help.faqs.a7'),
    },
];

export default function HelpCenterScreen(): React.JSX.Element {
    const { t } = useTranslation();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const faqs = useMemo(() => getFAQS(t), [t]);

    const filteredFAQs = useMemo(() => {
        if (!searchQuery.trim()) return faqs;
        const lowerQuery = searchQuery.toLowerCase();
        return faqs.filter(
            (faq) =>
                faq.question.toLowerCase().includes(lowerQuery) ||
                faq.answer.toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery, faqs]);

    const handleToggleExpand = (id: string) => {
        LayoutAnimation.configureNext({
            duration: 300,
            create: {
                type: LayoutAnimation.Types.easeInEaseOut,
                property: LayoutAnimation.Properties.opacity,
            },
            update: {
                type: LayoutAnimation.Types.easeInEaseOut,
            },
            delete: {
                type: LayoutAnimation.Types.easeInEaseOut,
                property: LayoutAnimation.Properties.opacity,
            },
        });
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const handleContactSupport = () => {
        const supportEmail = 'frontend.bcn.dev@gmail.com';
        const subject = t('help.contact.subject');
        const body = t('help.contact.body');
        const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        Linking.canOpenURL(mailtoUrl).then((supported) => {
            if (supported) {
                Linking.openURL(mailtoUrl);
            } else {
            }
        });
    };

    return (
        <SafeAreaView style={screenStyles.safeArea}>
            <ScreenHeader title={t('help.title')} />
            <View style={styles.searchContainer}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('help.title')}</Text>
                <View style={styles.headerRight} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.metalSilver} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('help.searchPlaceholder')}
                    placeholderTextColor={Colors.textPlaceholder}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                    clearButtonMode="while-editing"
                />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {filteredFAQs.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="help-circle-outline" size={48} color={Colors.metalSilver} />
                        <Text style={styles.emptyText}>{t('help.noResults')}</Text>
                    </View>
                ) : (
                    <View style={styles.faqList}>
                        {filteredFAQs.map((faq) => {
                            const isExpanded = expandedId === faq.id;
                            return (
                                <View key={faq.id} style={styles.faqCard}>
                                    <TouchableOpacity
                                        style={styles.faqHeader}
                                        onPress={() => handleToggleExpand(faq.id)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.faqQuestion, isExpanded && styles.faqQuestionExpanded]}>
                                            {faq.question}
                                        </Text>
                                        <Ionicons
                                            name={isExpanded ? "chevron-up" : "chevron-down"}
                                            size={20}
                                            color={isExpanded ? Colors.bloodRed : Colors.metalSilver}
                                        />
                                    </TouchableOpacity>

                                    {isExpanded && (
                                        <View style={styles.faqAnswerContainer}>
                                            <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                <View style={styles.supportSection}>
                    <Text style={styles.supportTitle}>{t('help.contact.title')}</Text>
                    <Text style={styles.supportSubtitle}>{t('help.contact.subtitle')}</Text>
                    <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
                        <Ionicons name="mail" size={20} color={Colors.white} />
                        <Text style={styles.supportButtonText}>{t('help.contact.button')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    } as ViewStyle,
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.metalGray,
        margin: 16,
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    } as ViewStyle,
    searchIcon: {
        marginRight: 10,
    } as TextStyle,
    searchInput: {
        flex: 1,
        height: 48,
        color: Colors.white,
        fontSize: 15,
    } as TextStyle,
    scrollView: {
        flex: 1,
    } as ViewStyle,
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    } as ViewStyle,
    faqList: {
        gap: 12,
        marginBottom: 32,
    } as ViewStyle,
    faqCard: {
        backgroundColor: Colors.metalGray,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    } as ViewStyle,
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    } as ViewStyle,
    faqQuestion: {
        flex: 1,
        color: Colors.white,
        fontSize: 15,
        fontWeight: '600',
        paddingRight: 16,
    } as TextStyle,
    faqQuestionExpanded: {
        color: Colors.bloodRed,
    } as TextStyle,
    faqAnswerContainer: {
        padding: 16,
        paddingTop: 0,
        backgroundColor: 'rgba(0,0,0,0.2)',
    } as ViewStyle,
    faqAnswer: {
        color: Colors.textPrimary,
        fontSize: 14,
        lineHeight: 22,
        marginTop: 12,
    } as TextStyle,
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    } as ViewStyle,
    emptyText: {
        color: Colors.metalSilver,
        fontSize: 15,
        marginTop: 16,
        textAlign: 'center',
    } as TextStyle,
    supportSection: {
        backgroundColor: 'rgba(220, 38, 38, 0.05)',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(220, 38, 38, 0.2)',
    } as ViewStyle,
    supportTitle: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    } as TextStyle,
    supportSubtitle: {
        color: Colors.metalSilver,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    } as TextStyle,
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.bloodRed,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    } as ViewStyle,
    supportButtonText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: 'bold',
    } as TextStyle,
});
