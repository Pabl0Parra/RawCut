import type { Movie, TVShow } from "../lib/tmdb";

/**
 * Parameters for TMDb Discover API calls
 */
export interface DiscoverParams {
    page: number;
    sort_by: string;
    with_genres?: string;
    primary_release_year?: string;
    first_air_date_year?: string;
}

/**
 * Generic result container for paginated content fetching
 */
export interface ContentFetchResult<T> {
    results: T[];
    totalPages: number;
}

/**
 * Configuration for building discover API parameters
 */
export interface DiscoverParamsConfig {
    currentPage: number;
    sortBy: string;
    selectedGenre: number | null;
    selectedYear: string;
    activeTab: ContentTab;
}

/**
 * Union type for content tabs
 */
export type ContentTab = "movies" | "tv";

/**
 * Union type for media types used in user content operations
 */
export type MediaType = "movie" | "tv";

/**
 * Configuration for content loading behavior
 */
export interface ContentLoadConfig {
    activeTab: ContentTab;
    filtersActive: boolean;
    searchQuery: string;
    currentPage: number;
    discoverParams: DiscoverParams;
}

/**
 * State setters for content updates (dependency injection pattern)
 */
export interface ContentStateSetters {
    setMovies: React.Dispatch<React.SetStateAction<Movie[]>>;
    setTVShows: React.Dispatch<React.SetStateAction<TVShow[]>>;
    setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Progress information for continue watching feature
 */
export interface EpisodeProgress {
    watched: number;
    total: number;
}

/**
 * Continue watching item with show details and progress
 */
export interface ContinueWatchingItem {
    show: TVShow;
    progress: EpisodeProgress;
}

/**
 * Sort options available in the filter modal
 */
export interface SortOption {
    label: string;
    value: string;
}

/**
 * Constants for sort options
 */
export const SORT_OPTIONS: readonly SortOption[] = [
    { label: "Popularidad", value: "popularity.desc" },
    { label: "Mejor Valorados", value: "vote_average.desc" },
    { label: "Más Recientes", value: "primary_release_date.desc" },
] as const;

/**
 * Default sort value
 */
export const DEFAULT_SORT_VALUE = "popularity.desc" as const;