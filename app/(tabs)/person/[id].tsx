import React, { useEffect, useState, useCallback, JSX } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";

import { getImageUrl, getPersonDetails, getPersonCredits, type Person, type Movie, type TVShow } from "../../../src/lib/tmdb";
import { Colors } from "../../../src/constants/Colors";
import { detailScreenStyles } from "../../../src/styles/detailScreenStyles";
import { ContentHorizontalList } from "../../../src/components/ContentHorizontalList";

export default function PersonDetailScreen(): JSX.Element {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [person, setPerson] = useState<Person | null>(null);
    const [credits, setCredits] = useState<{ cast: (Movie | TVShow)[], crew: (Movie | TVShow)[] }>({ cast: [], crew: [] });
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async (personId: number) => {
        setIsLoading(true);
        try {
            const [details, creditsData] = await Promise.all([
                getPersonDetails(personId),
                getPersonCredits(personId)
            ]);
            setPerson(details);

            // Helper to deduplicate by ID
            const deduplicate = (items: (Movie | TVShow)[]) => {
                const map = new Map<number, Movie | TVShow>();
                items.forEach(item => {
                    if (!map.has(item.id)) {
                        map.set(item.id, item);
                    }
                });
                return Array.from(map.values());
            };

            // Deduplicate, sort by popularity and filter unique entries
            setCredits({
                cast: deduplicate(creditsData.cast)
                    .sort((a, b) => b.popularity - a.popularity)
                    .slice(0, 20),
                crew: deduplicate(creditsData.crew)
                    .sort((a, b) => b.popularity - a.popularity)
                    .slice(0, 20)
            });
        } catch (err) {
            console.error("Error loading person data:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const personId = Number.parseInt(id, 10);
        if (!Number.isNaN(personId)) {
            loadData(personId);
        }
    }, [id, loadData]);

    if (isLoading) {
        return (
            <SafeAreaView style={detailScreenStyles.safeArea}>
                <View style={detailScreenStyles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.bloodRed} />
                </View>
            </SafeAreaView>
        );
    }

    if (!person) {
        return (
            <SafeAreaView style={detailScreenStyles.safeArea}>
                <View style={detailScreenStyles.centerContainer}>
                    <Text style={detailScreenStyles.errorText}>Persona no encontrada</Text>
                </View>
            </SafeAreaView>
        );
    }

    const profileUrl = getImageUrl(person.profile_path, "original");

    return (
        <SafeAreaView style={detailScreenStyles.safeArea} edges={["left", "right", "bottom"]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                    style={detailScreenStyles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={detailScreenStyles.backButtonText}>←</Text>
                </TouchableOpacity>

                <View style={styles.header}>
                    {profileUrl ? (
                        <Image source={{ uri: profileUrl }} style={styles.profileImage} contentFit="cover" />
                    ) : (
                        <View style={styles.profilePlaceholder}>
                            <Text style={styles.placeholderIcon}>👤</Text>
                        </View>
                    )}
                    <Text style={styles.name}>{person.name}</Text>
                    {person.known_for_department && (
                        <Text style={styles.department}>{person.known_for_department}</Text>
                    )}
                    {person.place_of_birth && (
                        <Text style={styles.country}>{person.place_of_birth}</Text>
                    )}
                </View>

                <View style={[detailScreenStyles.contentContainer, { marginTop: 0 }]}>
                    <View style={detailScreenStyles.descriptionContainer}>
                        <Text style={detailScreenStyles.descriptionTitle}>Biografía</Text>
                        <Text style={detailScreenStyles.descriptionText}>
                            {person.biography || "No hay biografía disponible para esta persona."}
                        </Text>
                    </View>

                    {credits.cast.length > 0 && (
                        <ContentHorizontalList
                            data={credits.cast}
                            title="Como Actor/Actriz"
                            mediaType="movie" // ContentHorizontalList handles items with both title (movie) and name (tv) correctly
                        />
                    )}

                    {credits.crew.length > 0 && (
                        <ContentHorizontalList
                            data={credits.crew}
                            title="En Producción / Dirección"
                            mediaType="movie"
                        />
                    )}

                    <View style={detailScreenStyles.bottomSpacer} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        paddingBottom: 20,
    } as ViewStyle,
    profileImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
        borderWidth: 3,
        borderColor: Colors.bloodRed,
        marginBottom: 16,
    } as any,
    profilePlaceholder: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: Colors.metalGray,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 3,
        borderColor: Colors.bloodRed,
    } as ViewStyle,
    placeholderIcon: {
        fontSize: 60,
    } as TextStyle,
    name: {
        color: Colors.white,
        fontSize: 28,
        fontFamily: "BebasNeue_400Regular",
        textAlign: 'center',
    } as TextStyle,
    department: {
        color: Colors.metalSilver,
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    } as TextStyle,
    country: {
        color: Colors.metalSilver,
        fontSize: 12,
        marginTop: 2,
        opacity: 0.8,
    } as TextStyle,
});
