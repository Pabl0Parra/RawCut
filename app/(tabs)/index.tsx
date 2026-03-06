import React, { useState, useEffect, useCallback, JSX, memo, useMemo } from "react";

import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS,
    withTiming,
    FadeInDown,
    FadeOutUp,
    LinearTransition,
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
    Dimensions,
} from "react-native";
import { Image } from "expo-image";
import {
    MaterialCommunityIcons,
    Ionicons,
} from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import MovieCard from "../../src/components/MovieCard";
import {
    searchMovies,
    searchTVShows,
    type Movie,
    type TVShow,
    type Genre,
} from "../../src/lib/tmdb";

import { useContentStore } from "../../src/stores/contentStore";
import { useVoteStore } from "../../src/stores/voteStore";
import { useAuthStore } from "../../src/stores/authStore";
import { Colors, Fonts } from "../../src/constants/Colors";

import type {
    MediaType,
    SortOption,
} from "../../src/types/homeScreen.types";
import {
    SORT_OPTIONS,
    DEFAULT_SORT_VALUE,
} from "../../src/types/homeScreen.types";
import {
    buildDiscoverParams,
    hasActiveFilters,
    processGenreName,
    sortGenresAlphabetically,
} from "../../src/utils/contentLoader.utils";
import SmokeBackground from "../../src/components/SmokeBackground";
import { useForYouContent } from "../../src/hooks/useForYouContent";

import {
    usePopularMovies,
    usePopularTVShows,
    useDiscoverMovies,
    useDiscoverTVShows,
    useMovieGenres,
    useTVGenres,
    useClassicMovies,
    useNewReleasesContent,
    useGenreContent,
    flattenPages,
} from "../../src/hooks/useHomeContent";
import { HeroCarousel } from "../../src/components/home/HeroCarousel";
import { HomeSkeleton } from "../../src/components/home/HomeSkeleton";
import { GridSkeleton } from "../../src/components/GridSkeleton";
import { HomeSection, type ContentActionHandlers } from "../../src/components/home/HomeSection";


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const NUM_COLUMNS = 3;
const COL_GAP = 12;
const SIDE_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - SIDE_PADDING * 2 - COL_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const POSTER_HEIGHT = CARD_WIDTH * 1.5;
const INFO_HEIGHT = 66;
const ITEM_ROW_HEIGHT = POSTER_HEIGHT + INFO_HEIGHT + 16;

// ─── Typed recommendation from useForYouContent ──────────────────────────────

interface ForYouRecommendation {
    readonly mediaType: MediaType;
    readonly items: ReadonlyArray<Movie | TVShow>;
}

// ─── MovieCardItem (grid cell) ───────────────────────────────────────────────

interface MovieCardItemProps {
    readonly item: Movie | TVShow;
    readonly mediaType: MediaType;
    readonly handleToggleFavorite: (id: number, type: MediaType) => Promise<void>;
    readonly handleToggleWatchlist: (id: number, type: MediaType) => Promise<void>;
    readonly handleToggleWatched: (id: number, type: MediaType) => Promise<void>;
    readonly handleVote: (id: number, type: MediaType, vote: number) => Promise<void>;
    readonly fullWidth?: boolean;
}

const MovieCardItem = memo(function MovieCardItem({
    item,
    mediaType,
    handleToggleFavorite,
    handleToggleWatchlist,
    handleToggleWatched,
    handleVote,
    fullWidth,
}: MovieCardItemProps) {
    const isFavorite = useContentStore((s) => s.isFavorite(item.id, mediaType));
    const inWatchlist = useContentStore((s) => s.isInWatchlist(item.id, mediaType));
    const isWatched = useContentStore((s) => s.isWatched(item.id, mediaType));
    const communityRating = useVoteStore((s) => s.getCommunityScore(item.id, mediaType)?.avg);
    const userVote = useVoteStore((s) => s.getUserVote(item.id, mediaType));

    return (
        <MovieCard
            item={item}
            mediaType={mediaType}
            isFavorite={isFavorite}
            inWatchlist={inWatchlist}
            isWatched={isWatched}
            communityRating={communityRating}
            userVote={userVote}
            onToggleFavorite={() => handleToggleFavorite(item.id, mediaType)}
            onToggleWatchlist={() => handleToggleWatchlist(item.id, mediaType)}
            onToggleWatched={() => handleToggleWatched(item.id, mediaType)}
            onVote={(vote) => handleVote(item.id, mediaType, vote)}
            fullWidth={fullWidth}
        />
    );
});

