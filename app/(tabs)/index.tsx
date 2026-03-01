import React, { useState, useEffect, useCallback, JSX, memo, useMemo } from "react";

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
    Dimensions,
} from "react-native";
import { Image } from "expo-image";
import {
    MaterialCommunityIcons,
    Feather,
    Entypo,
    Ionicons,
} from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
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
    processGenreName,
    sortGenresAlphabetically,
    isNotNull,
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
    useCuratedTVShows,
    useClassicMovies,
    useCuratedMovies,
    flattenPages,
} from "../../src/hooks/useHomeContent";
import { HeroCarousel } from "../../src/components/home/HeroCarousel";
import { HomeSection } from "../../src/components/home/HomeSection";


const { height } = Dimensions.get("window");

interface MovieCardItemProps {
    item: Movie | TVShow;
    mediaType: MediaType;
    handleToggleFavorite: (id: number, type: MediaType) => Promise<void>;
    handleToggleWatchlist: (id: number, type: MediaType) => Promise<void>;
    handleToggleWatched: (id: number, type: MediaType) => Promise<void>;
    handleVote: (id: number, type: MediaType, vote: number) => Promise<void>;
    fullWidth?: boolean;
}

const MovieCardItem = memo(({
    item,
    mediaType,
    handleToggleFavorite,
    handleToggleWatchlist,
    handleToggleWatched,
    handleVote,
    fullWidth
}: MovieCardItemProps) => {


    const isFavorite = useContentStore(s => s.isFavorite(item.id, mediaType));
    const inWatchlist = useContentStore(s => s.isInWatchlist(item.id, mediaType));
    const isWatched = useContentStore(s => s.isWatched(item.id, mediaType));

    const communityRating = useVoteStore(s => s.getCommunityScore(item.id, mediaType)?.avg);
    const userVote = useVoteStore(s => s.getUserVote(item.id, mediaType));

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

export default function HomeScreen(): JSX.Element {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<MediaType>("movie");
    const [selectedCategory, setSelectedCategory] = useState<"custom" | "curated" | "classic">("custom");


    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);


    const [refreshing, setRefreshing] = useState(false);
    const [showProfileBanner, setShowProfileBanner] = useState(false);


    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState("");
    const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
    const [filtersActive, setFiltersActive] = useState(false);





    const {
        recommendations,
    } = useForYouContent("foryou");

    // ─── Build discover params when filters are active ───────────────────────
    const discoverParams = useMemo(() => buildDiscoverParams({
        currentPage: 1,
        sortBy,
        selectedGenre,
        selectedYear,
        activeTab: activeTab === "movie" ? "movies" : "tv",
    }), [sortBy, selectedGenre, selectedYear, activeTab]);

    const useDiscover = useMemo(() => filtersActive || sortBy !== DEFAULT_SORT_VALUE, [filtersActive, sortBy]);

    // ─── Browse content via TanStack Query ───────────────────────────────────
    const popularMoviesQuery = usePopularMovies();
    const popularTVQuery = usePopularTVShows();
    const discoverMoviesQuery = useDiscoverMovies(discoverParams, useDiscover && activeTab === "movie");
    const discoverTVQuery = useDiscoverTVShows(discoverParams, useDiscover && activeTab === "tv");

    // ─── Genre queries (auto-cached, no effect needed) ────────────────────────
    const movieGenresQuery = useMovieGenres();
    const tvGenresQuery = useTVGenres();
    // Derive processed genres from whichever query matches the active tab
    const genres = useMemo(() => {
        const rawGenres = activeTab === "tv" ? (tvGenresQuery.data ?? []) : (movieGenresQuery.data ?? []);
        return sortGenresAlphabetically(
            rawGenres.map((g) => ({ ...g, name: processGenreName(g.name) }))
        );
    }, [activeTab, movieGenresQuery.data, tvGenresQuery.data]);

    // ─── Derive data arrays ───────────────────────────────────────────────────
    const moviesFromQuery = useMemo(() => useDiscover
        ? flattenPages(discoverMoviesQuery.data)
        : flattenPages(popularMoviesQuery.data), [useDiscover, discoverMoviesQuery.data, popularMoviesQuery.data]);

    const tvShowsFromQuery = useMemo(() => useDiscover
        ? flattenPages(discoverTVQuery.data)
        : flattenPages(popularTVQuery.data), [useDiscover, discoverTVQuery.data, popularTVQuery.data]);

    // Local state for search overrides (search results aren't cached)
    const [searchMovies_, setSearchMovies] = useState<Movie[]>([]);
    const [searchTVShows_, setSearchTVShows] = useState<TVShow[]>([]);
    const isInSearchMode = isSearching || (searchQuery.trim().length > 0 && (searchMovies_.length > 0 || searchTVShows_.length > 0));

    const movies: Movie[] = isInSearchMode ? searchMovies_ : moviesFromQuery;
    const tvShows: TVShow[] = isInSearchMode ? searchTVShows_ : tvShowsFromQuery;

    // ─── Active query for current tab ────────────────────────────────────────
    const activeQuery = activeTab === "movie"
        ? (useDiscover ? discoverMoviesQuery : popularMoviesQuery)
        : (useDiscover ? discoverTVQuery : popularTVQuery);
    const loading = activeQuery.isLoading;
    const isFetchingNextPage = activeQuery.isFetchingNextPage;

    // ─── ForYou subcategory queries ───────────────────────────────────────
    const curatedTVQuery = useCuratedTVShows();
    const curatedMovieQuery = useCuratedMovies();
    const classicQuery = useClassicMovies();

    const curatedShows = useMemo(() => flattenPages(curatedTVQuery.data), [curatedTVQuery.data]);
    const curatedMovies = useMemo(() => flattenPages(curatedMovieQuery.data), [curatedMovieQuery.data]);
    const classicMovies_ = useMemo(() => flattenPages(classicQuery.data), [classicQuery.data]);

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


    const user = useAuthStore((s) => s.user);
    const tvProgress = useContentStore((s) => s.tvProgress);
    const getNextEpisodeToWatch = useContentStore((s) => s.getNextEpisodeToWatch);


    const data = activeTab === "movie" ? movies : tvShows;
    const mediaType: MediaType = activeTab === "movie" ? "movie" : "tv";



    useEffect(() => {
        if (data.length === 0) return;
        const ids = data.map((item) => item.id);
        useVoteStore.getState().fetchVotes(ids, mediaType);
    }, [data.length, mediaType]);


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





    useEffect(() => {
        setSearchQuery("");
        setSearchMovies([]);
        setSearchTVShows([]);
        resetFilters(false);
    }, [activeTab]);



    const resetFilters = useCallback((reload: boolean = true): void => {
        setSelectedGenre(null);
        setSelectedYear("");
        setSortBy(DEFAULT_SORT_VALUE);
        setFiltersActive(false);
    }, []);

    const applyFilters = useCallback((): void => {
        const activeFiltersExist = hasActiveFilters(
            selectedGenre,
            selectedYear,
            sortBy,
            DEFAULT_SORT_VALUE,
        );

        setFiltersActive(activeFiltersExist);
        setShowFilterModal(false);
    }, [selectedGenre, selectedYear, sortBy]);

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

    const renderItem = useCallback(
        (renderProps: { item: Movie | TVShow }): JSX.Element => (
            <MovieCardItem
                item={renderProps.item}
                mediaType={mediaType}
                handleToggleFavorite={handleToggleFavorite}
                handleToggleWatchlist={handleToggleWatchlist}
                handleToggleWatched={handleToggleWatched}
                handleVote={handleVote}
            />
        ),
        [mediaType, handleToggleFavorite, handleToggleWatchlist, handleToggleWatched, handleVote],
    );

    const renderFooter = useCallback((): JSX.Element | null => {
        if (!isFetchingNextPage) return null;

        return (
            <View style={styles.footerContainer}>
                <ActivityIndicator size="small" color={Colors.cinematicGold} />
            </View>
        );
    }, [loading, data.length]);



    const handleEndReached = useCallback((): void => {
        if (!isSearching && activeQuery.hasNextPage && !isFetchingNextPage) {
            void activeQuery.fetchNextPage();
        }
    }, [isSearching, activeQuery, isFetchingNextPage]);

    const handleDismissBanner = useCallback((): void => {
        setShowProfileBanner(false);
    }, []);



    const handleOpenFilters = useCallback((): void => {
        setShowFilterModal(true);
    }, []);

    const handleCloseFilters = useCallback((): void => {
        setShowFilterModal(false);
    }, []);







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

    // The legacy renderForYouContent and renderMainContent are no longer used
    // as we integrated everything into the main FlatList and ListHeaderComponent.







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

    return (
        <View style={styles.safeArea}>
            <GestureDetector gesture={swipeGesture}>
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    keyExtractor={(item) => `${mediaType}-${item.id}`}
                    numColumns={3}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.5}
                    ListHeaderComponent={<DiscoverHeader
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        recommendations={recommendations}
                        loading={loading}
                        data={data}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        handleSearch={handleSearch}
                        handleClearSearch={handleClearSearch}
                        filtersActive={filtersActive}
                        handleOpenFilters={handleOpenFilters}
                        resetFilters={resetFilters}
                        isInSearchMode={isInSearchMode}
                        curatedMovies={curatedMovies}
                        curatedShows={curatedShows}
                        classicMovies_={classicMovies_}
                        handleToggleFavorite={handleToggleFavorite}
                        handleToggleWatchlist={handleToggleWatchlist}
                        handleToggleWatched={handleToggleWatched}
                        handleVote={handleVote}
                        moviesFromQuery={moviesFromQuery}
                        tvShowsFromQuery={tvShowsFromQuery}
                    />}
                    ListFooterComponent={renderFooter}
                    initialNumToRender={12}
                    maxToRenderPerBatch={6}
                    windowSize={3}
                    updateCellsBatchingPeriod={50}
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
                                    <Ionicons name="close" size={24} color={Colors.cinematicGold} />
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

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    discoverHeader: {
        paddingTop: 16,
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
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
    },
    loadingText: {
        color: Colors.metalSilver,
        marginTop: 16,
        fontFamily: Fonts.inter,
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
        maxHeight: height * 0.9,
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
    categoryFilterWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.metalBlack,
        marginTop: 12,
    },
    categoryFilterContainer: {
        flexDirection: "row",
        backgroundColor: "transparent",
        borderRadius: 9999,
    },
    categoryTab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 9999,
        alignItems: "center",
    },
    activeCategoryTab: {
        backgroundColor: Colors.vibrantRed,
    },
    categoryTabText: {
        fontWeight: "bold",
        fontSize: 13,
        color: Colors.metalSilver,
    },
    activeCategoryTabText: {
        color: Colors.white,
    },
    continueSection: {
        paddingVertical: 8,
    },
    recommendationGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        paddingHorizontal: 16,
    },
    recommendationGridItem: {
        width: (Dimensions.get("window").width - 44) / 3,
    },
});

