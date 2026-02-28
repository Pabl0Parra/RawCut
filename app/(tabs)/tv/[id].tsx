import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { type Season, type Episode } from "../../../src/lib/tmdb";
import { useContentStore } from "../../../src/stores/contentStore";
import { useAuthStore } from "../../../src/stores/authStore";
import { Colors } from "../../../src/constants/Colors";

import TrailerModal from "../../../src/components/TrailerModal";
import ContentRecommendModal from "../../../src/components/ContentRecommendModal";
import SeasonCard from "../../../src/components/SeasonCard";
import SeasonModal from "../../../src/components/SeasonModal";
import EpisodeModal from "../../../src/components/EpisodeModal";
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

import type { TVDetailScreenState, NextEpisodeInfo } from "../../../src/types/tvDetail.types";
import { INITIAL_TV_DETAIL_STATE, TV_MEDIA_TYPE } from "../../../src/types/tvDetail.types";
import {
    loadTVShowData,
    loadSeasonEpisodes,
    extractYear,
    formatRating,
    seasonsToProgressInfo,
    getProducers,
    getPosterUrl,
    getBackdropUrl,
    parseTVShowId,
} from "../../../src/utils/tvDetail.utils";

export default function TVDetailScreen(): React.JSX.Element {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [state, setState] = useState<TVDetailScreenState>(INITIAL_TV_DETAIL_STATE);
    const [showVotePicker, setShowVotePicker] = useState(false);

    const {
        tvShow, relatedShows, trailerKey, isLoading,
        showRecommendModal, showTrailerModal, showSeasonModal, showEpisodeModal,
        selectedSeasonNumber, seasonEpisodes, isLoadingSeason, selectedEpisode,
    } = state;

    const { user } = useAuthStore();
    const { fetchTVProgress, isEpisodeWatched, isSeasonWatched, getNextEpisodeToWatch, toggleEpisodeWatched } = useContentStore();
    const { isFavorite, isInWatchlist, isWatched, handleToggleFavorite, handleToggleWatchlist, handleToggleWatched } = useContentActions();
    const fetchVotes = useVoteStore((s) => s.fetchVotes);
    const submitVote = useVoteStore((s) => s.submitVote);

    const userVote = tvShow ? useVoteStore.getState().getUserVote(tvShow.id, "tv") : undefined;
    const communityRating = tvShow ? useVoteStore.getState().getCommunityScore(tvShow.id, "tv")?.avg : undefined;

    const updateState = (updates: Partial<TVDetailScreenState>): void => {
        setState((prev) => ({ ...prev, ...updates }));
    };

    const loadTVShow = useCallback(async (tvId: number): Promise<void> => {
        updateState({ isLoading: true });
        try {
            const result = await loadTVShowData(tvId);
            updateState({
                tvShow: result.tvShow,
                relatedShows: result.relatedShows,
                trailerKey: result.trailerKey,
                isLoading: false,
            });
        } catch (err) {
            console.error("Error loading TV show:", err);
            updateState({ isLoading: false });
        }
    }, []);

    useEffect(() => {
        const tvId = parseTVShowId(id);
        if (tvId !== null) {
            loadTVShow(tvId);
            fetchVotes([tvId], "tv");
            if (user) fetchTVProgress();
        }
    }, [id, user, loadTVShow, fetchTVProgress, fetchVotes]);

    const handleOpenSeasonModal = async (seasonNumber: number): Promise<void> => {
        if (!tvShow) return;
        updateState({ selectedSeasonNumber: seasonNumber, showSeasonModal: true, isLoadingSeason: true });
        try {
            const episodes = await loadSeasonEpisodes(tvShow.id, seasonNumber);
            updateState({ seasonEpisodes: episodes, isLoadingSeason: false });
        } catch (err) {
            console.error("Error loading season details:", err);
            updateState({ isLoadingSeason: false });
        }
    };

    const handleToggleEpisode = async (episodeNumber: number): Promise<void> => {
        if (!tvShow || selectedSeasonNumber === null) return;
        await toggleEpisodeWatched(tvShow.id, selectedSeasonNumber, episodeNumber);
    };

    const handleVote = async (vote: number): Promise<void> => {
        if (!tvShow) return;
        try {
            await submitVote(tvShow.id, "tv", vote);
        } catch (err) {
            console.error("Error submitting vote:", err);
        }
    };

    const handleOpenVotePicker = (): void => {
        if (!user) { router.push("/login"); return; }
        setShowVotePicker(true);
    };

    const checkEpisodeWatched = (seasonNumber: number, episodeNumber: number): boolean => {
        if (!tvShow) return false;
        return isEpisodeWatched(tvShow.id, seasonNumber, episodeNumber);
    };

    const getNextEpisode = (): NextEpisodeInfo | null => {
        if (!tvShow?.seasons) return null;
        return getNextEpisodeToWatch(tvShow.id, seasonsToProgressInfo(tvShow.seasons));
    };

    const renderNextEpisodeBadge = (): React.JSX.Element | null => {
        const nextEpisode = getNextEpisode();
        if (!nextEpisode) return null;
        return (
            <View style={styles.nextBadgeContainer}>
                <Text style={styles.nextBadgeLabel}>{t("details.next")}</Text>
                <Text style={styles.nextBadgeValue}>S{nextEpisode.season} E{nextEpisode.episode}</Text>
            </View>
        );
    };

    const renderSeasonItem = ({ item }: { item: Season }): React.JSX.Element => (
        <SeasonCard
            season={item}
            tvShowId={tvShow?.id ?? 0}
            isWatched={isSeasonWatched(tvShow?.id ?? 0, item.season_number, item.episode_count)}
            onPress={handleOpenSeasonModal}
        />
    );

    const renderSeasonsSection = (): React.JSX.Element | null => {
        if (!tvShow?.seasons || tvShow.seasons.length === 0) return null;
        return (
            <View style={detailScreenStyles.sectionContainer}>
                <Text style={detailScreenStyles.sectionTitle}>{t("details.seasons")}</Text>
                <FlatList
                    data={tvShow.seasons}
                    keyExtractor={(item, index) => `season-${item.id}-${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={detailScreenStyles.horizontalList}
                    renderItem={renderSeasonItem}
                />
            </View>
        );
    };

    const posterUrl = tvShow ? getPosterUrl(tvShow.poster_path, "w300") : null;

    return (
        <>
            <DetailScreenShell
                isLoading={isLoading}
                isEmpty={!tvShow}
                errorText={t("details.tvNotFound")}
            >
                {renderNextEpisodeBadge()}

                <ContentBackdrop
                    backdropUrl={getBackdropUrl(tvShow?.backdrop_path ?? null)}
                    trailerKey={trailerKey}
                    onPlayTrailer={() => trailerKey && updateState({ showTrailerModal: true })}
                />

                <View style={detailScreenStyles.contentContainer}>
                    <View style={detailScreenStyles.headerRow}>
                        <ContentPoster
                            posterUrl={getPosterUrl(tvShow?.poster_path ?? null, "w300")}
                            placeholderIcon="📺"
                        />
                        <View style={detailScreenStyles.infoContainer}>
                            <Text style={detailScreenStyles.title}>{tvShow?.name}</Text>
                            <Text style={detailScreenStyles.yearText}>
                                {tvShow && extractYear(tvShow.first_air_date)}
                            </Text>
                            <View style={styles.ratingsRow}>
                                <Text style={detailScreenStyles.ratingText}>
                                    ⭐ {tvShow && formatRating(tvShow.vote_average)}/10
                                </Text>
                                <CommunityRatingBadge
                                    rating={communityRating}
                                    onPress={handleOpenVotePicker}
                                />
                            </View>
                        </View>
                    </View>

                    <GenreList genres={tvShow?.genres || []} />

                    {tvShow && (
                        <ContentActionBar
                            contentId={tvShow.id}
                            mediaType={TV_MEDIA_TYPE}
                            isFavorite={isFavorite(tvShow.id, TV_MEDIA_TYPE)}
                            isInWatchlist={isInWatchlist(tvShow.id, TV_MEDIA_TYPE)}
                            isWatched={isWatched(tvShow.id, TV_MEDIA_TYPE)}
                            onToggleFavorite={() => handleToggleFavorite(tvShow.id, TV_MEDIA_TYPE)}
                            onToggleWatchlist={() => handleToggleWatchlist(tvShow.id, TV_MEDIA_TYPE)}
                            onToggleWatched={() => handleToggleWatched(tvShow.id, TV_MEDIA_TYPE)}
                            currentUserId={user?.id}
                        />
                    )}

                    {user && <RecommendButton onPress={() => updateState({ showRecommendModal: true })} />}

                    <View style={detailScreenStyles.descriptionContainer}>
                        <Text style={detailScreenStyles.descriptionTitle}>{t("details.overview")}</Text>
                        <Text style={detailScreenStyles.descriptionText}>
                            {tvShow?.overview || t("details.noOverview")}
                        </Text>
                    </View>

                    {tvShow && (
                        <>
                            {tvShow.created_by && tvShow.created_by.length > 0 && (
                                <CrewMemberList
                                    crew={tvShow.created_by.map(c => ({
                                        id: c.id,
                                        name: c.name,
                                        job: t("details.creator"),
                                        profile_path: c.profile_path,
                                    }))}
                                    title={t("details.creation")}
                                />
                            )}
                            {tvShow.credits?.crew && (
                                <CrewMemberList
                                    crew={getProducers(tvShow.credits.crew).slice(0, 5)}
                                    title={t("details.production")}
                                />
                            )}
                        </>
                    )}

                    {renderSeasonsSection()}

                    <CastMemberList cast={tvShow?.credits?.cast || []} title={t("details.cast")} />

                    <ContentHorizontalList
                        data={relatedShows}
                        title={t("details.related")}
                        mediaType="tv"
                    />

                    <View style={detailScreenStyles.bottomSpacer} />
                </View>
            </DetailScreenShell>

            {tvShow && (
                <ContentRecommendModal
                    visible={showRecommendModal}
                    onClose={() => updateState({ showRecommendModal: false })}
                    contentId={tvShow.id}
                    contentTitle={tvShow.name}
                    contentYear={extractYear(tvShow.first_air_date)}
                    posterUrl={posterUrl}
                    mediaType={TV_MEDIA_TYPE}
                    currentUserId={user?.id}
                />
            )}

            {tvShow && (
                <SeasonModal
                    visible={showSeasonModal}
                    onClose={() => updateState({ showSeasonModal: false })}
                    seasonNumber={selectedSeasonNumber}
                    episodes={seasonEpisodes}
                    isLoading={isLoadingSeason}
                    tvShowId={tvShow.id}
                    onToggleEpisode={handleToggleEpisode}
                    onSelectEpisode={(episode: Episode) => updateState({ selectedEpisode: episode, showEpisodeModal: true })}
                    isEpisodeWatched={checkEpisodeWatched}
                />
            )}

            <EpisodeModal
                visible={showEpisodeModal}
                onClose={() => updateState({ showEpisodeModal: false })}
                episode={selectedEpisode}
            />

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
    nextBadgeContainer: {
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 10,
        backgroundColor: "rgba(10, 10, 10, 0.7)",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: Colors.bloodRed,
        alignItems: "center",
    } as ViewStyle,
    nextBadgeLabel: {
        color: Colors.metalSilver,
        fontSize: 10,
        fontWeight: "bold",
        letterSpacing: 1,
    } as TextStyle,
    nextBadgeValue: {
        color: Colors.white,
        fontSize: 16,
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
});