// ─── HomeScreen ──────────────────────────────────────────────────────────────

export default function HomeScreen(): JSX.Element {
    const { t } = useTranslation();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<MediaType>("movie");

    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const [refreshing, setRefreshing] = useState(false);
    const [showProfileBanner, setShowProfileBanner] = useState(false);

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<number | string | null>(null);
    const [selectedYear, setSelectedYear] = useState("");
    const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
    const [filtersActive, setFiltersActive] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const flatListRef = React.useRef<FlatList>(null);

    const { recommendations, forYouSettled } = useForYouContent("foryou");

    // Cast the weakly-typed hook result to our strict type
    const typedRecommendations = recommendations as ReadonlyArray<ForYouRecommendation>;

    // ─── Build discover params when filters are active ───────────────────
    const discoverParams = useMemo(() => buildDiscoverParams({
        currentPage: 1,
        sortBy,
        selectedGenre,
        selectedYear,
        activeTab: activeTab === "movie" ? "movies" : "tv",
    }), [sortBy, selectedGenre, selectedYear, activeTab]);

    const useDiscover = filtersActive || sortBy !== DEFAULT_SORT_VALUE;

    // ─── Browse content via TanStack Query ───────────────────────────────
    const popularMoviesQuery = usePopularMovies();
    const popularTVQuery = usePopularTVShows();
    const discoverMoviesQuery = useDiscoverMovies(discoverParams, useDiscover && activeTab === "movie");
    const discoverTVQuery = useDiscoverTVShows(discoverParams, useDiscover && activeTab === "tv");

    // ─── Genre queries ───────────────────────────────────────────────────
    const movieGenresQuery = useMovieGenres();
    const tvGenresQuery = useTVGenres();
    const genres = useMemo(() => {
        const rawGenres = activeTab === "tv" ? (tvGenresQuery.data ?? []) : (movieGenresQuery.data ?? []);
        return sortGenresAlphabetically(
            rawGenres.map((g) => ({ ...g, name: processGenreName(g.name) })),
        );
    }, [activeTab, movieGenresQuery.data, tvGenresQuery.data]);

    // ─── Derive data arrays ──────────────────────────────────────────────
    const moviesFromQuery = useMemo(
        () => useDiscover ? flattenPages(discoverMoviesQuery.data) : flattenPages(popularMoviesQuery.data),
        [useDiscover, discoverMoviesQuery.data, popularMoviesQuery.data],
    );
    const tvShowsFromQuery = useMemo(
        () => useDiscover ? flattenPages(discoverTVQuery.data) : flattenPages(popularTVQuery.data),
        [useDiscover, discoverTVQuery.data, popularTVQuery.data],
    );

    // Local state for search overrides
    const [searchMovies_, setSearchMovies] = useState<Movie[]>([]);
    const [searchTVShows_, setSearchTVShows] = useState<TVShow[]>([]);
    const isInSearchMode = isSearching
        || (searchQuery.trim().length > 0 && (searchMovies_.length > 0 || searchTVShows_.length > 0));

    const movies: Movie[] = isInSearchMode ? searchMovies_ : moviesFromQuery;
    const tvShows: TVShow[] = isInSearchMode ? searchTVShows_ : tvShowsFromQuery;

    // ─── Active query for current tab ────────────────────────────────────
    let activeQuery;
    if (activeTab === "movie") {
        activeQuery = useDiscover ? discoverMoviesQuery : popularMoviesQuery;
    } else {
        activeQuery = useDiscover ? discoverTVQuery : popularTVQuery;
    }
    const loading = activeQuery.isLoading;
    const isFetchingNextPage = activeQuery.isFetchingNextPage;

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
    }, [showFilterModal, translateY]);

    const user = useAuthStore((s) => s.user);

    const data = activeTab === "movie" ? movies : tvShows;
    const mediaType: MediaType = activeTab === "movie" ? "movie" : "tv";

    // Pad data array so partial last rows don't cause layout jank
    const paddedData = useMemo(() => {
        const remainder = data.length % NUM_COLUMNS;
        if (remainder === 0) return data as ReadonlyArray<Movie | TVShow | null>;
        const fillers: null[] = Array(NUM_COLUMNS - remainder).fill(null) as null[];
        return [...data, ...fillers] as ReadonlyArray<Movie | TVShow | null>;
    }, [data]);

    // ─── Fetch community votes for visible content ──────────────────────
    useEffect(() => {
        if (data.length === 0) return;
        const ids = data.map((item) => item.id);
        useVoteStore.getState().fetchVotes(ids, mediaType);
    }, [data.length, mediaType]);

    // ─── On focus: refresh user data + scroll to top ─────────────────────
    useFocusEffect(
        useCallback(() => {
            // Scroll back to top so the screen feels "fresh" on every visit.
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false });

            if (!user) return;

            const { fetchUserContent, fetchTVProgress } = useContentStore.getState();
            fetchUserContent();
            fetchTVProgress();

            const { profile } = useAuthStore.getState();
            const hasGenericUsername = profile?.username?.startsWith("user_") ?? false;
            setShowProfileBanner(hasGenericUsername);
        }, [user]),
    );

    // ─── Reset on tab change ─────────────────────────────────────────────
    useEffect(() => {
        setSearchQuery("");
        setSearchMovies([]);
        setSearchTVShows([]);
        resetFilters(false);
    }, [activeTab]);

    // ─── Filter management ───────────────────────────────────────────────

    const resetFilters = useCallback((_reload: boolean = true): void => {
        setSelectedGenre(null);
        setSelectedYear("");
        setSortBy(DEFAULT_SORT_VALUE);
        setFiltersActive(false);
    }, []);

    const applyFilters = useCallback((): void => {
        const activeFiltersExist = hasActiveFilters(selectedGenre, selectedYear, sortBy, DEFAULT_SORT_VALUE);
        setFiltersActive(activeFiltersExist);
        setShowFilterModal(false);
    }, [selectedGenre, selectedYear, sortBy]);

    useEffect(() => {
        if (filtersActive) {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
    }, [filtersActive, selectedGenre, selectedYear, sortBy]);

    const handleViewAll = useCallback((genreId: number | string | null) => {
        setSelectedGenre(genreId);
        setSelectedYear("");
        setSortBy(DEFAULT_SORT_VALUE);
        setFiltersActive(true);
    }, []);

    // Specific callback for "classics" view-all (different filter combo)
    const handleViewAllClassics = useCallback(() => {
        setSelectedGenre(null);
        setSelectedYear("2000");
        setSortBy("vote_average.desc");
        setFiltersActive(true);
    }, []);

    // ─── Search ──────────────────────────────────────────────────────────

    const handleSearch = useCallback(async (): Promise<void> => {
        if (!searchQuery.trim()) {
            setSearchMovies([]);
            setSearchTVShows([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            if (activeTab === "movie") {
                const response = await searchMovies(searchQuery);
                setSearchMovies(response.results);
            } else {
                const response = await searchTVShows(searchQuery);
                setSearchTVShows(response.results);
            }
        } catch (err) {
            console.error("[HomeScreen] Error searching:", err);
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery, activeTab]);

    const handleRefresh = useCallback(async (): Promise<void> => {
        setRefreshing(true);
        setSearchQuery("");
        setSearchMovies([]);
        setSearchTVShows([]);
        await activeQuery.refetch();
        setRefreshing(false);
    }, [activeQuery]);

    const handleClearSearch = useCallback((): void => {
        setSearchQuery("");
        setSearchMovies([]);
        setSearchTVShows([]);
    }, []);

    // ─── Content action handlers (stable — no deps) ─────────────────────

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

    // Bundle action handlers into a stable object for DiscoverHeader
    const actionHandlers: ContentActionHandlers = useMemo(() => ({
        onToggleFavorite: handleToggleFavorite,
        onToggleWatchlist: handleToggleWatchlist,
        onToggleWatched: handleToggleWatched,
        onVote: handleVote,
    }), [handleToggleFavorite, handleToggleWatchlist, handleToggleWatched, handleVote]);

    // ─── FlatList callbacks ──────────────────────────────────────────────

    const renderItem = useCallback(
        ({ item }: { item: Movie | TVShow | null }): JSX.Element => {
            if (!item) return <View style={styles.placeholderCard} />;
            return (
                <MovieCardItem
                    item={item}
                    mediaType={mediaType}
                    handleToggleFavorite={handleToggleFavorite}
                    handleToggleWatchlist={handleToggleWatchlist}
                    handleToggleWatched={handleToggleWatched}
                    handleVote={handleVote}
                />
            );
        },
        [mediaType, handleToggleFavorite, handleToggleWatchlist, handleToggleWatched, handleVote],
    );

    // ⚠️ getItemLayout REMOVED — the ListHeaderComponent has highly variable
    // height (hero carousel, conditional sections, skeletons). Providing fixed
    // offsets causes FlatList to miscalculate scroll positions on pagination,
    // producing the "jump" effect. Without it FlatList estimates layouts, which
    // is slightly slower for scrollToIndex but eliminates the offset mismatch.

    const renderFooter = useCallback((): JSX.Element | null => {
        if (!isFetchingNextPage) return null;
        return (
            <View style={styles.footerContainer}>
                <ActivityIndicator size="small" color={Colors.cinematicGold} />
            </View>
        );
    }, [isFetchingNextPage]);

    const handleEndReached = useCallback((): void => {
        if (!isSearching && activeQuery.hasNextPage && !isFetchingNextPage) {
            void activeQuery.fetchNextPage();
        }
    }, [isSearching, activeQuery, isFetchingNextPage]);

    const handleOpenFilters = useCallback((): void => setShowFilterModal(true), []);
    const handleCloseFilters = useCallback((): void => setShowFilterModal(false), []);

    // ─── Filter modal helpers ────────────────────────────────────────────

    const renderSortOption = (option: SortOption): JSX.Element => (
        <TouchableOpacity
            key={option.value}
            style={[styles.optionChip, sortBy === option.value && styles.activeOptionChip]}
            onPress={() => setSortBy(option.value)}
        >
            <Text style={[styles.optionText, sortBy === option.value && styles.activeOptionText]}>
                {t(option.translationKey)}
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

    // ─── Swipe gesture ───────────────────────────────────────────────────

    const swipeGesture = useMemo(() => {
        const tabs: MediaType[] = ["movie", "tv"];
        return Gesture.Pan()
            .runOnJS(true)
            .activeOffsetX([-50, 50])
            .failOffsetY([-15, 15])
            .onEnd((e) => {
                const { translationX, velocityX } = e;
                const currentIndex = tabs.indexOf(activeTab);
                if (translationX < -50 || velocityX < -500) {
                    if (currentIndex < tabs.length - 1) runOnJS(setActiveTab)(tabs[currentIndex + 1]);
                } else if (translationX > 50 || velocityX > 500) {
                    if (currentIndex > 0) runOnJS(setActiveTab)(tabs[currentIndex - 1]);
                }
            });
    }, [activeTab]);

    // ─── Scroll callbacks (stable refs to avoid re-renders) ──────────────

    const onScrollBeginDrag = useCallback(() => setIsScrolling(true), []);
    const onScrollEndDrag = useCallback(() => setIsScrolling(false), []);
    const onMomentumScrollEnd = useCallback(() => setIsScrolling(false), []);

    const keyExtractor = useCallback(
        (item: Movie | TVShow | null, index: number) =>
            item ? `${mediaType}-${item.id}` : `filler-${index}`,
        [mediaType],
    );

    // ─── ListHeaderComponent — memoized via DiscoverHeader ───────────────
    // We pass only primitives + stable callback refs so memo actually works.

    const listHeader = useMemo(() => (
        <DiscoverHeader
            activeTab={activeTab}
            loading={loading}
            dataLength={data.length}
            searchQuery={searchQuery}
            filtersActive={filtersActive}
            isInSearchMode={isInSearchMode}
            isSearching={isSearching}
            isScrolling={isScrolling}
            recommendations={typedRecommendations}
            forYouSettled={forYouSettled}
            actionHandlers={actionHandlers}
            onViewAll={handleViewAll}
            onViewAllClassics={handleViewAllClassics}
        />
    ), [
        activeTab, loading, data.length, searchQuery, filtersActive,
        isInSearchMode, isSearching, isScrolling, typedRecommendations, forYouSettled,
        actionHandlers, handleViewAll, handleViewAllClassics,
    ]);

    return (
        <View style={styles.safeArea}>
            <StickyHeader
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                handleClearSearch={handleClearSearch}
                filtersActive={filtersActive}
                handleOpenFilters={handleOpenFilters}
                resetFilters={resetFilters}
            />

            {showProfileBanner && (
                <View style={styles.profileBanner}>
                    <TouchableOpacity
                        style={styles.profileBannerContent}
                        onPress={() => router.push("/profile")}
                    >
                        <Ionicons name="information-circle" size={20} color={Colors.white} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.profileBannerTitle}>{t("profile.bannerTitle", "Update your username")}</Text>
                            <Text style={styles.profileBannerSubtitle}>
                                {t("profile.bannerSubtitle", "Choose a unique username so friends can find you.")}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            )}

            <GestureDetector gesture={swipeGesture}>
                <FlatList
                    ref={flatListRef}
                    key={activeTab}
                    data={paddedData}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    numColumns={NUM_COLUMNS}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.5}
                    onScrollBeginDrag={onScrollBeginDrag}
                    onScrollEndDrag={onScrollEndDrag}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    ListHeaderComponent={listHeader}
                    ListFooterComponent={renderFooter}
                    initialNumToRender={9}
                    maxToRenderPerBatch={9}
                    windowSize={5}
                    updateCellsBatchingPeriod={100}
                    removeClippedSubviews
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={Colors.vibrantRed}
                            colors={[Colors.vibrantRed]}
                        />
                    }
                />
            </GestureDetector>

            {/* ─── Filter Modal ─── */}
            <Modal
                visible={showFilterModal}
                animationType="slide"
                transparent
                onRequestClose={handleCloseFilters}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={handleCloseFilters}
                >
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
                                <Text style={styles.modalTitle}>{t("common.filter")}</Text>
                                <TouchableOpacity
                                    onPress={handleCloseFilters}
                                    style={styles.closeButtonContainer}
                                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                                >
                                    <Ionicons name="close" size={24} color={Colors.vibrantRed} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView contentContainerStyle={styles.modalContent}>
                                <Text style={styles.sectionHeader}>{t("common.sortBy")}</Text>
                                <View style={styles.optionsRow}>
                                    {SORT_OPTIONS.map(renderSortOption)}
                                </View>

                                <Text style={styles.sectionHeader}>{t("common.releaseYear")}</Text>
                                <TextInput
                                    style={styles.yearInput}
                                    placeholder={t("common.exampleYear")}
                                    placeholderTextColor={Colors.textPlaceholder}
                                    keyboardType="number-pad"
                                    value={selectedYear}
                                    onChangeText={setSelectedYear}
                                    maxLength={4}
                                />

                                <Text style={styles.sectionHeader}>{t("common.genre")}</Text>
                                <View style={styles.genresRow}>
                                    {genres.map(renderGenreChip)}
                                </View>
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                                    <Text style={styles.applyButtonText}>{t("common.applyFilters")}</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </GestureDetector>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

// ─── StickyHeader ────────────────────────────────────────────────────────────

interface StickyHeaderProps {
    readonly activeTab: MediaType;
    readonly setActiveTab: (tab: MediaType) => void;
    readonly searchQuery: string;
    readonly setSearchQuery: (q: string) => void;
    readonly handleSearch: () => void;
    readonly handleClearSearch: () => void;
    readonly filtersActive: boolean;
    readonly handleOpenFilters: () => void;
    readonly resetFilters: (reload?: boolean) => void;
}

const StickyHeader = memo(function StickyHeader({
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    handleSearch,
    handleClearSearch,
    filtersActive,
    handleOpenFilters,
    resetFilters,
}: StickyHeaderProps) {
    const { t } = useTranslation();
    return (
        <View style={styles.stickyHeader}>
            <View style={styles.headerTop}>
                <Text style={styles.discoverTitle}>{t("tabs.discover")}</Text>
                <View style={styles.pillContainer}>
                    <TouchableOpacity
                        style={[styles.pill, activeTab === "movie" && styles.activePill]}
                        onPress={() => setActiveTab("movie")}
                    >
                        <Ionicons
                            name="film-outline"
                            size={14}
                            color={activeTab === "movie" ? Colors.white : Colors.metalSilver}
                        />
                        <Text style={[styles.pillText, activeTab === "movie" && styles.activePillText]}>
                            {t("tabs.movies")}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.pill, activeTab === "tv" && styles.activePill]}
                        onPress={() => setActiveTab("tv")}
                    >
                        <Ionicons
                            name="tv-outline"
                            size={14}
                            color={activeTab === "tv" ? Colors.white : Colors.metalSilver}
                        />
                        <Text style={[styles.pillText, activeTab === "tv" && styles.activePillText]}>
                            {t("tabs.tv")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.headerSearchRow}>
                <View style={styles.searchWrapper}>
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                        <MaterialCommunityIcons name="magnify" size={20} color={Colors.metalSilver} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t("common.searchPlaceholder")}
                        placeholderTextColor={Colors.metalSilver}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
                            <Ionicons name="close-circle" size={18} color={Colors.metalSilver} />
                        </TouchableOpacity>
                    )}
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
                    <Ionicons name="trash-outline" size={14} color={Colors.vibrantRed} />
                    <Text style={styles.clearFiltersText}>{t("common.clearFilters")}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
});

