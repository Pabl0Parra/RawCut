import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { getImageUrl, type Movie, type CastMember } from "../../../src/lib/tmdb";
import { useAuthStore } from "../../../src/stores/authStore";
import { Colors } from "../../../src/constants/Colors";
import TrailerModal from "../../../src/components/TrailerModal";
import RecommendModal from "../../../src/components/RecommendModal";
import { ContentBackdrop } from "../../../src/components/ContentBackdrop";
import { ContentPoster } from "../../../src/components/ContentPoster";
import { GenreList } from "../../../src/components/GenreList";
import { ContentActionBar } from "../../../src/components/ContentActionBar";
import { useContentActions } from "../../../src/hooks/useContentActions";

import type { MovieWithDetails } from "../../../src/types/movieDetail.types";
import {
    loadMovieData,
    getDirectors,
    getProducers,
    formatCrewNames,
    formatMovieMetadata,
    formatRating,
    parseMovieId,
} from "../../../src/utils/movieDetail.utils";

// ============================================================================
// Constants
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BACKDROP_ASPECT_RATIO = 0.56;

// ============================================================================
// Types
// ============================================================================

interface MovieDetailState {
    movie: MovieWithDetails | null;
    relatedMovies: Movie[];
    trailerKey: string | null;
    isLoading: boolean;
    showRecommendModal: boolean;
    showTrailerModal: boolean;
}

const INITIAL_STATE: MovieDetailState = {
    movie: null,
    relatedMovies: [],
    trailerKey: null,
    isLoading: true,
    showRecommendModal: false,
    showTrailerModal: false,
};

// ============================================================================
// Main Component
// ============================================================================

