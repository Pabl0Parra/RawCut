import React, { useState, useEffect, useCallback, useRef, JSX } from "react";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    withTiming,
} from "react-native-reanimated";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    MaterialCommunityIcons,
    Feather,
    Entypo,
    Ionicons,
} from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

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
import { useVoteStore } from "../../src/stores/voteStore";
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
// Custom Hook — useContentLoading
// ============================================================================

interface UseContentLoadingParams {
    activeTab: ContentTab;
    filtersActive: boolean;
    searchQuery: string;
    sortBy: string;
    selectedGenre: number | null;
    selectedYear: string;
}

type LoadContentOverrides = Partial<
    Pick<UseContentLoadingParams, "sortBy" | "selectedGenre" | "selectedYear" | "activeTab">
>;

interface UseContentLoadingReturn {
    loadContent: (reset?: boolean, overrides?: LoadContentOverrides) => Promise<void>;
    loading: boolean;
    movies: Movie[];
    tvShows: TVShow[];
    setMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
    setTVShows: React.Dispatch<React.SetStateAction<TVShow[]>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    resetPagination: () => void;
}

/**
 * Manages content fetching with pagination, filtering, and search.
 *
 * Pagination state (page, hasMore, loading) is stored in refs so that
 * `loadContent` doesn't recreate on every page increment — this prevents
 * a cascade of stale closures through effects and callbacks that depend on it.
 */
const useContentLoading = (
    params: UseContentLoadingParams,
): UseContentLoadingReturn => {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [tvShows, setTVShows] = useState<TVShow[]>([]);
    // Exposed as state for rendering (loading spinner, etc.)
    const [localLoading, setLocalLoading] = useState(true);

    // Pagination lives in refs — read by loadContent without causing
    // callback recreation. Written alongside state updates.
    const pageRef = useRef(1);
    const hasMoreRef = useRef(true);
    const loadingRef = useRef(false);

    const {
        activeTab,
        filtersActive,
        searchQuery,
        sortBy,
        selectedGenre,
        selectedYear,
    } = params;

    const resetPagination = useCallback((): void => {
        pageRef.current = 1;
        hasMoreRef.current = true;
    }, []);

    const loadContent = useCallback(
        async (reset: boolean = false, overrides?: LoadContentOverrides): Promise<void> => {
            const currentPage = reset ? 1 : pageRef.current;

            const effectiveSortBy = overrides?.sortBy ?? sortBy;
            const effectiveGenre = overrides?.selectedGenre !== undefined
                ? overrides.selectedGenre
                : selectedGenre;
            const effectiveYear = overrides?.selectedYear ?? selectedYear;
            const effectiveTab = overrides?.activeTab ?? activeTab;

            const effectiveFiltersActive = overrides ? true : filtersActive;
            const shouldUseDiscoverApi = effectiveFiltersActive && !searchQuery;

            if (shouldSkipContentLoad(reset, hasMoreRef.current, loadingRef.current)) {
                return;
            }

            loadingRef.current = true;
            setLocalLoading(true);

            try {
                const discoverParams = buildDiscoverParams({
                    currentPage,
                    sortBy: effectiveSortBy,
                    selectedGenre: effectiveGenre,
                    selectedYear: effectiveYear,
                    activeTab: effectiveTab,
                });

                const isMovies = effectiveTab === "movies";
                const { results, totalPages } = isMovies
                    ? await fetchMovieContent(currentPage, shouldUseDiscoverApi, discoverParams)
                    : await fetchTVContent(currentPage, shouldUseDiscoverApi, discoverParams);

                if (isMovies) {
                    setMovies((prev: Movie[]) => mergeContentResults(prev, results as Movie[], reset));
                } else {
                    setTVShows((prev: TVShow[]) => mergeContentResults(prev, results as TVShow[], reset));
                }

                const pagination = calculatePaginationState(currentPage, totalPages, reset);
                hasMoreRef.current = pagination.hasMore;
                pageRef.current = pagination.nextPage;
            } catch (err) {
                console.error("[useContentLoading] Error loading content:", err);
            } finally {
                loadingRef.current = false;
                setLocalLoading(false);
            }
        },
        [activeTab, filtersActive, searchQuery, sortBy, selectedGenre, selectedYear],
    );

    return {
        loadContent,
        loading: localLoading,
        movies,
        tvShows,
        setMovies,
        setTVShows,
        setLoading: setLocalLoading,
        resetPagination,
    };
};