// ─── DiscoverHeader ──────────────────────────────────────────────────────────
// KEY CHANGE: This component now calls TanStack Query hooks directly for its
// section data. Since TanStack Query deduplicates by queryKey, no extra network
// requests are made — it reads from the same cache the parent populated.
// This means we pass ZERO array props, so memo actually blocks re-renders.

interface DiscoverHeaderProps {
    readonly activeTab: MediaType;
    readonly loading: boolean;
    readonly dataLength: number;
    readonly searchQuery: string;
    readonly filtersActive: boolean;
    readonly isInSearchMode: boolean;
    readonly isSearching: boolean;
    readonly isScrolling: boolean;
    readonly recommendations: ReadonlyArray<ForYouRecommendation>;
    readonly forYouSettled: boolean;
    readonly actionHandlers: ContentActionHandlers;
    readonly onViewAll: (genreId: number | string | null) => void;
    readonly onViewAllClassics: () => void;
}

const DiscoverHeader = memo(function DiscoverHeader({
    activeTab,
    loading,
    dataLength,
    searchQuery,
    filtersActive,
    isInSearchMode,
    isSearching,
    isScrolling,
    recommendations,
    forYouSettled,
    actionHandlers,
    onViewAll,
    onViewAllClassics,
}: DiscoverHeaderProps) {
    const { t } = useTranslation();

    // ─── Consume TanStack Query caches directly (no extra fetches) ───────
    const newReleasesQuery = useNewReleasesContent(activeTab);
    const actionQuery = useGenreContent(activeTab, activeTab === "movie" ? "28" : "10759", "action");
    const horrorQuery = useGenreContent(activeTab, activeTab === "movie" ? "27,53" : "9648,10765", "horror");
    const popularMoviesQuery = usePopularMovies();
    const popularTVQuery = usePopularTVShows();

    // Only needed when activeTab === "movie"
    const classicQuery = useClassicMovies();

    const newReleases = useMemo(() => flattenPages(newReleasesQuery.data), [newReleasesQuery.data]);
    const actionContent = useMemo(() => flattenPages(actionQuery.data), [actionQuery.data]);
    const horrorContent = useMemo(() => flattenPages(horrorQuery.data), [horrorQuery.data]);
    const popularMovies = useMemo(() => flattenPages(popularMoviesQuery.data), [popularMoviesQuery.data]);
    const popularTV = useMemo(() => flattenPages(popularTVQuery.data), [popularTVQuery.data]);
    const classicMovies = useMemo(() => flattenPages(classicQuery.data), [classicQuery.data]);

    const popularContent = activeTab === "movie" ? popularMovies : popularTV;

    const filteredRecommendationsData = useMemo(() => {
        const filtered = recommendations.filter((rec) => rec.mediaType === activeTab);
        const allItems = filtered.flatMap((rec) => rec.items);
        return allItems.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));
    }, [recommendations, activeTab]);

    // ─── heroReady: all key data has at least one page loaded ───────────
    // We wait for the hero (new releases), popular content, AND for personalizado
    // to have settled (fetch completed, success or failure). This ensures all
    // sections — including Personalizado — paint in a single pass. Without this,
    // Personalizado pops in after the other sections causing a visible layout shift.
    const heroReady = newReleasesQuery.isSuccess && newReleases.length > 0 && popularContent.length > 0 && forYouSettled;

    // Stable view-all callbacks for genre sections
    const handleViewAllAction = useCallback(
        () => onViewAll(activeTab === "movie" ? "28" : "10759"),
        [activeTab, onViewAll],
    );
    const handleViewAllHorror = useCallback(
        () => onViewAll(activeTab === "movie" ? "27,53" : "9648,10765"),
        [activeTab, onViewAll],
    );
    const handleViewAllPopular = useCallback(
        () => onViewAll(null),
        [onViewAll],
    );

    // ─── Conditional rendering ───────────────────────────────────────────

    if (loading && dataLength === 0) {
        return (
            <View style={styles.discoverHeader}>
                <View style={styles.centerContainer}>
                    <HomeSkeleton />
                </View>
            </View>
        );
    }

    if (isSearching) {
        return (
            <View style={styles.discoverHeader}>
                <View style={{ flex: 1, paddingTop: 16 }}>
                    <GridSkeleton rows={3} />
                </View>
            </View>
        );
    }

    if (dataLength === 0 && (searchQuery.length > 0 || filtersActive)) {
        return (
            <View style={styles.discoverHeader}>
                <View style={styles.centerContainer}>
                    <Image
                        source={require("../../assets/icons/not-found.png")}
                        style={styles.emptyIcon}
                        contentFit="contain"
                    />
                    <Text style={styles.emptyText}>{t("common.noResults")}</Text>
                </View>
            </View>
        );
    }

    if (isInSearchMode || filtersActive) {
        return <View style={styles.discoverHeader} />;
    }

    // While hero data is loading, show the HomeSkeleton so the grid below
    // doesn't jump upward when the hero finally arrives.
    if (!heroReady) {
        return (
            <View style={styles.discoverHeader}>
                <View style={styles.centerContainer}>
                    <HomeSkeleton />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.discoverHeader}>
            <Animated.View
                entering={FadeInDown.duration(400)}
                exiting={FadeOutUp.duration(300)}
                layout={LinearTransition}
                style={{ width: "100%" }}
            >
                <HeroCarousel
                    data={newReleases}
                    mediaType={activeTab}
                    isScrolling={isScrolling}
                />

                {filteredRecommendationsData.length > 0 && (
                    <HomeSection
                        title={t("home.forYouCategory.custom")}
                        icon="sparkles"
                        data={filteredRecommendationsData}
                        mediaType={activeTab}
                        onViewAll={handleViewAllPopular}
                        {...actionHandlers}
                    />
                )}

                <HomeSection
                    title={activeTab === "movie" ? t("home.popularMovies") : t("home.popularTV")}
                    icon="trending-up"
                    data={popularContent}
                    mediaType={activeTab}
                    onViewAll={handleViewAllPopular}
                    {...actionHandlers}
                />

                {actionContent.length > 0 && (
                    <HomeSection
                        title={t("common.action")}
                        icon="flash"
                        data={actionContent}
                        mediaType={activeTab}
                        onViewAll={handleViewAllAction}
                        {...actionHandlers}
                    />
                )}

                {horrorContent.length > 0 && (
                    <HomeSection
                        title={t("common.horror")}
                        icon="skull"
                        data={horrorContent}
                        mediaType={activeTab}
                        onViewAll={handleViewAllHorror}
                        {...actionHandlers}
                    />
                )}

                {activeTab === "movie" && classicMovies.length > 0 && (
                    <HomeSection
                        title={t("home.classicTitle")}
                        icon="film-outline"
                        data={classicMovies}
                        mediaType="movie"
                        onViewAll={onViewAllClassics}
                        {...actionHandlers}
                    />
                )}

                <View style={styles.browseAllSection}>
                    <Ionicons name="apps-outline" size={20} color={Colors.vibrantRed} />
                    <Text style={styles.browseAllTitle}>{t("common.browseAll")}</Text>
                </View>
            </Animated.View>
        </View>
    );
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
    stickyHeader: {
        backgroundColor: Colors.metalBlack,
        paddingTop: 16,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    discoverTitle: {
        fontSize: 28,
        fontFamily: Fonts.bebas,
        color: Colors.white,
        letterSpacing: 1,
    },
    pillContainer: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        borderRadius: 20,
        padding: 2,
        gap: 2,
    },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 18,
        gap: 6,
    },
    activePill: {
        backgroundColor: Colors.vibrantRed,
    },
    pillText: {
        fontSize: 12,
        fontFamily: Fonts.interSemiBold,
        color: Colors.metalSilver,
    },
    activePillText: {
        color: Colors.white,
    },
    headerSearchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    searchWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.metalGray,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: Colors.panelBorder,
    },
    searchButton: {
        padding: 4,
    },
    searchInput: {
        flex: 1,
        color: Colors.white,
        fontSize: 14,
        fontFamily: Fonts.inter,
        marginLeft: 8,
    },
    clearButton: {
        padding: 4,
    },
    filterButtonCompact: {
        width: 44,
        height: 44,
        backgroundColor: Colors.metalGray,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: Colors.panelBorder,
    },
    activeFilterButton: {
        backgroundColor: Colors.vibrantRed,
        borderColor: Colors.vibrantRed,
    },
    clearFiltersContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    clearFiltersText: {
        color: Colors.vibrantRed,
        fontSize: 12,
        fontFamily: Fonts.interSemiBold,
    },
    browseAllSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
    },
    browseAllTitle: {
        fontSize: 20,
        fontFamily: Fonts.bebas,
        color: Colors.white,
        letterSpacing: 0.5,
    },
    discoverHeader: {
        paddingTop: 8,
    },
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
    },
    emptyIcon: {
        width: 200,
        height: 200,
        opacity: 0.8,
        marginBottom: 16,
    },
    emptyText: {
        color: Colors.metalSilver,
        fontSize: 16,
        fontFamily: Fonts.inter,
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
    placeholderCard: {
        width: "30%",
        marginBottom: 16,
    },
    profileBanner: {
        backgroundColor: Colors.vibrantRed,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        overflow: "hidden",
    },
    profileBannerContent: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
    },
    profileBannerTitle: {
        color: Colors.white,
        fontSize: 14,
        fontFamily: Fonts.interSemiBold,
    },
    profileBannerSubtitle: {
        color: Colors.white,
        fontSize: 12,
        fontFamily: Fonts.inter,
        opacity: 0.9,
        marginTop: 2,
    },
    // ─── Filter Modal ────────────────────────────────────────────────────
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.overlayDarker,
        justifyContent: "flex-end",
    },
    filterPanel: {
        backgroundColor: Colors.panelBackground,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: Colors.panelBorder,
        overflow: "hidden",
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        maxHeight: SCREEN_HEIGHT * 0.9,
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
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 2,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    modalTitle: {
        color: Colors.white,
        fontSize: 24,
        fontFamily: Fonts.bebas,
        letterSpacing: 1,
    },
    closeButtonContainer: {
        padding: 4,
    },
    modalContent: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    sectionHeader: {
        color: Colors.metalSilver,
        fontSize: 14,
        fontFamily: Fonts.bebas,
        letterSpacing: 1.5,
        textTransform: "uppercase",
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
        borderRadius: 8,
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.panelBorder,
    },
    activeOptionChip: {
        backgroundColor: Colors.vibrantRed,
        borderColor: Colors.vibrantRed,
    },
    optionText: {
        color: Colors.metalSilver,
        fontSize: 13,
        fontFamily: Fonts.interMedium,
    },
    activeOptionText: {
        color: Colors.white,
    },
    yearInput: {
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.panelBorder,
        borderRadius: 8,
        padding: 12,
        color: Colors.white,
        fontSize: 16,
        fontFamily: Fonts.inter,
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
        borderColor: Colors.panelBorder,
    },
    activeGenreChip: {
        backgroundColor: Colors.vibrantRed,
        borderColor: Colors.vibrantRed,
    },
    genreChipText: {
        color: Colors.metalSilver,
        fontSize: 12,
        fontFamily: Fonts.interMedium,
    },
    activeGenreText: {
        color: Colors.white,
    },
    modalFooter: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
        backgroundColor: Colors.panelBackground,
        borderTopWidth: 1,
        borderTopColor: Colors.panelBorder,
    },
    applyButton: {
        backgroundColor: Colors.vibrantRed,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        shadowColor: Colors.vibrantRed,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    applyButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontFamily: Fonts.bebas,
        letterSpacing: 1.5,
    },
});