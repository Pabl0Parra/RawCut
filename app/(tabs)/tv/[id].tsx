import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
    type Season,
    type Episode,
} from "../../../src/lib/tmdb";
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

import type {
    TVDetailScreenState,
    NextEpisodeInfo,
} from "../../../src/types/tvDetail.types";
import {
    INITIAL_TV_DETAIL_STATE,
    TV_MEDIA_TYPE,
} from "../../../src/types/tvDetail.types";
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
    const { id } = useLocalSearchParams<{ id: string }>();
    const [state, setState] = useState<TVDetailScreenState>(INITIAL_TV_DETAIL_STATE);

    const {
        tvShow,
        relatedShows,
        trailerKey,
        isLoading,
        showRecommendModal,
        showTrailerModal,
        showSeasonModal,
        showEpisodeModal,
        selectedSeasonNumber,
        seasonEpisodes,
        isLoadingSeason,
        selectedEpisode,
    } = state;

    const { user } = useAuthStore();
    const {
        fetchTVProgress,
        isEpisodeWatched,
        isSeasonWatched,
        getNextEpisodeToWatch,
        toggleEpisodeWatched,
    } = useContentStore();
    const {
        isFavorite,
        isInWatchlist,
        isWatched,
        handleToggleFavorite,
        handleToggleWatchlist,
        handleToggleWatched,
    } = useContentActions();

    
    const [showVotePicker, setShowVotePicker] = useState(false);
    const userVotes = useVoteStore((s) => s.userVotes);
    const communityScores = useVoteStore((s) => s.communityScores);
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
            if (user) {
                fetchTVProgress();
            }
        }
    }, [id, user, loadTVShow, fetchTVProgress, fetchVotes]);

    
    
    

    

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

    const handleOpenSeasonModal = async (seasonNumber: number): Promise<void> => {
        if (!tvShow) return;

        updateState({
            selectedSeasonNumber: seasonNumber,
            showSeasonModal: true,
            isLoadingSeason: true,
        });

        try {
            const episodes = await loadSeasonEpisodes(tvShow.id, seasonNumber);
            updateState({
                seasonEpisodes: episodes,
                isLoadingSeason: false,
            });
        } catch (err) {
            console.error("Error loading season details:", err);
            updateState({ isLoadingSeason: false });
        }
    };

    const handleCloseSeasonModal = (): void => {
        updateState({ showSeasonModal: false });
    };

    const handleToggleEpisode = async (episodeNumber: number): Promise<void> => {
        if (!tvShow || selectedSeasonNumber === null) return;
        await toggleEpisodeWatched(tvShow.id, selectedSeasonNumber, episodeNumber);
    };

    const handleSelectEpisode = (episode: Episode): void => {
        updateState({
            selectedEpisode: episode,
            showEpisodeModal: true,
        });
    };

    const handleCloseEpisodeModal = (): void => {
        updateState({ showEpisodeModal: false });
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
        if (!user) {
            router.push("/login");
            return;
        }
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

    
    
    

    const renderLoadingState = (): React.JSX.Element => (
        <SafeAreaView style={detailScreenStyles.safeArea}>
            <View style={detailScreenStyles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.bloodRed} />
            </View>
        </SafeAreaView>
    );

    const renderErrorState = (): React.JSX.Element => (
        <SafeAreaView style={detailScreenStyles.safeArea}>
            <View style={detailScreenStyles.centerContainer}>
                <Text style={detailScreenStyles.errorText}>Serie no encontrada</Text>
            </View>
        </SafeAreaView>
    );

    const renderNextEpisodeBadge = (): React.JSX.Element | null => {
        const nextEpisode = getNextEpisode();
        if (!nextEpisode) return null;

        return (
            <View style={styles.nextBadgeContainer}>
                <Text style={styles.nextBadgeLabel}>SIGUIENTE</Text>
                <Text style={styles.nextBadgeValue}>
                    S{nextEpisode.season} E{nextEpisode.episode}
                </Text>
            </View>
        );
    };

    

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
                <Text style={detailScreenStyles.sectionTitle}>Temporadas</Text>
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

    

    
    
    

    if (isLoading) {
        return renderLoadingState();
    }

    if (!tvShow) {
        return renderErrorState();
    }

    const posterUrl = getPosterUrl(tvShow.poster_path, "w300");

    return (
        <SafeAreaView style={detailScreenStyles.safeArea} edges={["left", "right"]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {}
                <TouchableOpacity
                    style={detailScreenStyles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={detailScreenStyles.backButtonText}>←</Text>
                </TouchableOpacity>

                {}
                {renderNextEpisodeBadge()}

                {}
                <ContentBackdrop
                    backdropUrl={getBackdropUrl(tvShow.backdrop_path ?? null)}
                    trailerKey={trailerKey}
                    onPlayTrailer={handleWatchTrailer}
                />

                <View style={detailScreenStyles.contentContainer}>
                    {}
                    <View style={detailScreenStyles.headerRow}>
                        <ContentPoster
                            posterUrl={getPosterUrl(tvShow.poster_path ?? null, "w300")}
                            placeholderIcon="📺"
                        />
                        <View style={detailScreenStyles.infoContainer}>
                            <Text style={detailScreenStyles.title}>{tvShow.name}</Text>
                            <Text style={detailScreenStyles.yearText}>

                                {extractYear(tvShow.first_air_date)}
                            </Text>
                            <View style={localStyles.ratingsRow}>
                                <Text style={detailScreenStyles.ratingText}>
                                    ⭐ {formatRating(tvShow.vote_average)}/10
                                </Text>
                                <TouchableOpacity
                                    onPress={handleOpenVotePicker}
                                    activeOpacity={0.7}
                                    style={localStyles.communityBadge}
                                >
                                    <Text style={localStyles.communityRatingText}>
                                        👥 {communityRating !== undefined ? communityRating.toFixed(1) : "—"}/10
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {}
                    <GenreList genres={tvShow.genres || []} />

                    {}
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

                    {}
                    {renderRecommendButton()}

                    {}
                    <View style={detailScreenStyles.descriptionContainer}>
                        <Text style={detailScreenStyles.descriptionTitle}>Sinopsis</Text>
                        <Text style={detailScreenStyles.descriptionText}>
                            {tvShow.overview || "Sin descripción disponible"}
                        </Text>
                    </View>

                    {}
                    {tvShow && (
                        <>
                            {tvShow.created_by && tvShow.created_by.length > 0 && (
                                <CrewMemberList
                                    crew={tvShow.created_by.map(c => ({
                                        id: c.id,
                                        name: c.name,
                                        job: "Creador",
                                        profile_path: c.profile_path
                                    }))}
                                    title="Creación"
                                />
                            )}
                            {tvShow.credits?.crew && (
                                <CrewMemberList
                                    crew={getProducers(tvShow.credits.crew).slice(0, 10)}
                                    title="Producción"
                                />
                            )}
                        </>
                    )}

                    {}
                    {renderSeasonsSection()}

                    {}
                    <CastMemberList cast={tvShow.credits?.cast || []} />

                    {}
                    <ContentHorizontalList
                        data={relatedShows}
                        title="Relacionadas"
                        mediaType="tv"
                    />

                    {}
                    <View style={detailScreenStyles.bottomSpacer} />
                </View>
            </ScrollView>

            {}
            <ContentRecommendModal
                visible={showRecommendModal}
                onClose={handleCloseRecommendModal}
                contentId={tvShow.id}
                contentTitle={tvShow.name}
                contentYear={extractYear(tvShow.first_air_date)}
                posterUrl={posterUrl}
                mediaType={TV_MEDIA_TYPE}
                currentUserId={user?.id}
            />

            {}
            <SeasonModal
                visible={showSeasonModal}
                onClose={handleCloseSeasonModal}
                seasonNumber={selectedSeasonNumber}
                episodes={seasonEpisodes}
                isLoading={isLoadingSeason}
                tvShowId={tvShow.id}
                onToggleEpisode={handleToggleEpisode}
                onSelectEpisode={handleSelectEpisode}
                isEpisodeWatched={checkEpisodeWatched}
            />

            {}
            <EpisodeModal
                visible={showEpisodeModal}
                onClose={handleCloseEpisodeModal}
                episode={selectedEpisode}
            />

            <TrailerModal
                visible={showTrailerModal}
                videoKey={trailerKey}
                onClose={handleCloseTrailerModal}
            />

            {showVotePicker && tvShow && (
                <VotePicker
                    current={userVote}
                    onSelect={handleVote}
                    onClose={() => setShowVotePicker(false)}
                />
            )}
        </SafeAreaView >
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

const styles = StyleSheet.create({
    
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