// ============================================================================
// Main Component
// ============================================================================

export default function HomeScreen(): JSX.Element {
    // ── Tab State ───────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<ContentTab>("movies");

    // ── Search State ────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // ── UI State ────────────────────────────────────────────────────────
    const [refreshing, setRefreshing] = useState(false);
    const [showProfileBanner, setShowProfileBanner] = useState(false);
    const [showContinueSection, setShowContinueSection] = useState(true);

    // ── Filter State ────────────────────────────────────────────────────
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState("");
    const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
    const [filtersActive, setFiltersActive] = useState(false);

    // ── Continue Watching State ─────────────────────────────────────────
    const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
    const [loadingContinue, setLoadingContinue] = useState(false);

    // ── Content Loading Hook ────────────────────────────────────────────
    const {
        loadContent,
        loading,
        movies,
        tvShows,
        setMovies,
        setTVShows,
        setLoading,
        resetPagination,
    } = useContentLoading({
        activeTab,
        filtersActive,
        searchQuery,
        sortBy,
        selectedGenre,
        selectedYear,
    });

    // ── Gesture State for Modal ──────────────────────────────────────────
    const translateY = useSharedValue(0);

    const animatedModalStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (e.translationY > 0) {
                translateY.value = e.translationY;
            }
        })
        .onEnd((e) => {
            if (e.translationY > 150 || e.velocityY > 500) {
                translateY.value = withTiming(1000, {}, () => {
                    runOnJS(handleCloseFilters)();
                });
            } else {
                translateY.value = withSpring(0);
            }
        });

    useEffect(() => {
        if (showFilterModal) {
            translateY.value = withSpring(0);
        } else {
            translateY.value = 0;
        }
    }, [showFilterModal]);

    // ── Store Selectors (granular — only re-render when these change) ──
    const user = useAuthStore((s) => s.user);
    // Subscribe to the actual data arrays so the component re-renders when
    // favorites/watchlist/tvProgress change — function refs are stable and
    // would never trigger a renderItem rebuild on their own.
    const favorites = useContentStore((s) => s.favorites);
    const watchlist = useContentStore((s) => s.watchlist);
    const tvProgress = useContentStore((s) => s.tvProgress);
    const getNextEpisodeToWatch = useContentStore((s) => s.getNextEpisodeToWatch);

    // ── Vote Store ───────────────────────────────────────────────────────
    const userVotes = useVoteStore((s) => s.userVotes);
    const communityScores = useVoteStore((s) => s.communityScores);

    // ── Derived State ───────────────────────────────────────────────────
    const data = activeTab === "movies" ? movies : tvShows;
    const mediaType: MediaType = activeTab === "movies" ? "movie" : "tv";

    // ====================================================================
    // Effects
    // ====================================================================

    // Initial content load
    useEffect(() => {
        loadContent();
        loadGenres(activeTab);
    }, []);

    // Fetch community vote aggregates whenever visible content changes
    useEffect(() => {
        if (data.length === 0) return;
        const ids = data.map((item) => item.id);
        useVoteStore.getState().fetchVotes(ids, mediaType);
    }, [data, mediaType]);


    // Fetch user content when screen focuses
    useFocusEffect(
        useCallback(() => {
            if (!user) return;

            const { fetchUserContent, fetchTVProgress } = useContentStore.getState();
            fetchUserContent();
            fetchTVProgress();

            const { profile } = useAuthStore.getState();
            const hasGenericUsername = profile?.username?.startsWith("user_") ?? false;
            setShowProfileBanner(hasGenericUsername);
        }, [user]),
    );

    // Update continue watching when TV progress changes
    useEffect(() => {
        if (activeTab === "tv" && user && tvProgress.length > 0) {
            loadContinueWatching();
        } else {
            setContinueWatching([]);
        }
    }, [activeTab, tvProgress.length, user]);

    // Handle tab changes
    useEffect(() => {
        resetPagination();
        setSearchQuery("");
        resetFilters(false);
        loadContent(true);
        loadGenres(activeTab);
    }, [activeTab]);

    // ====================================================================
    // Handlers
    // ====================================================================

    const loadGenres = useCallback(async (tab: ContentTab): Promise<void> => {
        try {
            const genreData = tab === "movies"
                ? await getMovieGenres()
                : await getTVGenres();

            const processedGenres = sortGenresAlphabetically(
                genreData.genres.map((genre) => ({
                    ...genre,
                    name: processGenreName(genre.name),
                })),
            );

            setGenres(processedGenres);
        } catch (err) {
            console.error("[HomeScreen] Error loading genres:", err);
        }
    }, []);

    const loadContinueWatching = useCallback(async (): Promise<void> => {
        setLoadingContinue(true);

        try {
            const currentTvProgress = useContentStore.getState().tvProgress;
            const currentIsWatched = useContentStore.getState().isWatched;

            const actualProgress = filterActualEpisodeProgress(currentTvProgress);
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
                        countWatchedEpisodes(currentTvProgress, showId),
                        currentIsWatched(showId, "tv"),
                    ),
                );

            const results = await Promise.all(showPromises);
            setContinueWatching(results.filter(isNotNull));
        } catch (err) {
            console.error("[HomeScreen] Error loading continue watching:", err);
        } finally {
            setLoadingContinue(false);
        }
    }, []);

    const resetFilters = useCallback((reload: boolean = true): void => {
        setSelectedGenre(null);
        setSelectedYear("");
        setSortBy(DEFAULT_SORT_VALUE);
        setFiltersActive(false);

        if (reload) {
            loadContent(true);
        }
    }, [loadContent]);

    const applyFilters = useCallback((): void => {
        const activeFiltersExist = hasActiveFilters(
            selectedGenre,
            selectedYear,
            sortBy,
            DEFAULT_SORT_VALUE,
        );

        setFiltersActive(activeFiltersExist);
        setShowFilterModal(false);
        resetPagination();

        loadContent(true, {
            selectedGenre,
            selectedYear,
            sortBy,
            activeTab,
        });
    }, [selectedGenre, selectedYear, sortBy, activeTab, loadContent, resetPagination]);

    const handleSearch = useCallback(async (): Promise<void> => {
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
            resetPagination();
        } catch (err) {
            console.error("[HomeScreen] Error searching:", err);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    }, [searchQuery, activeTab, loadContent, setLoading, setMovies, setTVShows, resetPagination]);

    const handleRefresh = useCallback(async (): Promise<void> => {
        setRefreshing(true);
        resetPagination();
        setSearchQuery("");
        await loadContent(true);
        setRefreshing(false);
    }, [loadContent, resetPagination]);

    const handleClearSearch = useCallback((): void => {
        setSearchQuery("");
        loadContent(true);
    }, [loadContent]);

    const handleToggleFavorite = useCallback(
        async (tmdbId: number, type: MediaType): Promise<void> => {
            if (!useAuthStore.getState().user) return;

            try {
                const store = useContentStore.getState();
                if (store.isFavorite(tmdbId, type)) {
                    await store.removeFromFavorites(tmdbId, type);
                } else {
                    await store.addToFavorites(tmdbId, type);
                }
            } catch (err) {
                console.error("[HomeScreen] Toggle favorite failed:", err);
            }
        },
        [],
    );

    const handleToggleWatchlist = useCallback(
        async (tmdbId: number, type: MediaType): Promise<void> => {
            if (!useAuthStore.getState().user) return;

            try {
                const store = useContentStore.getState();
                if (store.isInWatchlist(tmdbId, type)) {
                    await store.removeFromWatchlist(tmdbId, type);
                } else {
                    await store.addToWatchlist(tmdbId, type);
                }
            } catch (err) {
                console.error("[HomeScreen] Toggle watchlist failed:", err);
            }
        },
        [],
    );

    const handleToggleWatched = useCallback(
        async (tmdbId: number, type: MediaType): Promise<void> => {
            try {
                await useContentStore.getState().toggleWatched(tmdbId, type);
            } catch (err) {
                console.error("[HomeScreen] Toggle watched failed:", err);
            }
        },
        [],
    );

    const handleVote = useCallback(
        async (tmdbId: number, type: MediaType, vote: number): Promise<void> => {
            try {
                await useVoteStore.getState().submitVote(tmdbId, type, vote);
            } catch (err) {
                console.error("[HomeScreen] Vote failed:", err);
            }
        },
        [],
    );

    // ====================================================================
    // Render Functions
    // ====================================================================

    const renderItem = useCallback(
        ({ item }: { item: Movie | TVShow }): JSX.Element => {
            // Read current state inline so booleans are always fresh.
            const store = useContentStore.getState();
            const vStore = useVoteStore.getState();
            return (
                <MovieCard
                    item={item}
                    mediaType={mediaType}
                    isFavorite={store.isFavorite(item.id, mediaType)}
                    inWatchlist={store.isInWatchlist(item.id, mediaType)}
                    isWatched={store.isWatched(item.id, mediaType)}
                    communityRating={vStore.getCommunityScore(item.id, mediaType)?.avg}
                    userVote={vStore.getUserVote(item.id, mediaType)}
                    onToggleFavorite={() => handleToggleFavorite(item.id, mediaType)}
                    onToggleWatchlist={() => handleToggleWatchlist(item.id, mediaType)}
                    onToggleWatched={() => handleToggleWatched(item.id, mediaType)}
                    onVote={(vote) => handleVote(item.id, mediaType, vote)}
                />
            );
        },
        // favorites/watchlist/tvProgress/votes subscriptions trigger re-render
        [mediaType, favorites, watchlist, tvProgress, userVotes, communityScores, handleToggleFavorite, handleToggleWatchlist, handleToggleWatched, handleVote],
    );

    const renderFooter = useCallback((): JSX.Element | null => {
        if (!loading || data.length === 0) return null;

        return (
            <View style={styles.footerContainer}>
                <ActivityIndicator size="small" color="#dc2626" />
            </View>
        );
    }, [loading, data.length]);

    const renderContinueWatchingItem = useCallback(
        ({ item }: { item: ContinueWatchingItem }): JSX.Element => {
            const nextEpisode = getNextEpisodeToWatch(
                item.show.id,
                seasonsToProgressInfo(item.show.seasons),
            );

            return (
                <ContinueWatchingCard
                    item={item}
                    onPress={(showId: number) => router.push(`/tv/${showId}`)}
                    nextEpisode={nextEpisode}
                />
            );
        },
        [getNextEpisodeToWatch],
    );

    const handleEndReached = useCallback((): void => {
        if (!isSearching) {
            loadContent();
        }
    }, [isSearching, loadContent]);

    const handleDismissBanner = useCallback((): void => {
        setShowProfileBanner(false);
    }, []);

    const handleDismissContinue = useCallback((): void => {
        setShowContinueSection(false);
    }, []);

    const handleOpenFilters = useCallback((): void => {
        setShowFilterModal(true);
    }, []);

    const handleCloseFilters = useCallback((): void => {
        setShowFilterModal(false);
    }, []);

    // ====================================================================
    // Section Renderers
    // ====================================================================

    const renderContinueWatching = (): JSX.Element | null => {
        if (activeTab !== "tv" || !showContinueSection) return null;

        if (loadingContinue) {
            return (
                <View style={[styles.continueSection, styles.continueSectionLoading]}>
                    <ActivityIndicator size="small" color={Colors.bloodRed} />
                </View>
            );
        }

        if (continueWatching.length === 0) return null;

        return (
            <View style={styles.continueSection}>
                <View style={styles.continueHeader}>
                    <Text style={styles.continueTitle}>Continuar Viendo</Text>
                    <TouchableOpacity onPress={handleDismissContinue}>
                        <Ionicons name="close-circle" size={24} color={Colors.metalSilver} />
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={continueWatching}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => String(item.show.id)}
                    contentContainerStyle={styles.continueList}
                    renderItem={renderContinueWatchingItem}
                />
            </View>
        );
    };

    const renderSortOption = (option: SortOption): JSX.Element => (
        <TouchableOpacity
            key={option.value}
            style={[styles.optionChip, sortBy === option.value && styles.activeOptionChip]}
            onPress={() => setSortBy(option.value)}
        >
            <Text style={[styles.optionText, sortBy === option.value && styles.activeOptionText]}>
                {option.label}
            </Text>
        </TouchableOpacity>
    );

    const renderGenreChip = (genre: Genre): JSX.Element => (
        <TouchableOpacity
            key={genre.id}
            style={[styles.genreChip, selectedGenre === genre.id && styles.activeGenreChip]}
            onPress={() => setSelectedGenre(selectedGenre === genre.id ? null : genre.id)}
        >
            <Text style={[styles.genreChipText, selectedGenre === genre.id && styles.activeGenreText]}>
                {genre.name}
            </Text>
        </TouchableOpacity>
    );

    const renderMainContent = (): JSX.Element => {
        if (loading && data.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#dc2626" />
                    <Text style={styles.loadingText}>Cargando contenido...</Text>
                </View>
            );
        }

        if (data.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyIcon}>🎬</Text>
                    <Text style={styles.emptyText}>No se encontraron resultados</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => String(item.id)}
                numColumns={3}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                initialNumToRender={12}
                maxToRenderPerBatch={12}
                windowSize={5}
                removeClippedSubviews
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
    };

    // ====================================================================
    // Main Render
    // ====================================================================

    // Swipe left → TV, swipe right → Movies
    const swipeGesture = Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-20, 20])
        .failOffsetY([-15, 15])
        .onEnd((e) => {
            const { translationX, velocityX } = e;
            if (translationX < -50 || velocityX < -500) {
                if (activeTab !== "tv") setActiveTab("tv");
            } else if (translationX > 50 || velocityX > 500) {
                if (activeTab !== "movies") setActiveTab("movies");
            }
        });

    return (
        <GestureDetector gesture={swipeGesture}>
            <View style={[styles.safeArea, styles.safeAreaPadding]}>
                {/* Pill Tab System */}
                <View style={styles.tabsContainer}>
                    <View style={styles.tabsWrapper}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "movies" ? styles.activeTab : styles.inactiveTab]}
                            onPress={() => setActiveTab("movies")}
                        >
                            <View style={styles.tabContent}>
                                <MaterialCommunityIcons
                                    name="movie-open-play-outline"
                                    size={24}
                                    color={activeTab === "movies" ? Colors.white : Colors.metalSilver}
                                />
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === "movies" ? styles.activeTabText : styles.inactiveTabText,
                                    ]}
                                >
                                    Películas
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.tab, activeTab === "tv" ? styles.activeTab : styles.inactiveTab]}
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
                                        activeTab === "tv" ? styles.activeTabText : styles.inactiveTabText,
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
                                    handleDismissBanner();
                                }}
                            >
                                <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
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
                            {searchQuery.length > 0 && (
                                <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
                                    <Ionicons name="close-circle" size={20} color="#71717a" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                                <Entypo name="magnifying-glass" size={24} color="#71717a" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.filterButtonCompact, filtersActive && styles.activeFilterButton]}
                            onPress={handleOpenFilters}
                        >
                            <Ionicons
                                name="filter"
                                size={20}
                                color={filtersActive ? Colors.white : Colors.metalSilver}
                            />
                        </TouchableOpacity>
                    </View>

                    {filtersActive && (
                        <TouchableOpacity style={styles.clearFiltersContainer} onPress={() => resetFilters(true)}>
                            <Text style={styles.clearFiltersText}>Limpiar filtros activos</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content */}
                {renderMainContent()}
                {activeTab === "tv" && renderContinueWatching()}

                {/* Filter Modal */}
                <Modal
                    visible={showFilterModal}
                    animationType="slide"
                    transparent
                    onRequestClose={handleCloseFilters}
                >
                    {/* Black backdrop — tap outside to close */}
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={handleCloseFilters}
                    >
                        {/* Filter panel — stop propagation so tapping inside doesn't close */}
                        <GestureDetector gesture={panGesture}>
                            <Animated.View
                                style={[styles.filterPanel, animatedModalStyle]}
                                onStartShouldSetResponder={() => true}
                            >
                                <View style={styles.modalHandleContainer}>
                                    <View style={styles.modalHandle} />
                                </View>
                                <SmokeBackground />
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Filtrar</Text>
                                    <TouchableOpacity onPress={handleCloseFilters}>
                                        <Text style={styles.closeButtonText}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView contentContainerStyle={styles.modalContent}>
                                    <Text style={styles.sectionHeader}>Ordenar Por</Text>
                                    <View style={styles.optionsRow}>
                                        {SORT_OPTIONS.map(renderSortOption)}
                                    </View>

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

                                    <Text style={styles.sectionHeader}>Género</Text>
                                    <View style={styles.genresRow}>
                                        {genres.map(renderGenreChip)}
                                    </View>
                                </ScrollView>

                                <View style={styles.modalFooter}>
                                    <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                                        <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        </GestureDetector>
                    </TouchableOpacity>
                </Modal>
            </View>
        </GestureDetector>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
    },
    safeAreaPadding: {
        paddingTop: 28,
    },
    tabContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    profileBannerTextContainer: {
        flex: 1,
    },
    activeFilterButton: {
        backgroundColor: Colors.bloodRed,
        borderColor: Colors.bloodRed,
    },
    clearFiltersText: {
        color: Colors.metalSilver,
        textDecorationLine: "underline",
    },
    controlsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    searchAndFilterRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    filterButtonCompact: {
        backgroundColor: Colors.metalGray,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        justifyContent: "center",
        alignItems: "center",
    },
    clearFiltersContainer: {
        marginTop: 4,
        alignSelf: "flex-end",
    },
    searchWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        borderColor: Colors.metalSilver,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        color: "#f4f4f5",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    clearButton: {
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    tabsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        marginTop: -28,
    },
    tabsWrapper: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        borderRadius: 9999,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 9999,
    },
    activeTab: {
        backgroundColor: Colors.bloodRed,
    },
    inactiveTab: {
        backgroundColor: "transparent",
    },
    tabText: {
        textAlign: "center",
        fontWeight: "bold",
    },
    activeTabText: {
        color: Colors.white,
    },
    inactiveTabText: {
        color: Colors.metalSilver,
    },
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        color: Colors.metalSilver,
        marginTop: 16,
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
    },
    emptyText: {
        color: Colors.metalSilver,
        fontSize: 18,
    },
    columnWrapper: {
        paddingHorizontal: 8,
        justifyContent: "center",
        gap: 12,
    },
    listContent: {
        paddingBottom: 20,
    },
    footerContainer: {
        paddingVertical: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.92)",
        justifyContent: "flex-end",
    },
    filterPanel: {
        flex: 1,
        backgroundColor: "#141414ff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderTopWidth: 2,
        borderTopColor: "#01b4e4",
        borderLeftWidth: 1,
        borderLeftColor: "#01b4e422",
        borderRightWidth: 1,
        borderRightColor: "#01b4e422",
        overflow: "hidden",
    },
    modalHandleContainer: {
        width: "100%",
        height: 24,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#ffffff33",
        borderRadius: 2,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    modalTitle: {
        color: "#f4f4f5",
        fontSize: 24,
        fontWeight: "bold",
        fontFamily: "BebasNeue_400Regular",
    },
    closeButtonText: {
        color: Colors.bloodRed,
        fontSize: 20,
    },
    modalContent: {
        paddingBottom: 40,
    },
    sectionHeader: {
        color: Colors.metalSilver,
        fontSize: 14,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 16,
    },
    optionsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    optionChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 9999,
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    },
    activeOptionChip: {
        backgroundColor: Colors.bloodRed,
        borderColor: Colors.bloodRed,
    },
    optionText: {
        color: "#f4f4f5",
    },
    activeOptionText: {
        color: Colors.white,
        fontWeight: "bold",
    },
    yearInput: {
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        borderRadius: 8,
        padding: 12,
        color: "#f4f4f5",
        fontSize: 16,
    },
    genresRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    genreChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    },
    activeGenreChip: {
        backgroundColor: Colors.bloodRed,
        borderColor: Colors.bloodRed,
    },
    genreChipText: {
        color: "#f4f4f5",
        fontSize: 12,
    },
    activeGenreText: {
        color: Colors.white,
        fontWeight: "bold",
    },
    modalFooter: {
        paddingTop: 16,
        paddingBottom: 48,
    },
    applyButton: {
        backgroundColor: Colors.bloodRed,
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: "center",
    },
    applyButtonText: {
        color: Colors.white,
        fontWeight: "bold",
        fontSize: 16,
        textTransform: "uppercase",
    },
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
    },
    profileBannerContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    profileBannerTitle: {
        color: Colors.white,
        fontWeight: "bold",
        fontSize: 14,
    },
    profileBannerSubtitle: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 12,
    },
    continueSection: {
        paddingVertical: 20,
        backgroundColor: "rgba(10, 10, 10, 0.8)",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
        marginVertical: 8,
    },
    continueSectionLoading: {
        height: 160,
        justifyContent: "center",
    },
    continueHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    continueTitle: {
        color: Colors.white,
        fontSize: 18,
        fontFamily: "BebasNeue_400Regular",
        letterSpacing: 1.5,
    },
    continueList: {
        paddingHorizontal: 16,
        paddingTop: 12,
        gap: 16,
    },
});