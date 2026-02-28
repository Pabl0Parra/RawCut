import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getImageUrl, type Movie } from "../../../src/lib/tmdb";
import { useAuthStore } from "../../../src/stores/authStore";
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
import { DetailScreenShell } from "../../../src/components/DetailScreenShell";
import { CommunityRatingBadge } from "../../../src/components/CommunityRatingBadge";
import { RecommendButton } from "../../../src/components/RecommendButton";
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
    const [showVotePicker, setShowVotePicker] = useState(false);

    const { movie, relatedMovies, trailerKey, isLoading, showRecommendModal, showTrailerModal } = state;

    const { user } = useAuthStore();
    const { isFavorite, isInWatchlist, isWatched, handleToggleFavorite, handleToggleWatchlist, handleToggleWatched } = useContentActions();
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

    const handleVote = async (vote: number): Promise<void> => {
        if (!movie) return;
        try {
            await submitVote(movie.id, "movie", vote);
        } catch (err) {
            console.error("Error submitting vote:", err);
        }
    };

    const handleOpenVotePicker = (): void => {
        if (!user) { router.push("/login"); return; }
        setShowVotePicker(true);
    };

    const posterUrl = movie ? getImageUrl(movie.poster_path, "w300") : null;

    return (
        <>
            <DetailScreenShell
                isLoading={isLoading}
                isEmpty={!movie}
                errorText={t("details.notFound")}
            >
                <ContentBackdrop
                    backdropUrl={getImageUrl(movie?.backdrop_path ?? null, "original")}
                    trailerKey={trailerKey}
                    onPlayTrailer={() => trailerKey && updateState({ showTrailerModal: true })}
                />

                <View style={detailScreenStyles.contentContainer}>
                    <View style={detailScreenStyles.headerRow}>
                        <ContentPoster
                            posterUrl={getImageUrl(movie?.poster_path ?? null, "w300")}
                            placeholderIcon="🎬"
                        />
                        <View style={detailScreenStyles.infoContainer}>
                            <Text style={detailScreenStyles.title}>{movie?.title}</Text>
                            <Text style={detailScreenStyles.yearText}>
                                {movie && formatMovieMetadata(movie.release_date, movie.runtime)}
                            </Text>
                            <View style={styles.ratingsRow}>
                                <Text style={detailScreenStyles.ratingText}>
                                    ⭐ {movie && formatRating(movie.vote_average)}/10
                                </Text>
                                <CommunityRatingBadge
                                    rating={communityRating}
                                    onPress={handleOpenVotePicker}
                                />
                            </View>
                        </View>
                    </View>

                    <GenreList genres={movie?.genres || []} />

                    {movie && (
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
                    )}

                    {user && <RecommendButton onPress={() => updateState({ showRecommendModal: true })} />}

                    <View style={detailScreenStyles.descriptionContainer}>
                        <Text style={detailScreenStyles.descriptionTitle}>{t("details.overview")}</Text>
                        <Text style={detailScreenStyles.descriptionText}>
                            {movie?.overview || t("details.noOverview")}
                        </Text>
                    </View>

                    {movie?.credits?.crew && (
                        <>
                            <CrewMemberList
                                crew={getDirectors(movie.credits.crew)}
                                title={t("details.directing")}
                            />
                            <CrewMemberList
                                crew={getProducers(movie.credits.crew).slice(0, 5)}
                                title={t("details.production")}
                            />
                        </>
                    )}

                    <CastMemberList cast={movie?.credits?.cast || []} title={t("details.cast")} />

                    <ContentHorizontalList
                        data={relatedMovies}
                        title={t("details.related")}
                        mediaType="movie"
                    />

                    <View style={detailScreenStyles.bottomSpacer} />
                </View>
            </DetailScreenShell>

            {movie && (
                <RecommendModal
                    visible={showRecommendModal}
                    onClose={() => updateState({ showRecommendModal: false })}
                    movie={movie}
                    posterUrl={posterUrl}
                    currentUserId={user?.id}
                />
            )}

            <TrailerModal
                visible={showTrailerModal}
                videoKey={trailerKey}
                onClose={() => updateState({ showTrailerModal: false })}
            />

            {showVotePicker && (
                <VotePicker
                    current={userVote}
                    onSelect={handleVote}
                    onClose={() => setShowVotePicker(false)}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    ratingsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 6,
    },
});