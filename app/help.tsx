import React, { useState, useMemo } from 'react';
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

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

const FAQS: FAQItem[] = [
    {
        id: '1',
        question: '¿Qué es CortoCrudo?',
        answer: 'CortoCrudo es tu aplicación personal para mantener un registro de las películas y series que has visto, descubrir nuevos títulos y compartir recomendaciones directamente con tus amigos.',
    },
    {
        id: '2',
        question: '¿Cómo agrego una película a mis listas?',
        answer: 'Busca cualquier película o serie en la pestaña de Inicio. Al seleccionarla, verás opciones para agregarla a "Favoritos" o a tu "Lista de seguimiento" (Watchlist) tocando los botones debajo del póster.',
    },
    {
        id: '3',
        question: '¿Cómo recomiendo una película a mis amigos?',
        answer: 'En la pantalla de detalles de cualquier título, presiona el botón "Recomendar". Se abrirá una pantalla donde podrás buscar a tus amigos por su nombre de usuario, escribir un mensaje y enviarles la recomendación. Ellos la recibirán en su pestaña "Para ti".',
    },
    {
        id: '4',
        question: '¿Puedo ver las películas directamente en la app?',
        answer: 'No, CortoCrudo funciona como un diario y recomendador personal. Utilizamos la API de TMDb para brindarte toda la información y metadatos de los títulos, pero no proveemos servicios de streaming.',
    },
    {
        id: '5',
        question: '¿Por qué no veo películas en español?',
        answer: 'Si una película o serie no tiene una traducción oficial al español en la base de datos global de TMDb, se mostrará su título y sinopsis original.',
    },
    {
        id: '6',
        question: '¿Cómo cambio mi nombre de usuario genérico?',
        answer: 'Ve a la pestaña de "Perfil". En la sección "Información del perfil", presiona el botón de edición junto a tu nombre de usuario para personalizarlo.',
    },
    {
        id: '7',
        question: '¿Cómo elimino mi cuenta?',
        answer: 'Puedes eliminar tu cuenta y todos sus datos permanentemente desde la pestaña de "Perfil", desplazándote hacia abajo hasta la sección "Cuenta" y seleccionando "Eliminar cuenta".',
    },
];

export default function HelpCenterScreen(): React.JSX.Element {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredFAQs = useMemo(() => {
        if (!searchQuery.trim()) return FAQS;
        const lowerQuery = searchQuery.toLowerCase();
        return FAQS.filter(
            (faq) =>
                faq.question.toLowerCase().includes(lowerQuery) ||
                faq.answer.toLowerCase().includes(lowerQuery)
        );
    }, [searchQuery]);

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
        const subject = 'Soporte CortoCrudo';
        const body = '¡Hola! Necesito ayuda con lo siguiente:\n\n';
        const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        Linking.canOpenURL(mailtoUrl).then((supported) => {
            if (supported) {
                Linking.openURL(mailtoUrl);
            } else {
                console.warn("No mail client available on device");
            }
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Centro de Ayuda</Text>
                <View style={styles.headerRight} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.metalSilver} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Busca tu duda (ej. recomendar, perfil)..."
                    placeholderTextColor="#71717a"
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
                        <Text style={styles.emptyText}>No encontramos respuestas para esa búsqueda.</Text>
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
                    <Text style={styles.supportTitle}>¿Aún necesitas ayuda?</Text>
                    <Text style={styles.supportSubtitle}>Envíanos un correo y te responderemos lo antes posible.</Text>
                    <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
                        <Ionicons name="mail" size={20} color={Colors.white} />
                        <Text style={styles.supportButtonText}>Contactar a Soporte</Text>
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
        color: '#d4d4d8',
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
