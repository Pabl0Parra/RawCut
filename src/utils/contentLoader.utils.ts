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

export const mergeContentResults = <T extends { id: number }>(
    existingContent: T[],
    newResults: T[],
    isReset: boolean
): T[] => {
    if (isReset) return newResults;
    
    const existingIds = new Set(existingContent.map(item => item.id));
    const deduped = newResults.filter(item => !existingIds.has(item.id));
    return [...existingContent, ...deduped];
};

export const shouldSkipContentLoad = (
    isReset: boolean,
    hasMore: boolean,
    isLoading: boolean
): boolean => !isReset && (!hasMore || isLoading);

export const processGenreName = (genreName: string): string => genreName;

export const sortGenresAlphabetically = <T extends { name: string }>(
    genres: T[]
): T[] => [...genres].sort((a, b) => a.name.localeCompare(b.name));

export const isNotNull = <T>(value: T | null): value is T => value !== null;