import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';

export default function TermsOfServiceScreen(): React.JSX.Element {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Términos de Servicio</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.lastUpdated}>Última actualización: Febrero 2026</Text>

                <Text style={styles.paragraph}>
                    Bienvenido a CortoCrudo. Al descargar, acceder o utilizar esta aplicación,
                    usted acepta estar sujeto a los siguientes Términos de Servicio.
                </Text>

                <Text style={styles.sectionTitle}>1. Propósito de la Aplicación</Text>
                <Text style={styles.paragraph}>
                    CortoCrudo es una aplicación diseñada para organizar, rastrear y descubrir
                    contenido de entretenimiento (películas y series de televisión). La aplicación
                    NO proporciona streaming, transmisión o descarga de contenido multimedia
                    protegido por derechos de autor.
                </Text>

                <Text style={styles.sectionTitle}>2. Cuentas de Usuario</Text>
                <Text style={styles.paragraph}>
                    Para utilizar todas las funciones de CortoCrudo, debe crear una cuenta.
                    Usted es responsable de mantener la confidencialidad de sus credenciales
                    de inicio de sesión y de todas las actividades que ocurran bajo su cuenta.
                    CortoCrudo no se hace responsable por ninguna pérdida o daño derivado de
                    su incumplimiento de esta obligación de seguridad.
                </Text>

                <Text style={styles.sectionTitle}>3. Uso Aceptable</Text>
                <Text style={styles.paragraph}>
                    Usted acepta utilizar CortoCrudo solo para fines lícitos y de una manera que
                    no infrinja los derechos de, restrinja o inhiba el uso de la aplicación por
                    parte de terceros. No debe utilizar la aplicación para transmitir contenido
                    malicioso, acosar a otros usuarios o intentar acceder a información de otros
                    usuarios.
                </Text>

                <Text style={styles.sectionTitle}>4. Descargo de Responsabilidad de TMDb</Text>
                <Text style={styles.paragraph}>
                    Este producto utiliza la API de TMDb (The Movie Database) para proporcionar
                    metadatos e imágenes pero NO está respaldado, certificado ni afiliado a TMDb.
                    Toda la información relacionada con películas y series es propiedad de TMDb
                    y de sus respectivos autores/creadores.
                </Text>

                <Text style={styles.sectionTitle}>5. Modificación de los Términos</Text>
                <Text style={styles.paragraph}>
                    Nos reservamos el derecho de modificar o reemplazar estos Términos en
                    cualquier momento. Si publicamos una actualización, el uso continuado de la
                    aplicación constituirá su aceptación de los nuevos términos.
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
        color: '#d4d4d8',
        fontSize: 15,
        lineHeight: 24,
        marginBottom: 8,
    },
});