export default function MovieDetailScreen(): React.JSX.Element {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [state, setState] = useState<MovieDetailState>(INITIAL_STATE);

    const {
        movie,
        relatedMovies,
        trailerKey,
        isLoading,
        showRecommendModal,
        showTrailerModal,
    } = state;

    const { user } = useAuthStore();
    const {
        isFavorite,
        isInWatchlist,
        isWatched,
        handleToggleFavorite,
        handleToggleWatchlist,
        handleToggleWatched,
    } = useContentActions();

    // ========================================================================
    // State Helpers
    // ========================================================================

    const updateState = (updates: Partial<MovieDetailState>): void => {
        setState((prev) => ({ ...prev, ...updates }));
    };

    // ========================================================================
    // Data Loading
    // ========================================================================

    const loadMovie = useCallback(async (movieId: number): Promise<void> => {
        updateState({ isLoading: true });

        try {
            const result = await loadMovieData(movieId);
            updateState({
                movie: result.movie,
                relatedMovies: result.relatedMovies,
                trailerKey: result.trailerKey,
                isLoading: false,
            });
        } catch (err) {
            console.error("Error loading movie:", err);
            updateState({ isLoading: false });
        }
    }, []);

    useEffect(() => {
        const movieId = parseMovieId(id);
        if (movieId !== null) {
            loadMovie(movieId);
        }
    }, [id, loadMovie]);

    // ========================================================================
    // Action Handlers
    // ========================================================================

    // Action handlers now provided by useContentActions hook

    const handleWatchTrailer = (): void => {
        if (trailerKey) {
            updateState({ showTrailerModal: true });
        }
    };

    const handleOpenRecommendModal = (): void => {
        updateState({ showRecommendModal: true });
    };

    const handleCloseRecommendModal = (): void => {
        updateState({ showRecommendModal: false });
    };

    const handleCloseTrailerModal = (): void => {
        updateState({ showTrailerModal: false });
    };

    // ========================================================================
    // Render Helpers
    // ========================================================================

    const renderLoadingState = (): React.JSX.Element => (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        </SafeAreaView>
    );

    const renderErrorState = (): React.JSX.Element => (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Película no encontrada</Text>
            </View>
        </SafeAreaView>
    );

    // Backdrop, poster, genres, and action buttons now use shared components







    const renderRecommendButton = (): React.JSX.Element | null => {
        if (!user) return null;

        return (
            <TouchableOpacity
                style={styles.recommendButton}
                onPress={handleOpenRecommendModal}
            >
                <View style={styles.recommendButtonContent}>
                    <MaterialCommunityIcons
                        name="email-outline"
                        size={24}
                        color={Colors.white}
                    />
                    <Text style={styles.recommendButtonText}>Recomendar</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderCrewSection = (): React.JSX.Element | null => {
        if (!movie?.credits) return null;

        const directors = getDirectors(movie.credits.crew);
        const producers = getProducers(movie.credits.crew);

        if (directors.length === 0 && producers.length === 0) return null;

        return (
            <View style={styles.sectionContainer}>
                {directors.length > 0 && (
                    <View style={styles.crewGroup}>
                        <Text style={styles.crewLabel}>Dirección</Text>
                        <Text style={styles.crewNames}>
                            {formatCrewNames(directors)}
                        </Text>
                    </View>
                )}
                {producers.length > 0 && (
                    <View style={styles.crewGroup}>
                        <Text style={styles.crewLabel}>Producción</Text>
                        <Text style={styles.crewNames}>
                            {formatCrewNames(producers)}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    const renderCastItem = ({ item }: { item: CastMember }): React.JSX.Element => {
        const profileUrl = getImageUrl(item.profile_path, "w200");

        return (
            <View style={styles.castItem}>
                {profileUrl ? (
                    <Image
                        source={{ uri: profileUrl }}
                        style={styles.castImage}
                        contentFit="cover"
                    />
                ) : (
                    <View style={styles.castPlaceholder}>
                        <Text style={styles.castPlaceholderIcon}>👤</Text>
                    </View>
                )}
                <Text style={styles.castName} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={styles.castCharacter} numberOfLines={2}>
                    {item.character}
                </Text>
            </View>
        );
    };

    const renderCastSection = (): React.JSX.Element | null => {
        if (!movie?.credits?.cast || movie.credits.cast.length === 0) return null;

        return (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Reparto</Text>
                <FlatList
                    data={movie.credits.cast}
                    keyExtractor={(item, index) => `cast-${item.id}-${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.castList}
                    renderItem={renderCastItem}
                />
            </View>
        );
    };

    const renderRelatedMovieItem = ({ item }: { item: Movie }): React.JSX.Element => {
        const posterUrl = getImageUrl(item.poster_path, "w300");

        return (
            <TouchableOpacity
                style={styles.castItem}
                onPress={() => router.push(`/movie/${item.id}`)}
            >
                {posterUrl ? (
                    <Image
                        source={{ uri: posterUrl }}
                        style={styles.castImage}
                        contentFit="cover"
                    />
                ) : (
                    <View style={styles.castPlaceholder}>
                        <Text style={styles.castPlaceholderIcon}>🎬</Text>
                    </View>
                )}
                <Text style={styles.castName} numberOfLines={2}>
                    {item.title}
                </Text>
                <Text style={styles.castCharacter} numberOfLines={1}>
                    ⭐ {formatRating(item.vote_average)}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderRelatedMoviesSection = (): React.JSX.Element | null => {
        if (relatedMovies.length === 0) return null;

        return (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Relacionadas</Text>
                <FlatList
                    data={relatedMovies}
                    keyExtractor={(item, index) => `related-${item.id}-${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.castList}
                    renderItem={renderRelatedMovieItem}
                />
            </View>
        );
    };

    // ========================================================================
    // Main Render
    // ========================================================================

    if (isLoading) {
        return renderLoadingState();
    }

    if (!movie) {
        return renderErrorState();
    }

    const posterUrl = getImageUrl(movie.poster_path, "w300");

    return (
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>

                {/* Backdrop */}
                <ContentBackdrop
                    backdropUrl={getImageUrl(movie.backdrop_path ?? null, "original")}
                    trailerKey={trailerKey}
                    onPlayTrailer={handleWatchTrailer}
                />

                {/* Content */}
                <View style={styles.contentContainer}>
                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        <ContentPoster
                            posterUrl={getImageUrl(movie.poster_path ?? null, "w300")}
                            placeholderIcon="🎬"
                        />
                        <View style={styles.infoContainer}>
                            <Text style={styles.title}>{movie.title}</Text>
                            <Text style={styles.yearText}>
                                {formatMovieMetadata(movie.release_date, movie.runtime)}
                            </Text>
                            <Text style={styles.ratingText}>
                                ⭐ {formatRating(movie.vote_average)}/10
                            </Text>
                        </View>
                    </View>

                    {/* Genres */}
                    <GenreList genres={movie.genres || []} />

                    {/* Action Buttons */}
                    <ContentActionBar
                        contentId={movie.id}
                        mediaType="movie"
                        isFavorite={isFavorite(movie.id, "movie")}
                        isInWatchlist={isInWatchlist(movie.id, "movie")}
                        isWatched={isWatched(movie.id, "movie")}
                        onToggleFavorite={() => handleToggleFavorite(movie.id, "movie")}
                        onToggleWatchlist={() => handleToggleWatchlist(movie.id, "movie")}
                        onToggleWatched={() => handleToggleWatched(movie.id, "movie")}
                        currentUserId={user?.id}
                    />

                    {/* Recommend Button */}
                    {renderRecommendButton()}

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionTitle}>Sinopsis</Text>
                        <Text style={styles.descriptionText}>
                            {movie.overview || "Sin descripción disponible"}
                        </Text>
                    </View>

                    {/* Crew Info */}
                    {renderCrewSection()}

                    {/* Cast */}
                    {renderCastSection()}

                    {/* Related Movies */}
                    {renderRelatedMoviesSection()}

                    {/* Bottom Spacing */}
                    <View style={styles.bottomSpacer} />
                </View>
            </ScrollView>

            {/* Recommend Modal */}
            {movie && (
                <RecommendModal
                    visible={showRecommendModal}
                    onClose={handleCloseRecommendModal}
                    movie={movie}
                    posterUrl={posterUrl}
                    currentUserId={user?.id}
                />
            )}

            {/* Trailer Modal */}
            <TrailerModal
                visible={showTrailerModal}
                videoKey={trailerKey}
                onClose={handleCloseTrailerModal}
            />
        </SafeAreaView>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    } as ViewStyle,
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    errorText: {
        color: Colors.metalSilver,
    } as TextStyle,
    backButton: {
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 10,
        backgroundColor: "rgba(10, 10, 10, 0.5)",
        borderRadius: 9999,
        padding: 8,
    } as ViewStyle,
    backButtonText: {
        fontSize: 28,
        color: "#fff",
        fontWeight: "900",
        top: -5,
    } as TextStyle,
    backdropContainer: {
        position: "relative",
    } as ViewStyle,
    backdropPlaceholder: {
        backgroundColor: Colors.metalGray,
    } as ViewStyle,
    playButtonOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.2)",
    } as ViewStyle,
    playTrailerText: {
        color: "white",
        fontSize: 14,
        fontWeight: "bold",
        marginTop: -10,
        textShadowColor: "rgba(0,0,0,0.75)",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    } as TextStyle,
    contentContainer: {
        paddingHorizontal: 16,
        marginTop: -64,
    } as ViewStyle,
    headerRow: {
        flexDirection: "row",
    } as ViewStyle,
    poster: {
        width: 120,
        height: 180,
        borderRadius: 8,
    } as ImageStyle,
    posterPlaceholder: {
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        width: 120,
        height: 180,
    } as ViewStyle,
    posterPlaceholderIcon: {
        fontSize: 36,
    } as TextStyle,
    infoContainer: {
        flex: 1,
        marginLeft: 16,
        marginTop: 64,
    } as ViewStyle,
    title: {
        color: "#f4f4f5",
        fontSize: 20,
        fontWeight: "bold",
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
    yearText: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginTop: 4,
    } as TextStyle,
    ratingText: {
        color: "#eab308",
        fontSize: 18,
        marginTop: 8,
    } as TextStyle,
    genresContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 16,
    } as ViewStyle,
    genreBadge: {
        backgroundColor: Colors.metalGray,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    } as ViewStyle,
    genreText: {
        color: "#f4f4f5",
        fontSize: 12,
    } as TextStyle,
    actionButtonsRow: {
        flexDirection: "row",
        gap: 16,
        marginTop: 24,
    } as ViewStyle,
    recommendButton: {
        backgroundColor: Colors.bloodRed,
        paddingVertical: 16,
        borderRadius: 4,
        marginTop: 16,
    } as ViewStyle,
    recommendButtonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    } as ViewStyle,
    recommendButtonText: {
        color: Colors.white,
        fontWeight: "bold",
        textAlign: "center",
        textTransform: "uppercase",
    } as TextStyle,
    descriptionContainer: {
        marginTop: 24,
    } as ViewStyle,
    descriptionTitle: {
        color: "#f4f4f5",
        fontSize: 18,
        marginBottom: 8,
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
    descriptionText: {
        color: Colors.metalSilver,
        lineHeight: 24,
    } as TextStyle,
    sectionContainer: {
        marginTop: 24,
    } as ViewStyle,
    sectionTitle: {
        color: "#f4f4f5",
        fontSize: 18,
        marginBottom: 12,
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
    crewGroup: {
        marginBottom: 12,
    } as ViewStyle,
    crewLabel: {
        color: "#f4f4f5",
        fontSize: 16,
        marginBottom: 4,
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
    crewNames: {
        color: "#f4f4f5",
        fontSize: 14,
    } as TextStyle,
    castList: {
        gap: 12,
    } as ViewStyle,
    castItem: {
        width: 100,
        marginRight: 12,
    } as ViewStyle,
    castImage: {
        width: 100,
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    } as ImageStyle,
    castPlaceholder: {
        width: 100,
        height: 150,
        borderRadius: 8,
        backgroundColor: Colors.metalGray,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    } as ViewStyle,
    castPlaceholderIcon: {
        fontSize: 32,
    } as TextStyle,
    castName: {
        color: "#f4f4f5",
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
    } as TextStyle,
    castCharacter: {
        color: Colors.metalSilver,
        fontSize: 10,
        textAlign: "center",
        marginTop: 2,
    } as TextStyle,
    bottomSpacer: {
        height: 32,
    } as ViewStyle,
});