import {
    getPopularMovies,
    getPopularTVShows,
    discoverMovies,
    discoverTVShows,
    getTVShowDetails,
    type Movie,
    type TVShow,
} from "../lib/tmdb";
import type {
    DiscoverParams,
    DiscoverParamsConfig,
    ContentFetchResult,
    ContentTab,
    ContinueWatchingItem,
    EpisodeProgress,
} from "../types/homeScreen.types";

/**
 * Builds discover API parameters from configuration
 * Pure function with no side effects
 */
export const buildDiscoverParams = (config: DiscoverParamsConfig): DiscoverParams => {
    const { currentPage, sortBy, selectedGenre, selectedYear, activeTab } = config;

    // Fix: primary_release_date is for movies only. For TV we must use first_air_date.
    let finalSortBy = sortBy;
    if (activeTab === "tv" && sortBy === "primary_release_date.desc") {
        finalSortBy = "first_air_date.desc";
    }

    const baseParams: DiscoverParams = {
        page: currentPage,
        sort_by: finalSortBy,
    };

    if (selectedGenre !== null) {
        baseParams.with_genres = selectedGenre.toString();
    }

    if (selectedYear.trim()) {
        if (activeTab === "movies") {
            baseParams.primary_release_year = selectedYear;
        } else {
            baseParams.first_air_date_year = selectedYear;
        }
    }

    return baseParams;
};

/**
 * Determines if filters are meaningfully active (not just defaults)
 */
export const hasActiveFilters = (
    selectedGenre: number | null,
    selectedYear: string,
    sortBy: string,
    defaultSortValue: string = "popularity.desc"
): boolean => {
    return (
        selectedGenre !== null ||
        selectedYear.trim() !== "" ||
        sortBy !== defaultSortValue
    );
};

/**
 * Fetches movie content using either discover or popular endpoint
 */
export const fetchMovieContent = async (
    currentPage: number,
    useDiscoverApi: boolean,
    discoverParams: DiscoverParams
): Promise<ContentFetchResult<Movie>> => {
    const response = useDiscoverApi
        ? await discoverMovies(discoverParams)
        : await getPopularMovies(currentPage);

    return {
        results: response.results,
        totalPages: response.total_pages,
    };
};

/**
 * Fetches TV show content using either discover or popular endpoint
 */
export const fetchTVContent = async (
    currentPage: number,
    useDiscoverApi: boolean,
    discoverParams: DiscoverParams
): Promise<ContentFetchResult<TVShow>> => {
    const response = useDiscoverApi
        ? await discoverTVShows(discoverParams)
        : await getPopularTVShows(currentPage);

    return {
        results: response.results,
        totalPages: response.total_pages,
    };
};

/**
 * Generic content fetcher that handles both movies and TV shows
 * Uses discriminated union pattern for type safety
 */
export async function fetchContent<T extends ContentTab>(
    activeTab: T,
    currentPage: number,
    useDiscoverApi: boolean,
    discoverParams: DiscoverParams
): Promise<ContentFetchResult<T extends "movies" ? Movie : TVShow>> {
    if (activeTab === "movies") {
        return fetchMovieContent(
            currentPage,
            useDiscoverApi,
            discoverParams
        ) as Promise<ContentFetchResult<T extends "movies" ? Movie : TVShow>>;
    }

    return fetchTVContent(
        currentPage,
        useDiscoverApi,
        discoverParams
    ) as Promise<ContentFetchResult<T extends "movies" ? Movie : TVShow>>;
}

/**
 * Calculates pagination state after content load
 */
export const calculatePaginationState = (
    currentPage: number,
    totalPages: number,
    isReset: boolean
): { hasMore: boolean; nextPage: number } => ({
    hasMore: currentPage < totalPages,
    nextPage: isReset ? 2 : currentPage + 1,
});

/**
 * Merges new results with existing content based on reset flag
 */
export const mergeContentResults = <T>(
    existingContent: T[],
    newResults: T[],
    isReset: boolean
): T[] => (isReset ? newResults : [...existingContent, ...newResults]);

/**
 * Determines if content loading should be skipped
 */
export const shouldSkipContentLoad = (
    isReset: boolean,
    hasMore: boolean,
    isLoading: boolean
): boolean => !isReset && (!hasMore || isLoading);

/**
 * Processes a TV show for continue watching section
 * Returns null if the show should be excluded
 */
export const processContinueWatchingShow = async (
    showId: number,
    watchedEpisodeCount: number,
    isFullyWatched: boolean
): Promise<ContinueWatchingItem | null> => {
    if (isFullyWatched) {
        return null;
    }

    try {
        const show = await getTVShowDetails(showId);
        const progress: EpisodeProgress = {
            watched: watchedEpisodeCount,
            total: show.number_of_episodes ?? 0,
        };

        return { show, progress };
    } catch (error) {
        console.error(`Error fetching details for show ${showId}:`, error);
        return null;
    }
};

/**
 * Filters TV progress entries to only include actual episode progress
 * Excludes movie markers (0,0) and fully watched markers (-1,-1)
 */
export const filterActualEpisodeProgress = <
    T extends { season_number: number; tmdb_id: number }
>(
    progressEntries: T[]
): T[] => progressEntries.filter((entry) => entry.season_number > 0);

/**
 * Extracts unique show IDs from progress entries
 */
export const extractUniqueShowIds = <T extends { tmdb_id: number }>(
    progressEntries: T[]
): number[] => [...new Set(progressEntries.map((entry) => entry.tmdb_id))];

/**
 * Counts watched episodes for a specific show
 */
export const countWatchedEpisodes = <
    T extends { tmdb_id: number; season_number: number }
>(
    progressEntries: T[],
    showId: number
): number =>
    progressEntries.filter(
        (entry) => entry.tmdb_id === showId && entry.season_number > 0
    ).length;

/**
 * Processes genre names to clarify ambiguous translations
 */
export const processGenreName = (genreName: string): string =>
    genreName === "Terror" ? "Terror (Horror)" : genreName;

/**
 * Sorts genres alphabetically by name
 */
export const sortGenresAlphabetically = <T extends { name: string }>(
    genres: T[]
): T[] => [...genres].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Type guard to filter out null values with proper type narrowing
 */
export const isNotNull = <T>(value: T | null): value is T => value !== null;