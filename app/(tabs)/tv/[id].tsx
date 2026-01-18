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

import {
    getImageUrl,
    type TVShow,
    type Season,
    type Episode,
    type CastMember,
} from "../../../src/lib/tmdb";
import { useContentStore } from "../../../src/stores/contentStore";
import { useAuthStore } from "../../../src/stores/authStore";
import { Colors } from "../../../src/constants/Colors";

// Components
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

// Types & Utils
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
    getCreators,
    getProducers,
    formatCrewNames,
    getPosterUrl,
    getBackdropUrl,
    parseTVShowId,
    hasCreators,
    hasProducers,
} from "../../../src/utils/tvDetail.utils";

// ============================================================================
// Constants
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BACKDROP_ASPECT_RATIO = 0.56;

// ============================================================================
// Main Component
// ============================================================================

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

    // ========================================================================
    // State Helpers
    // ========================================================================

    const updateState = (updates: Partial<TVDetailScreenState>): void => {
        setState((prev) => ({ ...prev, ...updates }));
    };

    // ========================================================================
    // Data Loading
    // ========================================================================

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
            if (user) {
                fetchTVProgress();
            }
        }
    }, [id, user, loadTVShow, fetchTVProgress]);

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

    const checkEpisodeWatched = (seasonNumber: number, episodeNumber: number): boolean => {
        if (!tvShow) return false;
        return isEpisodeWatched(tvShow.id, seasonNumber, episodeNumber);
    };

    // ========================================================================
    // Computed Values
    // ========================================================================

    const getNextEpisode = (): NextEpisodeInfo | null => {
        if (!tvShow?.seasons) return null;
        return getNextEpisodeToWatch(tvShow.id, seasonsToProgressInfo(tvShow.seasons));
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
                <Text style={styles.errorText}>Serie no encontrada</Text>
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

    const renderBackdrop = (): React.JSX.Element => {
        const backdropUrl = getBackdropUrl(tvShow?.backdrop_path ?? null);
        const backdropHeight = SCREEN_WIDTH * BACKDROP_ASPECT_RATIO;

        return (
            <View style={styles.backdropContainer}>
                {backdropUrl ? (
                    <Image
                        source={{ uri: backdropUrl }}
                        style={{ width: SCREEN_WIDTH, height: backdropHeight }}
                        contentFit="cover"
                    />
                ) : (
                    <View
                        style={[
                            styles.backdropPlaceholder,
                            { width: SCREEN_WIDTH, height: backdropHeight },
                        ]}
                    />
                )}

                {trailerKey && (
                    <TouchableOpacity
                        style={styles.playButtonOverlay}
                        onPress={handleWatchTrailer}
                    >
                        <Ionicons
                            name="play-circle"
                            size={80}
                            color="rgba(255,255,255,0.8)"
                        />
                        <Text style={styles.playTrailerText}>Ver Trailer</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderPoster = (): React.JSX.Element => {
        const posterUrl = getPosterUrl(tvShow?.poster_path ?? null, "w300");

        if (posterUrl) {
            return (
                <Image
                    source={{ uri: posterUrl }}
                    style={styles.poster}
                    contentFit="cover"
                />
            );
        }

        return (
            <View style={styles.posterPlaceholder}>
                <Text style={styles.posterPlaceholderIcon}>📺</Text>
            </View>
        );
    };

    const renderGenres = (): React.JSX.Element | null => {
        if (!tvShow?.genres || tvShow.genres.length === 0) return null;

        return (
            <View style={styles.genresContainer}>
                {tvShow.genres.map((genre) => (
                    <View key={genre.id} style={styles.genreBadge}>
                        <Text style={styles.genreText}>{genre.name}</Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderActionButtons = (): React.JSX.Element | null => {
        if (!user || !tvShow) return null;

        const showId = tvShow.id;

        return (
            <View style={styles.actionButtonsRow}>
                <ActionButton
                    isActive={isFavorite(showId, TV_MEDIA_TYPE)}
                    activeIcon="skull"
                    inactiveIcon="skull-outline"
                    activeLabel="En Favoritos"
                    inactiveLabel="Añadir"
                    onPress={handleToggleFavorite}
                    iconFamily="Ionicons"
                />
                <ActionButton
                    isActive={isInWatchlist(showId, TV_MEDIA_TYPE)}
                    activeIcon="sword-cross"
                    inactiveIcon="sword"
                    activeLabel="En Lista"
                    inactiveLabel="Watchlist"
                    onPress={handleToggleWatchlist}
                    iconFamily="MaterialCommunityIcons"
                />
                <ActionButton
                    isActive={isWatched(showId, TV_MEDIA_TYPE)}
                    activeIcon="eye"
                    inactiveIcon="eye-outline"
                    activeLabel="Ya Visto"
                    inactiveLabel="Marcar Visto"
                    onPress={handleToggleWatched}
                    iconFamily="Ionicons"
                />
            </View>
        );
    };

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
        if (!tvShow) return null;

        const hasCreatorsSection = hasCreators(tvShow.created_by);
        const hasProducersSection = hasProducers(tvShow.credits?.crew);

        if (!hasCreatorsSection && !hasProducersSection) return null;

        return (
            <View style={styles.sectionContainer}>
                {hasCreatorsSection && (
                    <View style={styles.crewGroup}>
                        <Text style={styles.crewLabel}>Creación</Text>
                        <Text style={styles.crewNames}>
                            {getCreators(tvShow.created_by)}
                        </Text>
                    </View>
                )}
                {hasProducersSection && (
                    <View style={styles.crewGroup}>
                        <Text style={styles.crewLabel}>Producción</Text>
                        <Text style={styles.crewNames}>
                            {formatCrewNames(getProducers(tvShow.credits?.crew))}
                        </Text>
                    </View>
                )}
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
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Temporadas</Text>
                <FlatList
                    data={tvShow.seasons}
                    keyExtractor={(item, index) => `season-${item.id}-${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    renderItem={renderSeasonItem}
                />
            </View>
        );
    };

    const renderCastItem = ({ item }: { item: CastMember }): React.JSX.Element => {
        const profileUrl = getImageUrl(item.profile_path, "w200");

        return (
            <View style={styles.mediaItem}>
                {profileUrl ? (
                    <Image
                        source={{ uri: profileUrl }}
                        style={styles.mediaImage}
                        contentFit="cover"
                    />
                ) : (
                    <View style={styles.mediaPlaceholder}>
                        <Text style={styles.mediaPlaceholderIcon}>👤</Text>
                    </View>
                )}
                <Text style={styles.mediaName} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={styles.mediaSubtitle} numberOfLines={2}>
                    {item.character}
                </Text>
            </View>
        );
    };

    const renderCastSection = (): React.JSX.Element | null => {
        if (!tvShow?.credits?.cast || tvShow.credits.cast.length === 0) return null;

        return (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Reparto</Text>
                <FlatList
                    data={tvShow.credits.cast}
                    keyExtractor={(item, index) => `cast-${item.id}-${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    renderItem={renderCastItem}
                />
            </View>
        );
    };

    const renderRelatedShowItem = ({ item }: { item: TVShow }): React.JSX.Element => {
        const posterUrl = getImageUrl(item.poster_path, "w300");

        return (
            <TouchableOpacity
                style={styles.mediaItem}
                onPress={() => router.push(`/tv/${item.id}`)}
            >
                {posterUrl ? (
                    <Image
                        source={{ uri: posterUrl }}
                        style={styles.mediaImage}
                        contentFit="cover"
                    />
                ) : (
                    <View style={styles.mediaPlaceholder}>
                        <Text style={styles.mediaPlaceholderIcon}>📺</Text>
                    </View>
                )}
                <Text style={styles.mediaName} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={styles.mediaSubtitle} numberOfLines={1}>
                    ⭐ {formatRating(item.vote_average)}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderRelatedShowsSection = (): React.JSX.Element | null => {
        if (relatedShows.length === 0) return null;

        return (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Relacionadas</Text>
                <FlatList
                    data={relatedShows}
                    keyExtractor={(item, index) => `related-${item.id}-${index}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    renderItem={renderRelatedShowItem}
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

    if (!tvShow) {
        return renderErrorState();
    }

    const posterUrl = getPosterUrl(tvShow.poster_path, "w300");

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

                {/* Next Episode Badge */}
                {renderNextEpisodeBadge()}

                {/* Backdrop */}
                {renderBackdrop()}

                {/* Content */}
                <View style={styles.contentContainer}>
                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        {renderPoster()}
                        <View style={styles.infoContainer}>
                            <Text style={styles.title}>{tvShow.name}</Text>
                            <Text style={styles.yearText}>
                                {extractYear(tvShow.first_air_date)}
                            </Text>
                            <Text style={styles.ratingText}>
                                ⭐ {formatRating(tvShow.vote_average)}/10
                            </Text>
                        </View>
                    </View>

                    {/* Genres */}
                    {renderGenres()}

                    {/* Action Buttons */}
                    {renderActionButtons()}

                    {/* Recommend Button */}
                    {renderRecommendButton()}

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionTitle}>Sinopsis</Text>
                        <Text style={styles.descriptionText}>
                            {tvShow.overview || "Sin descripción disponible"}
                        </Text>
                    </View>

                    {/* Crew Info */}
                    {renderCrewSection()}

                    {/* Seasons */}
                    {renderSeasonsSection()}

                    {/* Cast */}
                    {renderCastSection()}

                    {/* Related Shows */}
                    {renderRelatedShowsSection()}

                    {/* Bottom Spacing */}
                    <View style={styles.bottomSpacer} />
                </View>
            </ScrollView>

            {/* Recommend Modal */}
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

            {/* Season Modal */}
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

            {/* Episode Modal */}
            <EpisodeModal
                visible={showEpisodeModal}
                onClose={handleCloseEpisodeModal}
                episode={selectedEpisode}
            />

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
    horizontalList: {
        gap: 12,
    } as ViewStyle,
    mediaItem: {
        width: 100,
        marginRight: 12,
    } as ViewStyle,
    mediaImage: {
        width: 100,
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    } as ImageStyle,
    mediaPlaceholder: {
        width: 100,
        height: 150,
        borderRadius: 8,
        backgroundColor: Colors.metalGray,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    } as ViewStyle,
    mediaPlaceholderIcon: {
        fontSize: 32,
    } as TextStyle,
    mediaName: {
        color: "#f4f4f5",
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
    } as TextStyle,
    mediaSubtitle: {
        color: Colors.metalSilver,
        fontSize: 10,
        textAlign: "center",
        marginTop: 2,
    } as TextStyle,
    bottomSpacer: {
        height: 32,
    } as ViewStyle,
});