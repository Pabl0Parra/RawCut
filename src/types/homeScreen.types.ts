import type { Movie, TVShow } from "../lib/tmdb";

export interface DiscoverParams {
    page: number;
    sort_by: string;
    with_genres?: string;
    primary_release_year?: string;
    first_air_date_year?: string;
}

export interface ContentFetchResult<T> {
    results: T[];
    totalPages: number;
}

export interface DiscoverParamsConfig {
    currentPage: number;
    sortBy: string;
    selectedGenre: number | null;
    selectedYear: string;
    activeTab: ContentTab;
}

export type ContentTab = "foryou" | "movies" | "tv";

export type MediaType = "movie" | "tv";

export interface ContentLoadConfig {
    activeTab: ContentTab;
    filtersActive: boolean;
    searchQuery: string;
    currentPage: number;
    discoverParams: DiscoverParams;
}

export interface ContentStateSetters {
    setMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
    setTVShows: React.Dispatch<React.SetStateAction<TVShow[]>>;
    setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface EpisodeProgress {
    watched: number;
    total: number;
}

export interface ContinueWatchingItem {
    show: TVShow;
    progress: EpisodeProgress;
}

export interface SortOption {
    label: string;
    value: string;
}

export const SORT_OPTIONS: readonly SortOption[] = [
    { label: "Popularidad", value: "popularity.desc" },
    { label: "Mejor Valorados", value: "vote_average.desc" },
    { label: "Más Recientes", value: "primary_release_date.desc" },
] as const;

export const DEFAULT_SORT_VALUE = "popularity.desc" as const;