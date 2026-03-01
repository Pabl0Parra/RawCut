import React, { useState, useEffect, useCallback, JSX, memo } from "react";

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


const MAX_CONTINUE_WATCHING_ITEMS = 10;
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
    const [activeTab, setActiveTab] = useState<ContentTab>("movies");
    const [selectedCategory, setSelectedCategory] = useState<"custom" | "curated" | "classic">("custom");


    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);


    const [refreshing, setRefreshing] = useState(false);
    const [showProfileBanner, setShowProfileBanner] = useState(false);
    const [showContinueSection, setShowContinueSection] = useState(true);


    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [selectedYear, setSelectedYear] = useState("");
    const [sortBy, setSortBy] = useState<string>(DEFAULT_SORT_VALUE);
    const [filtersActive, setFiltersActive] = useState(false);


    const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
    const [loadingContinue, setLoadingContinue] = useState(false);


    const {
        recommendations,
        loadingForYou,
    } = useForYouContent(activeTab);

    // ─── Build discover params when filters are active ───────────────────────
    const discoverParams = buildDiscoverParams({
        currentPage: 1,
        sortBy,
        selectedGenre,
        selectedYear,
        activeTab: activeTab === "foryou" ? "movies" : activeTab,
    });
    const useDiscover = filtersActive || sortBy !== DEFAULT_SORT_VALUE;

    // ─── Browse content via TanStack Query ───────────────────────────────────
    const popularMoviesQuery = usePopularMovies();
    const popularTVQuery = usePopularTVShows();
    const discoverMoviesQuery = useDiscoverMovies(discoverParams, useDiscover && activeTab === "movies");
    const discoverTVQuery = useDiscoverTVShows(discoverParams, useDiscover && activeTab === "tv");

    // ─── Genre queries (auto-cached, no effect needed) ────────────────────────
    const movieGenresQuery = useMovieGenres();
    const tvGenresQuery = useTVGenres();
    // Derive processed genres from whichever query matches the active tab
    const rawGenres = activeTab === "tv" ? (tvGenresQuery.data ?? []) : (movieGenresQuery.data ?? []);
    const genres = sortGenresAlphabetically(
        rawGenres.map((g) => ({ ...g, name: processGenreName(g.name) }))
    );

    // ─── Derive data arrays ───────────────────────────────────────────────────
    const moviesFromQuery = useDiscover
        ? flattenPages(discoverMoviesQuery.data)
        : flattenPages(popularMoviesQuery.data);
    const tvShowsFromQuery = useDiscover
        ? flattenPages(discoverTVQuery.data)
        : flattenPages(popularTVQuery.data);

    // Local state for search overrides (search results aren't cached)
    const [searchMovies_, setSearchMovies] = useState<Movie[]>([]);
    const [searchTVShows_, setSearchTVShows] = useState<TVShow[]>([]);
    const isInSearchMode = isSearching || (searchQuery.trim().length > 0 && (searchMovies_.length > 0 || searchTVShows_.length > 0));

    const movies: Movie[] = isInSearchMode ? searchMovies_ : moviesFromQuery;
    const tvShows: TVShow[] = isInSearchMode ? searchTVShows_ : tvShowsFromQuery;

    // ─── Active query for current tab ────────────────────────────────────────
    const activeQuery = activeTab === "movies"
        ? (useDiscover ? discoverMoviesQuery : popularMoviesQuery)
        : (useDiscover ? discoverTVQuery : popularTVQuery);
    const loading = activeQuery.isLoading;
    const isFetchingNextPage = activeQuery.isFetchingNextPage;

    // ─── ForYou subcategory queries ───────────────────────────────────────
    const curatedTVQuery = useCuratedTVShows();
    const curatedMovieQuery = useCuratedMovies();
    const classicQuery = useClassicMovies();
    const curatedShows = flattenPages(curatedTVQuery.data);
    const curatedMovies = flattenPages(curatedMovieQuery.data);
    const classicMovies_ = flattenPages(classicQuery.data);

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


    const data = activeTab === "movies" ? movies : tvShows;
    const mediaType: MediaType = activeTab === "movies" ? "movie" : "tv";



    useEffect(() => {
        if (data.length === 0) return;
        const ids = data.map((item) => item.id);
        useVoteStore.getState().fetchVotes(ids, mediaType);
    }, [data, mediaType]);


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
        if (activeTab === "foryou" && user && tvProgress.length > 0) {
            loadContinueWatching();
        } else {
            setContinueWatching([]);
        }
    }, [activeTab, tvProgress.length, user]);


    useEffect(() => {
        setSearchQuery("");
        setSearchMovies([]);
        setSearchTVShows([]);
        resetFilters(false);
    }, [activeTab]);

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
            if (activeTab === "movies") {
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
                <ActivityIndicator size="small" color={Colors.bloodRed} />
            </View>
        );
    }, [loading, data.length]);

    const renderContinueWatchingItem = useCallback(
        (renderProps: { item: ContinueWatchingItem }): JSX.Element => {
            const { item } = renderProps;
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
        if (!isSearching && activeQuery.hasNextPage && !isFetchingNextPage) {
            void activeQuery.fetchNextPage();
        }
    }, [isSearching, activeQuery, isFetchingNextPage]);

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





    const renderContinueWatching = (): JSX.Element | null => {
        if (!showContinueSection) return null;

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
                    <Text style={styles.continueTitle}>{t("home.continueWatching")}</Text>
                    <TouchableOpacity onPress={handleDismissContinue}>
                        <Ionicons name="close-circle" size={24} color={Colors.metalSilver} />
                    </TouchableOpacity>
                </View>
                <View style={styles.continueListVertical}>
                    {continueWatching.map(item => (
                        <React.Fragment key={String(item.show.id)}>
                            {renderContinueWatchingItem({ item })}
                        </React.Fragment>
                    ))}
                </View>
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

    const renderForYouContent = (): JSX.Element | null => {
        if (activeTab !== "foryou") return null;

        const CATEGORIES = [
            { key: "custom" as const, label: t("home.forYouCategory.custom") },
            { key: "curated" as const, label: t("home.forYouCategory.curated") },
            { key: "classic" as const, label: t("home.forYouCategory.classic") },
        ];

        // ── Loading state per category ──────────────────────────────────────
        const isLoadingCurrent =
            (selectedCategory === "custom" && loadingForYou && recommendations.length === 0) ||
            (selectedCategory === "curated" && (curatedTVQuery.isLoading || curatedMovieQuery.isLoading)) ||
            (selectedCategory === "classic" && classicQuery.isLoading);

        return (
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                stickyHeaderIndices={[0]}
            >
                {/* ── Category pill selector ── */}
                <View style={styles.categoryFilterWrapper}>
                    <View style={styles.categoryFilterContainer}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.key}
                                style={[
                                    styles.categoryTab,
                                    selectedCategory === cat.key && styles.activeCategoryTab,
                                ]}
                                onPress={() => setSelectedCategory(cat.key)}
                                activeOpacity={0.75}
                            >
                                <Text
                                    style={[
                                        styles.categoryTabText,
                                        selectedCategory === cat.key && styles.activeCategoryTabText,
                                    ]}
                                >
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Loading spinner ── */}
                {isLoadingCurrent && (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={Colors.bloodRed} />
                    </View>
                )}

                {/* ── Custom: personalised recommendations ── */}
                {!isLoadingCurrent && selectedCategory === "custom" && (
                    <>
                        {renderContinueWatching()}
                        {recommendations.map((rec) => (
                            <View key={rec.id} style={styles.continueSection}>
                                <View style={styles.continueHeader}>
                                    <Text style={styles.continueTitle}>{rec.title}</Text>
                                </View>
                                <View style={styles.recommendationGrid}>
                                    {rec.items.slice(0, 6).map(item => (
                                        <View key={`${rec.id}-${item.id}`} style={styles.recommendationGridItem}>
                                            <MovieCardItem
                                                item={item}
                                                mediaType={rec.mediaType}
                                                handleToggleFavorite={handleToggleFavorite}
                                                handleToggleWatchlist={handleToggleWatchlist}
                                                handleToggleWatched={handleToggleWatched}
                                                handleVote={handleVote}
                                                fullWidth={true}
                                            />
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {/* ── Curated: best-rated TV shows & Movies ── */}
                {!isLoadingCurrent && selectedCategory === "curated" && (
                    <>
                        <View style={styles.continueSection}>
                            <View style={styles.continueHeader}>
                                <Text style={styles.continueTitle}>{t("home.curatedTVTitle")}</Text>
                            </View>
                            <View style={styles.recommendationGrid}>
                                {curatedShows.slice(0, 50).map(item => (
                                    <View key={`curated-tv-${item.id}`} style={styles.recommendationGridItem}>
                                        <MovieCardItem
                                            item={item}
                                            mediaType="tv"
                                            handleToggleFavorite={handleToggleFavorite}
                                            handleToggleWatchlist={handleToggleWatchlist}
                                            handleToggleWatched={handleToggleWatched}
                                            handleVote={handleVote}
                                            fullWidth={true}
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.continueSection}>
                            <View style={styles.continueHeader}>
                                <Text style={styles.continueTitle}>{t("home.curatedMoviesTitle")}</Text>
                            </View>
                            <View style={styles.recommendationGrid}>
                                {curatedMovies.slice(0, 50).map(item => (
                                    <View key={`curated-movie-${item.id}`} style={styles.recommendationGridItem}>
                                        <MovieCardItem
                                            item={item}
                                            mediaType="movie"
                                            handleToggleFavorite={handleToggleFavorite}
                                            handleToggleWatchlist={handleToggleWatchlist}
                                            handleToggleWatched={handleToggleWatched}
                                            handleVote={handleVote}
                                            fullWidth={true}
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                {/* ── Classic: pre-2000 rated movies ── */}
                {!isLoadingCurrent && selectedCategory === "classic" && (
                    <View style={styles.continueSection}>
                        <View style={styles.continueHeader}>
                            <Text style={styles.continueTitle}>{t("home.classicTitle")}</Text>
                        </View>
                        <View style={styles.recommendationGrid}>
                            {classicMovies_.slice(0, 50).map(item => (
                                <View key={`classic-${item.id}`} style={styles.recommendationGridItem}>
                                    <MovieCardItem
                                        item={item}
                                        mediaType="movie"
                                        handleToggleFavorite={handleToggleFavorite}
                                        handleToggleWatchlist={handleToggleWatchlist}
                                        handleToggleWatched={handleToggleWatched}
                                        handleVote={handleVote}
                                        fullWidth={true}
                                    />
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        );
    };

    const renderMainContent = (): JSX.Element => {
        if (loading && data.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.bloodRed} />
                    <Text style={styles.loadingText}>{t("common.loadingContent")}</Text>
                </View>
            );
        }

        if (data.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <Image
                        source={require("../../assets/icons/not-found.png")}
                        style={styles.emptyIcon as any}
                        contentFit="contain"
                    />
                    <Text style={styles.emptyText}>{t("common.noResults")}</Text>
                </View>
            );
        }

        return (
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
                        tintColor={Colors.bloodRed}
                        colors={[Colors.bloodRed]}
                    />
                }
            />
        );
    };






    const tabs: ContentTab[] = ["foryou", "movies", "tv"];
    const swipeGesture = Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-20, 20])
        .failOffsetY([-15, 15])
        .onEnd((e) => {
            const { translationX, velocityX } = e;
            const currentIndex = tabs.indexOf(activeTab);
            if (translationX < -50 || velocityX < -500) {
                if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
            } else if (translationX > 50 || velocityX > 500) {
                if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
            }
        });

    return (
        <GestureDetector gesture={swipeGesture}>
            <View style={[styles.safeArea, styles.safeAreaPadding]}>
                { }
                <View style={styles.tabsContainer}>
                    <View style={styles.tabsWrapper}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "foryou" ? styles.activeTab : styles.inactiveTab]}
                            onPress={() => setActiveTab("foryou")}
                        >
                            <View style={styles.tabContent}>
                                <MaterialCommunityIcons
                                    name="hand-pointing-right"
                                    size={24}
                                    color={activeTab === "foryou" ? Colors.white : Colors.metalSilver}
                                />
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === "foryou" ? styles.activeTabText : styles.inactiveTabText,
                                    ]}
                                >
                                    {t("tabs.foryou")}
                                </Text>
                            </View>
                        </TouchableOpacity>

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
                                    {t("tabs.movies")}
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
                                    {t("tabs.tv")}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                { }
                {showProfileBanner && (
                    <TouchableOpacity
                        style={styles.profileBanner}
                        onPress={() => router.push("/profile" as Parameters<typeof router.push>[0])}
                    >
                        <View style={styles.profileBannerContent}>
                            <Ionicons name="sparkles" size={20} color={Colors.white} />
                            <View style={styles.profileBannerTextContainer}>
                                <Text style={styles.profileBannerTitle}>
                                    {t("home.bannerTitle")}
                                </Text>
                                <Text style={styles.profileBannerSubtitle}>
                                    {t("home.bannerSubtitle")}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleDismissBanner();
                                }}
                            >
                                <Ionicons name="close" size={24} color={Colors.whiteOpacity60} />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )}

                { }
                {activeTab !== "foryou" && (
                    <View style={styles.controlsContainer}>
                        <View style={styles.searchAndFilterRow}>
                            <View style={styles.searchWrapper}>
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
                                        <Ionicons name="close-circle" size={20} color={Colors.metalSilver} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                                    <Entypo name="magnifying-glass" size={24} color={Colors.metalSilver} />
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
                                <Text style={styles.clearFiltersText}>{t("common.clearFilters")}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {activeTab === "foryou" ? renderForYouContent() : renderMainContent()}

                { }
                <Modal
                    visible={showFilterModal}
                    animationType="slide"
                    transparent
                    onRequestClose={handleCloseFilters}
                >
                    { }
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={handleCloseFilters}
                    >
                        { }
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
                                        <Ionicons name="close" size={24} color={Colors.bloodRed} />
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
        </GestureDetector>
    );
}

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
        paddingBottom: 8,
    },
    searchAndFilterRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    filterButtonCompact: {
        backgroundColor: Colors.metalGray,
        padding: 8,
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
        color: Colors.textPrimary,
        paddingHorizontal: 16,
        paddingVertical: 8,
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
        paddingBottom: 8,
        marginTop: -28,
    },
    tabsWrapper: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        borderRadius: 9999,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
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
        width: 300,
        height: 300,
        opacity: 0.8,
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
        backgroundColor: Colors.overlayDarker,
        justifyContent: "flex-end",
    },
    filterPanel: {
        backgroundColor: Colors.panelBackground,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: Colors.panelBorder,
        borderLeftWidth: 1,
        borderLeftColor: Colors.panelBorder,
        borderRightWidth: 1,
        borderRightColor: Colors.panelBorder,
        overflow: "hidden",
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        maxHeight: height * 0.9,
        marginTop: 60,
        padding: 16,
        paddingTop: 8,
    },
    modalHandleContainer: {
        width: "100%",
        height: 20,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
        zIndex: 100,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#ffffff22",
        borderRadius: 2,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    modalTitle: {
        color: Colors.textPrimary,
        fontSize: 24,
        fontWeight: "bold",
        fontFamily: "BebasNeue_400Regular",
    },
    closeButtonContainer: {
        padding: 4,
    },
    closeButtonText: {
        color: Colors.bloodRed,
        fontSize: 20,
    },
    modalContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    sectionHeader: {
        color: Colors.metalSilver,
        fontSize: 14,
        textTransform: "uppercase",
        letterSpacing: 1,
        fontFamily: "BebasNeue_400Regular",
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
        backgroundColor: Colors.bloodRed,
        borderColor: Colors.bloodRed,
    },
    optionText: {
        color: Colors.textMuted,
        fontSize: 14,
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
        color: Colors.textPrimary,
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
        borderColor: Colors.panelBorder,
    },
    activeGenreChip: {
        backgroundColor: Colors.bloodRed,
        borderColor: Colors.bloodRed,
    },
    genreChipText: {
        color: Colors.textMuted,
        fontSize: 12,
    },
    activeGenreText: {
        color: Colors.white,
        fontWeight: "bold",
    },
    modalFooter: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 48,
    },
    applyButton: {
        backgroundColor: Colors.bloodRed,
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: "center",
        shadowColor: Colors.bloodRed,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    applyButtonText: {
        color: Colors.white,
        fontWeight: "bold",
        fontSize: 17,
        fontFamily: "BebasNeue_400Regular",
        textTransform: "uppercase",
        letterSpacing: 1.5,
    },
    profileBanner: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: Colors.bloodRed,
        borderRadius: 8,
        padding: 12,
        elevation: 4,
        shadowColor: Colors.black,
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
        color: Colors.whiteOpacity90,
        fontSize: 12,
    },
    continueSection: {
        paddingVertical: 20,
        backgroundColor: Colors.overlayDark,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderTopColor: Colors.glassWhiteSubtle,
        borderBottomColor: Colors.glassWhiteSubtle,
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
    continueListVertical: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    recommendationGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        paddingTop: 12,
        gap: 12,
    },
    recommendationGridItem: {
        flexBasis: '30%',
    },
    categoryFilterWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.metalBlack,
    },
    categoryFilterContainer: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        borderRadius: 9999,
    },
    categoryTab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 9999,
        alignItems: "center",
    },
    activeCategoryTab: {
        backgroundColor: Colors.bloodRed,
    },
    categoryTabText: {
        fontWeight: "bold",
        fontSize: 13,
        color: Colors.metalSilver,
    },
    activeCategoryTabText: {
        color: Colors.white,
    },
});
