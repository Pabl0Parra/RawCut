import React, { useState, useEffect, useCallback, JSX } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    TextInput,
    RefreshControl,
    StyleSheet,
    Modal,
    ScrollView,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import {
    MaterialCommunityIcons,
    Feather,
    Entypo,
    Ionicons,
} from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";

import MovieCard from "../../src/components/MovieCard";
import {
    searchMovies,
    searchTVShows,
    getMovieGenres,
    getTVGenres,
    type Movie,
    type TVShow,
    type Genre,
} from "../../src/lib/tmdb";
import { useContentStore } from "../../src/stores/contentStore";
import { useAuthStore } from "../../src/stores/authStore";
import { Colors } from "../../src/constants/Colors";

import type {
    ContentTab,
    MediaType,
    ContinueWatchingItem,
    SortOption,
} from "../../src/types/homeScreen.types";
import {
    SORT_OPTIONS,
    DEFAULT_SORT_VALUE,
} from "../../src/types/homeScreen.types";
import {
    buildDiscoverParams,
    hasActiveFilters,
    fetchMovieContent,
    fetchTVContent,
    calculatePaginationState,
    mergeContentResults,
    shouldSkipContentLoad,
    processContinueWatchingShow,
    filterActualEpisodeProgress,
    extractUniqueShowIds,
    countWatchedEpisodes,
    processGenreName,
    sortGenresAlphabetically,
    isNotNull,
} from "../../src/utils/contentLoader.utils";
import { ContinueWatchingCard } from "../../src/components/ContinueWatchingCard";
import { seasonsToProgressInfo } from "../../src/utils/tvDetail.utils";
import SmokeBackground from "../../src/components/SmokeBackground";

// ============================================================================
// Constants
// ============================================================================

const MAX_CONTINUE_WATCHING_ITEMS = 10;

// ============================================================================
// Custom Hooks
// ============================================================================

interface UseContentLoadingParams {
    activeTab: ContentTab;
    page: number;
    hasMore: boolean;
    loading: boolean;
    filtersActive: boolean;
    searchQuery: string;
    sortBy: string;
    selectedGenre: number | null;
    selectedYear: string;
}

interface UseContentLoadingReturn {
    loadContent: (reset?: boolean) => Promise<void>;
    movies: Movie[];
    tvShows: TVShow[];
    setMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
    setTVShows: React.Dispatch<React.SetStateAction<TVShow[]>>;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const useContentLoading = (
    params: UseContentLoadingParams
): UseContentLoadingReturn => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [tvShows, setTVShows] = useState<TVShow[]>([]);
    const [localLoading, setLocalLoading] = useState(true);
    const [localPage, setLocalPage] = useState(1);
    const [localHasMore, setLocalHasMore] = useState(true);

    const {
        activeTab,
        filtersActive,
        searchQuery,
        sortBy,
        selectedGenre,
        selectedYear,
    } = params;

    const loadContent = useCallback(
        async (reset: boolean = false): Promise<void> => {
            const currentPage = reset ? 1 : localPage;
            const shouldUseDiscoverApi = filtersActive && !searchQuery;

            if (shouldSkipContentLoad(reset, localHasMore, localLoading)) {
                return;
            }

            setLocalLoading(true);

            try {
                const discoverParams = buildDiscoverParams({
                    currentPage,
                    sortBy,
                    selectedGenre,
                    selectedYear,
                    activeTab,
                });

                if (activeTab === "movies") {
                    const { results, totalPages } = await fetchMovieContent(
                        currentPage,
                        shouldUseDiscoverApi,
                        discoverParams
                    );

                    setMovies((prev) => mergeContentResults(prev, results, reset));
                    const pagination = calculatePaginationState(currentPage, totalPages, reset);
                    setLocalHasMore(pagination.hasMore);
                    setLocalPage(pagination.nextPage);
                } else {
                    const { results, totalPages } = await fetchTVContent(
                        currentPage,
                        shouldUseDiscoverApi,
                        discoverParams
                    );

                    setTVShows((prev) => mergeContentResults(prev, results, reset));
                    const pagination = calculatePaginationState(currentPage, totalPages, reset);
                    setLocalHasMore(pagination.hasMore);
                    setLocalPage(pagination.nextPage);
                }
            } catch (err) {
                console.error("Error loading content:", err);
            } finally {
                setLocalLoading(false);
            }
        },
        [
            activeTab,
            filtersActive,
            searchQuery,
            sortBy,
            selectedGenre,
            selectedYear,
            localPage,
            localHasMore,
            localLoading,
        ]
    );

