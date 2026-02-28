import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
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
import { useVoteStore } from "../../../src/stores/voteStore";
import { VotePicker } from "../../../src/components/VotePicker";
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

export default function MovieDetailScreen(): React.JSX.Element {
    const { t } = useTranslation();
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

    const [showVotePicker, setShowVotePicker] = useState(false);
    const fetchVotes = useVoteStore((s) => s.fetchVotes);
    const submitVote = useVoteStore((s) => s.submitVote);

    const userVote = movie ? useVoteStore.getState().getUserVote(movie.id, "movie") : undefined;
    const communityRating = movie ? useVoteStore.getState().getCommunityScore(movie.id, "movie")?.avg : undefined;

    const updateState = (updates: Partial<MovieDetailState>): void => {
        setState((prev) => ({ ...prev, ...updates }));
    };

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
            fetchVotes([movieId], "movie");
        }
    }, [id, loadMovie, fetchVotes]);

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

    const handleVote = async (vote: number): Promise<void> => {
        if (!movie) return;
        try {
            await submitVote(movie.id, "movie", vote);
        } catch (err) {
            console.error("Error submitting vote:", err);
        }
    };

    const handleOpenVotePicker = (): void => {
        if (!user) {
            router.push("/login");
            return;
        }
        setShowVotePicker(true);
    };

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
                <Text style={detailScreenStyles.errorText}>{t('details.notFound')}</Text>
            </View>
        </SafeAreaView>
    );

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
                    <Text style={detailScreenStyles.recommendButtonText}>{t('details.recommend')}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return renderLoadingState();
    }

    if (!movie) {
        return renderErrorState();
    }

    const posterUrl = getImageUrl(movie.poster_path, "w300");

    return (
        <SafeAreaView style={detailScreenStyles.safeArea} edges={["left", "right"]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                    style={detailScreenStyles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={detailScreenStyles.backButtonText}>←</Text>
                </TouchableOpacity>

                <ContentBackdrop
                    backdropUrl={getImageUrl(movie.backdrop_path ?? null, "original")}
                    trailerKey={trailerKey}
                    onPlayTrailer={handleWatchTrailer}
                />

                <View style={detailScreenStyles.contentContainer}>
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
                            <View style={localStyles.ratingsRow}>
                                <Text style={detailScreenStyles.ratingText}>
                                    ⭐ {formatRating(movie.vote_average)}/10
                                </Text>
                                <TouchableOpacity
                                    onPress={handleOpenVotePicker}
                                    activeOpacity={0.7}
                                    style={localStyles.communityBadge}
                                >
                                    <Text style={localStyles.communityRatingText}>
                                        👥 {communityRating === undefined ? "—" : communityRating.toFixed(1)}/10
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <GenreList genres={movie.genres || []} />

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

                    {renderRecommendButton()}

                    <View style={detailScreenStyles.descriptionContainer}>
                        <Text style={detailScreenStyles.descriptionTitle}>{t('details.overview')}</Text>
                        <Text style={detailScreenStyles.descriptionText}>
                            {movie.overview || t('details.noOverview')}
                        </Text>
                    </View>

                    {movie?.credits?.crew && (
                        <>
                            <CrewMemberList
                                crew={getDirectors(movie.credits.crew)}
                                title={t('details.directing')}
                            />
                            <CrewMemberList
                                crew={getProducers(movie.credits.crew).slice(0, 5)}
                                title={t('details.production')}
                            />
                        </>
                    )}

                    <CastMemberList cast={movie.credits?.cast || []} title={t('details.cast')} />

                    <ContentHorizontalList
                        data={relatedMovies}
                        title={t('details.related')}
                        mediaType="movie"
                    />

                    <View style={detailScreenStyles.bottomSpacer} />
                </View>
            </ScrollView>

            <RecommendModal
                visible={showRecommendModal}
                onClose={handleCloseRecommendModal}
                movie={movie}
                posterUrl={posterUrl}
                currentUserId={user?.id}
            />

            <TrailerModal
                visible={showTrailerModal}
                videoKey={trailerKey}
                onClose={handleCloseTrailerModal}
            />

            {showVotePicker && (
                <VotePicker
                    current={userVote}
                    onSelect={handleVote}
                    onClose={() => setShowVotePicker(false)}
                />
            )}
        </SafeAreaView>
    );
}

const localStyles = StyleSheet.create({
    ratingsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 6,
    },
    communityBadge: {
        backgroundColor: Colors.glassPurple,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.glassPurpleBorder,
    },
    communityRatingText: {
        color: Colors.communityPurple,
        fontSize: 14,
        fontWeight: "bold",
    },
});