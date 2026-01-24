import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { getImageUrl, type Movie } from "../../../src/lib/tmdb";
import { useAuthStore } from "../../../src/stores/authStore";
import { Colors } from "../../../src/constants/Colors";
import TrailerModal from "../../../src/components/TrailerModal";
import RecommendModal from "../../../src/components/RecommendModal";
import { ContentBackdrop } from "../../../src/components/ContentBackdrop";
import { ContentPoster } from "../../../src/components/ContentPoster";
import { GenreList } from "../../../src/components/GenreList";
import { ContentActionBar } from "../../../src/components/ContentActionBar";
import { useContentActions } from "../../../src/hooks/useContentActions";
import { detailScreenStyles } from "../../../src/styles/detailScreenStyles";
import { CastMemberList } from "../../../src/components/CastMemberList";
import { CrewMemberList } from "../../../src/components/CrewMemberList";
import { ContentHorizontalList } from "../../../src/components/ContentHorizontalList";
import type { MovieWithDetails } from "../../../src/types/movieDetail.types";
import {
    loadMovieData,
    getDirectors,
    getProducers,
    formatMovieMetadata,
    formatRating,
    parseMovieId,
} from "../../../src/utils/movieDetail.utils";

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
        <SafeAreaView style={detailScreenStyles.safeArea}>
            <View style={detailScreenStyles.centerContainer}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        </SafeAreaView>
    );

    const renderErrorState = (): React.JSX.Element => (
        <SafeAreaView style={detailScreenStyles.safeArea}>
            <View style={detailScreenStyles.centerContainer}>
                <Text style={detailScreenStyles.errorText}>Película no encontrada</Text>
            </View>
        </SafeAreaView>
    );

    // Backdrop, poster, genres, and action buttons now use shared components







    const renderRecommendButton = (): React.JSX.Element | null => {
        if (!user) return null;

        return (
            <TouchableOpacity
                style={detailScreenStyles.recommendButton}
                onPress={handleOpenRecommendModal}
            >
                <View style={detailScreenStyles.recommendButtonContent}>
                    <MaterialCommunityIcons
                        name="email-outline"
                        size={24}
                        color={Colors.white}
                    />
                    <Text style={detailScreenStyles.recommendButtonText}>Recomendar</Text>
                </View>
            </TouchableOpacity>
        );
    };



    // Generic lists now use shared components

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
        <SafeAreaView style={detailScreenStyles.safeArea} edges={["left", "right", "bottom"]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Back Button */}
                <TouchableOpacity
                    style={detailScreenStyles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={detailScreenStyles.backButtonText}>←</Text>
                </TouchableOpacity>

                {/* Backdrop */}
                <ContentBackdrop
                    backdropUrl={getImageUrl(movie.backdrop_path ?? null, "original")}
                    trailerKey={trailerKey}
                    onPlayTrailer={handleWatchTrailer}
                />

                {/* Content */}
                <View style={detailScreenStyles.contentContainer}>
                    {/* Header Row */}
                    <View style={detailScreenStyles.headerRow}>
                        <ContentPoster
                            posterUrl={getImageUrl(movie.poster_path ?? null, "w300")}
                            placeholderIcon="🎬"
                        />
                        <View style={detailScreenStyles.infoContainer}>
                            <Text style={detailScreenStyles.title}>{movie.title}</Text>
                            <Text style={detailScreenStyles.yearText}>
                                {formatMovieMetadata(movie.release_date, movie.runtime)}
                            </Text>
                            <Text style={detailScreenStyles.ratingText}>
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
                    <View style={detailScreenStyles.descriptionContainer}>
                        <Text style={detailScreenStyles.descriptionTitle}>Sinopsis</Text>
                        <Text style={detailScreenStyles.descriptionText}>
                            {movie.overview || "Sin descripción disponible"}
                        </Text>
                    </View>

                    {/* Crew Info */}
                    {movie?.credits?.crew && (
                        <>
                            <CrewMemberList
                                crew={getDirectors(movie.credits.crew)}
                                title="Dirección"
                            />
                            <CrewMemberList
                                crew={getProducers(movie.credits.crew).slice(0, 10)}
                                title="Producción"
                            />
                        </>
                    )}

                    {/* Cast */}
                    <CastMemberList cast={movie.credits?.cast || []} />

                    {/* Related Movies */}
                    <ContentHorizontalList
                        data={relatedMovies}
                        title="Relacionadas"
                        mediaType="movie"
                    />

                    {/* Bottom Spacing */}
                    <View style={detailScreenStyles.bottomSpacer} />
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
    // Only movie-specific styles or overrides not covered by detailScreenStyles
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
});