// ─── DiscoverHeader Component ────────────────────────────────────────────────
interface DiscoverHeaderProps {
    activeTab: MediaType;
    setActiveTab: (tab: MediaType) => void;
    recommendations: any[];
    loading: boolean;
    data: any[];
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    handleSearch: () => void;
    handleClearSearch: () => void;
    filtersActive: boolean;
    handleOpenFilters: () => void;
    resetFilters: (reload?: boolean) => void;
    isInSearchMode: boolean;
    curatedMovies: Movie[];
    curatedShows: TVShow[];
    classicMovies_: Movie[];
    handleToggleFavorite: any;
    handleToggleWatchlist: any;
    handleToggleWatched: any;
    handleVote: any;
    moviesFromQuery: Movie[];
    tvShowsFromQuery: TVShow[];
}

const DiscoverHeader = memo(({
    activeTab,
    setActiveTab,
    recommendations,
    loading,
    data,
    searchQuery,
    setSearchQuery,
    handleSearch,
    handleClearSearch,
    filtersActive,
    handleOpenFilters,
    resetFilters,
    isInSearchMode,
    curatedMovies,
    curatedShows,
    classicMovies_,
    handleToggleFavorite,
    handleToggleWatchlist,
    handleToggleWatched,
    handleVote,
    moviesFromQuery,
    tvShowsFromQuery,
}: DiscoverHeaderProps) => {
    const { t } = useTranslation();

    // Filter recommendations based on active media type
    const filteredRecommendations = useMemo(() =>
        recommendations.filter(rec => rec.mediaType === activeTab),
        [recommendations, activeTab]
    );

    return (
        <View style={styles.discoverHeader}>
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
                    <Text style={styles.clearFiltersText}>{t("common.clearFilters")}</Text>
                </TouchableOpacity>
            )}

            {loading && data.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.vibrantRed} />
                    <Text style={styles.loadingText}>{t("common.loadingContent")}</Text>
                </View>
            ) : data.length === 0 && searchQuery.length > 0 ? (
                <View style={styles.centerContainer}>
                    <Image
                        source={require("../../assets/icons/not-found.png")}
                        style={styles.emptyIcon as any}
                        contentFit="contain"
                    />
                    <Text style={styles.emptyText}>{t("common.noResults")}</Text>
                </View>
            ) : !isInSearchMode && (
                <>
                    <HeroCarousel
                        data={activeTab === "movie" ? curatedMovies : curatedShows}
                        mediaType={activeTab}
                    />

                    {filteredRecommendations.length > 0 && (
                        <HomeSection
                            title={t("home.forYouCategory.custom")}
                            icon="sparkles"
                            data={filteredRecommendations[0].items}
                            mediaType={activeTab}
                            renderItem={({ item }) => (
                                <View style={styles.recommendationGridItem}>
                                    <MovieCardItem
                                        item={item}
                                        mediaType={activeTab}
                                        handleToggleFavorite={handleToggleFavorite}
                                        handleToggleWatchlist={handleToggleWatchlist}
                                        handleToggleWatched={handleToggleWatched}
                                        handleVote={handleVote}
                                        fullWidth
                                    />
                                </View>
                            )}
                        />
                    )}

                    <HomeSection
                        title={activeTab === "movie" ? t("home.curatedMoviesTitle") : t("home.curatedTVTitle")}
                        icon="trophy-outline"
                        data={activeTab === "movie" ? curatedMovies : curatedShows}
                        mediaType={activeTab}
                        renderItem={({ item }) => (
                            <View style={styles.recommendationGridItem}>
                                <MovieCardItem
                                    item={item}
                                    mediaType={activeTab}
                                    handleToggleFavorite={handleToggleFavorite}
                                    handleToggleWatchlist={handleToggleWatchlist}
                                    handleToggleWatched={handleToggleWatched}
                                    handleVote={handleVote}
                                    fullWidth
                                />
                            </View>
                        )}
                    />

                    {activeTab === "movie" && classicMovies_.length > 0 && (
                        <HomeSection
                            title={t("home.classicTitle")}
                            icon="film-outline"
                            data={classicMovies_}
                            mediaType="movie"
                            renderItem={({ item }) => (
                                <View style={styles.recommendationGridItem}>
                                    <MovieCardItem
                                        item={item}
                                        mediaType="movie"
                                        handleToggleFavorite={handleToggleFavorite}
                                        handleToggleWatchlist={handleToggleWatchlist}
                                        handleToggleWatched={handleToggleWatched}
                                        handleVote={handleVote}
                                        fullWidth
                                    />
                                </View>
                            )}
                        />
                    )}

                    <HomeSection
                        title={activeTab === "movie" ? t("home.popularMovies") : t("home.popularTV")}
                        icon="trending-up"
                        data={activeTab === "movie" ? moviesFromQuery : tvShowsFromQuery}
                        mediaType={activeTab}
                        renderItem={({ item }) => (
                            <View style={styles.recommendationGridItem}>
                                <MovieCardItem
                                    item={item}
                                    mediaType={activeTab}
                                    handleToggleFavorite={handleToggleFavorite}
                                    handleToggleWatchlist={handleToggleWatchlist}
                                    handleToggleWatched={handleToggleWatched}
                                    handleVote={handleVote}
                                    fullWidth
                                />
                            </View>
                        )}
                    />

                    <View style={styles.browseAllSection}>
                        <Ionicons name="apps-outline" size={20} color={Colors.vibrantRed} />
                        <Text style={styles.browseAllTitle}>{t("common.browseAll")}</Text>
                    </View>
                </>
            )}
        </View>
    );
});
