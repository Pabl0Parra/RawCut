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

export const buildDiscoverParams = (config: DiscoverParamsConfig): DiscoverParams => {
    const { currentPage, sortBy, selectedGenre, selectedYear, activeTab } = config;


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

export async function fetchContent<T extends ContentTab>(
    activeTab: T,
    currentPage: number,
    useDiscoverApi: boolean,
    discoverParams: DiscoverParams
): Promise<ContentFetchResult<T extends "movies" ? Movie : TVShow>> {
    if (activeTab === "foryou") {
        return { results: [], totalPages: 1 } as ContentFetchResult<T extends "movies" ? Movie : TVShow>;
    }

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

export const calculatePaginationState = (
    currentPage: number,
    totalPages: number,
    isReset: boolean
): { hasMore: boolean; nextPage: number } => ({
    hasMore: currentPage < totalPages,
    nextPage: isReset ? 2 : currentPage + 1,
});

export const mergeContentResults = <T>(
    existingContent: T[],
    newResults: T[],
    isReset: boolean
): T[] => (isReset ? newResults : [...existingContent, ...newResults]);

export const shouldSkipContentLoad = (
    isReset: boolean,
    hasMore: boolean,
    isLoading: boolean
): boolean => !isReset && (!hasMore || isLoading);

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
        if (!show) {
            return null;
        }

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

export const filterActualEpisodeProgress = <
    T extends { season_number: number; tmdb_id: number }
>(
    progressEntries: T[]
): T[] => progressEntries.filter((entry) => entry.season_number > 0);

export const extractUniqueShowIds = <T extends { tmdb_id: number }>(
    progressEntries: T[]
): number[] => [...new Set(progressEntries.map((entry) => entry.tmdb_id))];

export const countWatchedEpisodes = <
    T extends { tmdb_id: number; season_number: number }
>(
    progressEntries: T[],
    showId: number
): number =>
    progressEntries.filter(
        (entry) => entry.tmdb_id === showId && entry.season_number > 0
    ).length;

export const processGenreName = (genreName: string): string => genreName;

export const sortGenresAlphabetically = <T extends { name: string }>(
    genres: T[]
): T[] => [...genres].sort((a, b) => a.name.localeCompare(b.name));

export const isNotNull = <T>(value: T | null): value is T => value !== null;