    return {
        loadContent,
        movies,
        tvShows,
        setMovies,
        setTVShows,
        setPage: setLocalPage,
        setHasMore: setLocalHasMore,
        setLoading: setLocalLoading,
    };
};

// ============================================================================
// Main Component
// ============================================================================

export default function HomeScreen(): JSX.Element {
    // Tab State
    const [activeTab, setActiveTab] = useState<ContentTab>("movies");

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // UI State
    const [refreshing, setRefreshing] = useState(false);
    const [showProfileBanner, setShowProfileBanner] = useState(false);
    const [showContinueSection, setShowContinueSection] = useState(true);

    // Filter State
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState("");
    const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
    const [filtersActive, setFiltersActive] = useState(false);

    // Continue Watching State
    const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
    const [loadingContinue, setLoadingContinue] = useState(false);

    // Content Loading Hook
    const {
        loadContent,
        movies,
        tvShows,
        setMovies,
        setTVShows,
        setPage,
        setHasMore,
        setLoading,
    } = useContentLoading({
        activeTab,
        page: 1,
        hasMore: true,
        loading: true,
        filtersActive,
        searchQuery,
        sortBy,
        selectedGenre,
        selectedYear,
    });

    // Store Hooks
    const { user } = useAuthStore();
    const {
        fetchUserContent,
        isFavorite,
        isInWatchlist,
        isWatched,
        addToFavorites,
        removeFromFavorites,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatched,
        tvProgress,
        fetchTVProgress,
        getNextEpisodeToWatch,
    } = useContentStore();

    // ========================================================================
    // Derived State
    // ========================================================================

    const data = activeTab === "movies" ? movies : tvShows;
    const loading = data.length === 0;

    // ========================================================================
    // Effects
    // ========================================================================

    // Initial content load
    useEffect(() => {
        loadContent();
        loadGenres();
    }, []);

    // Fetch user content when screen focuses
    useFocusEffect(
        useCallback(() => {
            if (!user) return;

            fetchUserContent();
            fetchTVProgress();

            const { profile } = useAuthStore.getState();
            const hasGenericUsername = profile?.username?.startsWith("user_") ?? false;
            setShowProfileBanner(hasGenericUsername);
        }, [user, fetchUserContent, fetchTVProgress])
    );

    // Update continue watching when TV progress changes
    useEffect(() => {
        const shouldLoadContinueWatching =
            activeTab === "tv" && user && tvProgress.length > 0;

        if (shouldLoadContinueWatching) {
            loadContinueWatching();
        } else {
            setContinueWatching([]);
        }
    }, [activeTab, tvProgress.length, user]);

    // Handle tab changes
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        setSearchQuery("");
        resetFilters(false);
        loadContent(true);
        loadGenres();
    }, [activeTab]);

    // ========================================================================
    // Handlers
    // ========================================================================

    const loadGenres = async (): Promise<void> => {
        try {
            const data =
                activeTab === "movies"
                    ? await getMovieGenres()
                    : await getTVGenres();

            const processedGenres = sortGenresAlphabetically(
                data.genres.map((genre) => ({
                    ...genre,
                    name: processGenreName(genre.name),
                }))
            );

            setGenres(processedGenres);
        } catch (err) {
            console.error("Error loading genres:", err);
        }
    };

    const loadContinueWatching = async (): Promise<void> => {
        setLoadingContinue(true);

        try {
            const actualProgress = filterActualEpisodeProgress(tvProgress);
            const showIds = extractUniqueShowIds(actualProgress);

            if (showIds.length === 0) {
                setContinueWatching([]);
                return;
            }

            const showPromises = showIds
                .slice(0, MAX_CONTINUE_WATCHING_ITEMS)
                .map((showId) =>
                    processContinueWatchingShow(
                        showId,
                        countWatchedEpisodes(tvProgress, showId),
                        isWatched(showId, "tv")
                    )
                );

            const results = await Promise.all(showPromises);
            setContinueWatching(results.filter(isNotNull));
        } catch (err) {
            console.error("Error loading continue watching:", err);
        } finally {
            setLoadingContinue(false);
        }
    };

    const resetFilters = (reload: boolean = true): void => {
        setSelectedGenre(null);
        setSelectedYear("");
        setSortBy(DEFAULT_SORT_VALUE);
        setFiltersActive(false);

        if (reload) {
            loadContent(true);
        }
    };

    const applyFilters = (): void => {
        const activeFiltersExist = hasActiveFilters(
            selectedGenre,
            selectedYear,
            sortBy,
            DEFAULT_SORT_VALUE
        );

        setFiltersActive(activeFiltersExist);
        setShowFilterModal(false);
        setPage(1);
        setHasMore(true);

        // Delay to allow modal close animation
        setTimeout(() => loadContent(true), 100);
    };

    const handleSearch = async (): Promise<void> => {
        if (!searchQuery.trim()) {
            loadContent(true);
            return;
        }

        setIsSearching(true);
        setLoading(true);

        try {
            if (activeTab === "movies") {
                const response = await searchMovies(searchQuery);
                setMovies(response.results);
            } else {
                const response = await searchTVShows(searchQuery);
                setTVShows(response.results);
            }
            setHasMore(false);
        } catch (err) {
            console.error("Error searching:", err);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    const handleRefresh = async (): Promise<void> => {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
        setSearchQuery("");
        await loadContent(true);
        setRefreshing(false);
    };

    const handleToggleFavorite = async (
        tmdbId: number,
        mediaType: MediaType
    ): Promise<void> => {
        if (!user) return;

        if (isFavorite(tmdbId, mediaType)) {
            await removeFromFavorites(tmdbId, mediaType);
        } else {
            await addToFavorites(tmdbId, mediaType);
        }
    };

    const handleToggleWatchlist = async (
        tmdbId: number,
        mediaType: MediaType
    ): Promise<void> => {
        if (!user) return;

        if (isInWatchlist(tmdbId, mediaType)) {
            await removeFromWatchlist(tmdbId, mediaType);
        } else {
            await addToWatchlist(tmdbId, mediaType);
        }
    };

    const handleToggleWatched = async (
        tmdbId: number,
        mediaType: MediaType
    ): Promise<void> => {
        await toggleWatched(tmdbId, mediaType);
    };

    const getMediaType = (): MediaType => (activeTab === "movies" ? "movie" : "tv");

    // ========================================================================
    // Render Functions
    // ========================================================================

    const renderItem = ({ item }: { item: Movie | TVShow }): JSX.Element => {
        const mediaType = getMediaType();

        return (
            <MovieCard
                item={item}
                mediaType={mediaType}
                isFavorite={isFavorite(item.id, mediaType)}
                inWatchlist={isInWatchlist(item.id, mediaType)}
                isWatched={isWatched(item.id, mediaType)}
                onToggleFavorite={() => handleToggleFavorite(item.id, mediaType)}
                onToggleWatchlist={() => handleToggleWatchlist(item.id, mediaType)}
                onToggleWatched={() => handleToggleWatched(item.id, mediaType)}
            />
        );
    };

    const renderFooter = (): JSX.Element | null => {
        if (!loading || data.length === 0) return null;

        return (
            <View style={styles.footerContainer}>
                <ActivityIndicator size="small" color="#dc2626" />
            </View>
        );
    };

    const renderContinueWatchingItem = ({
        item,
    }: {
        item: ContinueWatchingItem;
    }): JSX.Element => {
        const nextEpisode = getNextEpisodeToWatch(
            item.show.id,
            seasonsToProgressInfo(item.show.seasons)
        );

        return (
            <ContinueWatchingCard
                item={item}
                onPress={(showId) => router.push(`/tv/${showId}`)}
                nextEpisode={nextEpisode}
            />
        );
    };

    const renderContinueWatching = (): JSX.Element | null => {
        if (activeTab !== "tv" || !showContinueSection) return null;

        if (loadingContinue) {
            return (
                <View
                    style={[
                        styles.continueSection,
                        { height: 160, justifyContent: "center" },
                    ]}
                >
                    <ActivityIndicator size="small" color={Colors.bloodRed} />
                </View>
            );
        }

        if (continueWatching.length === 0) return null;

        return (
            <View style={styles.continueSection}>
                <View style={styles.continueHeader}>
                    <Text style={styles.continueTitle}>Continuar Viendo</Text>
                    <TouchableOpacity onPress={() => setShowContinueSection(false)}>
                        <Ionicons
                            name="close-circle"
                            size={24}
                            color={Colors.metalSilver}
                        />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={continueWatching}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => `${item.show.id}-${index}`}
                    contentContainerStyle={styles.continueList}
                    renderItem={renderContinueWatchingItem}
                />
            </View>
        );
    };

    const renderSortOption = (option: SortOption): JSX.Element => (
        <TouchableOpacity
            key={option.value}
            style={[
                styles.optionChip,
                sortBy === option.value && styles.activeOptionChip,
            ]}
            onPress={() => setSortBy(option.value)}
        >
            <Text
                style={[
                    styles.optionText,
                    sortBy === option.value && styles.activeOptionText,
                ]}
            >
                {option.label}
            </Text>
        </TouchableOpacity>
    );

    const renderGenreChip = (genre: Genre): JSX.Element => (
        <TouchableOpacity
            key={genre.id}
            style={[
                styles.genreChip,
                selectedGenre === genre.id && styles.activeGenreChip,
            ]}
            onPress={() =>
                setSelectedGenre(selectedGenre === genre.id ? null : genre.id)
            }
        >
            <Text
                style={[
                    styles.genreChipText,
                    selectedGenre === genre.id && styles.activeGenreText,
                ]}
            >
                {genre.name}
            </Text>
        </TouchableOpacity>
    );

    const renderEmptyState = (): JSX.Element => (
        <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>🎬</Text>
            <Text style={styles.emptyText}>No se encontraron resultados</Text>
        </View>
    );

    const renderLoadingState = (): JSX.Element => (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.loadingText}>Cargando contenido...</Text>
        </View>
    );

    const renderContentList = (): JSX.Element => (
        <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            numColumns={3}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => !isSearching && loadContent()}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor="#dc2626"
                    colors={["#dc2626"]}
                />
            }
        />
    );

    const renderMainContent = (): JSX.Element => {
        if (loading && data.length === 0) {
            return renderLoadingState();
        }
        if (data.length === 0) {
            return renderEmptyState();
        }
        return renderContentList();
    };

    // ========================================================================
    // Main Render
    // ========================================================================

    return (
        <View style={[styles.safeArea, { paddingTop: 28 }]}>
            {/* Pill Tab System */}
            <View style={styles.tabsContainer}>
                <View style={styles.tabsWrapper}>
                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === "movies" ? styles.activeTab : styles.inactiveTab,
                        ]}
                        onPress={() => setActiveTab("movies")}
                    >
                        <View style={styles.tabContent}>
                            <MaterialCommunityIcons
                                name="movie-open-play-outline"
                                size={24}
                                color={
                                    activeTab === "movies" ? Colors.white : Colors.metalSilver
                                }
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "movies"
                                        ? styles.activeTabText
                                        : styles.inactiveTabText,
                                ]}
                            >
                                Películas
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tab,
                            activeTab === "tv" ? styles.activeTab : styles.inactiveTab,
                        ]}
                        onPress={() => setActiveTab("tv")}
                    >
                        <View style={styles.tabContent}>
                            <Feather
                                name="tv"
                                size={24}
                                color={activeTab === "tv" ? Colors.white : Colors.metalSilver}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === "tv"
                                        ? styles.activeTabText
                                        : styles.inactiveTabText,
                                ]}
                            >
                                Series
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Profile Setup Banner */}
            {showProfileBanner && (
                <TouchableOpacity
                    style={styles.profileBanner}
                    onPress={() => router.push("/profile" as Parameters<typeof router.push>[0])}
                >
                    <View style={styles.profileBannerContent}>
                        <Ionicons name="sparkles" size={20} color={Colors.white} />
                        <View style={styles.profileBannerTextContainer}>
                            <Text style={styles.profileBannerTitle}>
                                ¡Dale estilo a tu cuenta!
                            </Text>
                            <Text style={styles.profileBannerSubtitle}>
                                Cambia tu nombre de usuario genérico en tu perfil.
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                setShowProfileBanner(false);
                            }}
                        >
                            <Ionicons
                                name="close"
                                size={24}
                                color="rgba(255,255,255,0.6)"
                            />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}

            {/* Search and Filter Row */}
            <View style={styles.controlsContainer}>
                <View style={styles.searchAndFilterRow}>
                    <View style={styles.searchWrapper}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar..."
                            placeholderTextColor="#71717a"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {!!searchQuery && (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={() => {
                                    setSearchQuery("");
                                    loadContent(true);
                                }}
                            >
                                <Ionicons name="close-circle" size={20} color="#71717a" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.searchButton}
                            onPress={handleSearch}
                        >
                            <Entypo name="magnifying-glass" size={24} color="#71717a" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.filterButtonCompact,
                            filtersActive && styles.activeFilterButton,
                        ]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Ionicons
                            name="filter"
                            size={20}
                            color={filtersActive ? Colors.white : Colors.metalSilver}
                        />
                    </TouchableOpacity>
                </View>

                {filtersActive && (
                    <TouchableOpacity
                        style={styles.clearFiltersContainer}
                        onPress={() => resetFilters(true)}
                    >
                        <Text style={styles.clearFiltersText}>
                            Limpiar filtros activos
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Content List */}
            {renderMainContent()}

            {activeTab === "tv" && renderContinueWatching()}

            <Modal
                visible={showFilterModal}
                animationType="slide"
                transparent={true} // Keep true for slide animation over context, but container will be opaque
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: Colors.metalBlack }]}>
                    <SmokeBackground />
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Filtrar</Text>
                        <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        {/* Sort By */}
                        <Text style={styles.sectionHeader}>Ordenar Por</Text>
                        <View style={styles.optionsRow}>
                            {SORT_OPTIONS.map(renderSortOption)}
                        </View>

                        {/* Year */}
                        <Text style={styles.sectionHeader}>Año de Lanzamiento</Text>
                        <TextInput
                            style={styles.yearInput}
                            placeholder="Ej. 2023"
                            placeholderTextColor="#52525b"
                            keyboardType="number-pad"
                            value={selectedYear}
                            onChangeText={setSelectedYear}
                            maxLength={4}
                        />

                        {/* Genres */}
                        <Text style={styles.sectionHeader}>Género</Text>
                        <View style={styles.genresRow}>
                            {genres.map(renderGenreChip)}
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={applyFilters}
                        >
                            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
    } as ViewStyle,
    tabContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    } as ViewStyle,
    profileBannerTextContainer: {
        flex: 1,
    } as ViewStyle,
    filterHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 8,
    } as ViewStyle,
    filterButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.metalGray,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 9999,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    } as ViewStyle,
    activeFilterButton: {
        backgroundColor: Colors.bloodRed,
        borderColor: Colors.bloodRed,
    } as ViewStyle,
    filterButtonText: {
        color: Colors.metalSilver,
        fontWeight: "bold",
    } as TextStyle,
    activeFilterButtonText: {
        color: Colors.white,
    } as TextStyle,
    clearFiltersText: {
        color: Colors.metalSilver,
        textDecorationLine: "underline",
    } as TextStyle,
    controlsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    } as ViewStyle,
    searchAndFilterRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    } as ViewStyle,
    filterButtonCompact: {
        backgroundColor: Colors.metalGray,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        justifyContent: "center",
        alignItems: "center",
    } as ViewStyle,
    clearFiltersContainer: {
        marginTop: 4,
        alignSelf: "flex-end",
    } as ViewStyle,
    searchWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        borderColor: Colors.metalSilver,
        borderWidth: 1,
    } as ViewStyle,
    searchInput: {
        flex: 1,
        color: "#f4f4f5",
        paddingHorizontal: 16,
        paddingVertical: 12,
    } as TextStyle,
    searchButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    } as ViewStyle,
    clearButton: {
        paddingHorizontal: 8,
        paddingVertical: 6,
    } as ViewStyle,
    searchIcon: {
        fontSize: 20,
    } as TextStyle,
    tabsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        marginTop: -28,
    } as ViewStyle,
    tabsWrapper: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        borderRadius: 9999,
    } as ViewStyle,
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 9999,
    } as ViewStyle,
    activeTab: {
        backgroundColor: Colors.bloodRed,
    } as ViewStyle,
    inactiveTab: {
        backgroundColor: "transparent",
    } as ViewStyle,
    tabText: {
        textAlign: "center",
        fontWeight: "bold",
    } as TextStyle,
    activeTabText: {
        color: Colors.white,
    } as TextStyle,
    inactiveTabText: {
        color: Colors.metalSilver,
    } as TextStyle,
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    loadingText: {
        color: Colors.metalSilver,
        marginTop: 16,
    } as TextStyle,
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
    } as TextStyle,
    emptyText: {
        color: Colors.metalSilver,
        fontSize: 18,
    } as TextStyle,
    columnWrapper: {
        paddingHorizontal: 8,
        justifyContent: "center",
        gap: 12,
    } as ViewStyle,
    listContent: {
        paddingBottom: 20,
    } as ViewStyle,
    footerContainer: {
        paddingVertical: 16,
    } as ViewStyle,
    modalContainer: {
        flex: 1,
        padding: 16,
    } as ViewStyle,
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    } as ViewStyle,
    modalTitle: {
        color: "#f4f4f5",
        fontSize: 24,
        fontWeight: "bold",
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
    closeButtonText: {
        color: Colors.bloodRed,
        fontSize: 20,
    } as TextStyle,
    modalContent: {
        paddingBottom: 40,
    } as ViewStyle,
    sectionHeader: {
        color: Colors.metalSilver,
        fontSize: 14,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 16,
    } as TextStyle,
    optionsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    } as ViewStyle,
    optionChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 9999,
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    } as ViewStyle,
    activeOptionChip: {
        backgroundColor: Colors.bloodRed,
        borderColor: Colors.bloodRed,
    } as ViewStyle,
    optionText: {
        color: "#f4f4f5",
    } as TextStyle,
    activeOptionText: {
        color: Colors.white,
        fontWeight: "bold",
    } as TextStyle,
    yearInput: {
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        borderRadius: 8,
        padding: 12,
        color: "#f4f4f5",
        fontSize: 16,
    } as TextStyle,
    genresRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    } as ViewStyle,
    genreChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    } as ViewStyle,
    activeGenreChip: {
        backgroundColor: Colors.bloodRed,
        borderColor: Colors.bloodRed,
    } as ViewStyle,
    genreChipText: {
        color: "#f4f4f5",
        fontSize: 12,
    } as TextStyle,
    activeGenreText: {
        color: Colors.white,
        fontWeight: "bold",
    } as TextStyle,
    modalFooter: {
        paddingTop: 16,
        paddingBottom: 48,
    } as ViewStyle,
    applyButton: {
        backgroundColor: Colors.bloodRed,
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: "center",
    } as ViewStyle,
    applyButtonText: {
        color: Colors.white,
        fontWeight: "bold",
        fontSize: 16,
        textTransform: "uppercase",
    } as TextStyle,
    profileBanner: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: Colors.bloodRed,
        borderRadius: 8,
        padding: 12,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    } as ViewStyle,
    profileBannerContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    } as ViewStyle,
    profileBannerTitle: {
        color: Colors.white,
        fontWeight: "bold",
        fontSize: 14,
    } as TextStyle,
    profileBannerSubtitle: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 12,
    } as TextStyle,
    continueSection: {
        paddingVertical: 20,
        backgroundColor: "rgba(10, 10, 10, 0.8)",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
        marginVertical: 8,
    } as ViewStyle,
    continueHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 8,
    } as ViewStyle,
    continueTitle: {
        color: Colors.white,
        fontSize: 18,
        fontFamily: "BebasNeue_400Regular",
        letterSpacing: 1.5,
    } as TextStyle,
    continueList: {
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 16,
    } as ViewStyle,
    continueCard: {
        width: 280,
    } as ViewStyle,
});