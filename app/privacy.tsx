import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';

export default function PrivacyPolicyScreen(): React.JSX.Element {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Política de Privacidad</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.lastUpdated}>Última actualización: Febrero 2026</Text>

                <Text style={styles.paragraph}>
                    En CortoCrudo, valoramos y respetamos su privacidad. Esta Política de Privacidad describe
                    cómo recopilamos, utilizamos y protegemos su información personal cuando utiliza
                    nuestra aplicación móvil.
                </Text>

                <Text style={styles.sectionTitle}>1. Información que recopilamos</Text>
                <Text style={styles.paragraph}>
                    Recopilamos la información que usted nos proporciona directamente al crear una cuenta,
                    como su dirección de correo electrónico, nombre de usuario (opcional) y contraseña. También
                    recopilamos datos sobre su uso de la aplicación, como las películas y series que agrega a
                    sus listas de favoritos, su progreso de visualización y sus recomendaciones.
                </Text>

                <Text style={styles.sectionTitle}>2. Uso de la información</Text>
                <Text style={styles.paragraph}>
                    Utilizamos su información personal únicamente para proporcionar y mejorar los servicios
                    de CortoCrudo. Esto incluye autenticar su cuenta, sincronizar sus listas entre
                    dispositivos y habilitar funciones sociales como las recomendaciones entre usuarios.
                </Text>

                <Text style={styles.sectionTitle}>3. Almacenamiento y Protección</Text>
                <Text style={styles.paragraph}>
                    Toda la información personal (incluyendo credenciales de cuenta, listas y progreso) se
                    almacena de manera segura utilizando Supabase, una plataforma de base de datos segura de
                    terceros. Sus contraseñas son encriptadas por Supabase y no son accesibles para nosotros.
                </Text>

                <Text style={styles.sectionTitle}>4. Servicios de Terceros</Text>
                <Text style={styles.paragraph}>
                    CortoCrudo utiliza la interfaz de programación de aplicaciones (API) de TMDb
                    (The Movie Database) para obtener información sobre películas, series e imágenes
                    relacionadas. No compartimos su información personal con TMDb. Su uso de la
                    información provista por TMDb está sujeto a sus propios términos y políticas.
                </Text>

                <Text style={styles.sectionTitle}>5. Derechos del Usuario</Text>
                <Text style={styles.paragraph}>
                    Usted tiene el control total sobre sus datos. Puede eliminar su cuenta y toda la
                    información asociada a ella (incluyendo listas de reproducción y recomendaciones) en cualquier
                    momento desde la sección "Cuenta" en la pestaña de Perfil.
                </Text>

                <Text style={styles.sectionTitle}>6. Cambios a esta política</Text>
                <Text style={styles.paragraph}>
                    Podemos actualizar esta Política de Privacidad ocasionalmente para reflejar cambios en
                    nuestras prácticas. Le notificaremos cualquier actualización importante dentro de la
                    aplicación.
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
