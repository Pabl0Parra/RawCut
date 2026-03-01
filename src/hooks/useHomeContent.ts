import {
    useInfiniteQuery,
    useQuery,
    type InfiniteData,
    type UseInfiniteQueryResult,
    type UseQueryResult,
} from "@tanstack/react-query";
import {
    getPopularMovies,
    getPopularTVShows,
    discoverMovies,
    discoverTVShows,
    getMovieGenres,
    getTVGenres,
    type Movie,
    type TVShow,
    type Genre,
    type TMDbResponse,
    type DiscoverParams,
} from "../lib/tmdb";

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const movieKeys = {
    all: ["movies"] as const,
    popular: (page?: number) => ["movies", "popular", page ?? "infinite"] as const,
    discover: (params: DiscoverParams) => ["movies", "discover", params] as const,
    genres: () => ["genres", "movies"] as const,
};

export const tvKeys = {
    all: ["tv"] as const,
    popular: (page?: number) => ["tv", "popular", page ?? "infinite"] as const,
    discover: (params: DiscoverParams) => ["tv", "discover", params] as const,
    genres: () => ["genres", "tv"] as const,
};

// ─── Infinite Query Hooks (for paginated browse lists) ───────────────────────

export const usePopularMovies = (): UseInfiniteQueryResult<
    InfiniteData<TMDbResponse<Movie>>,
    Error
> =>
    useInfiniteQuery({
        queryKey: movieKeys.popular(),
        queryFn: ({ pageParam }) => getPopularMovies(pageParam as number),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
        staleTime: 5 * 60 * 1000,
    });

export const usePopularTVShows = (): UseInfiniteQueryResult<
    InfiniteData<TMDbResponse<TVShow>>,
    Error
> =>
    useInfiniteQuery({
        queryKey: tvKeys.popular(),
        queryFn: ({ pageParam }) => getPopularTVShows(pageParam as number),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
        staleTime: 5 * 60 * 1000,
    });

export const useDiscoverMovies = (
    params: DiscoverParams,
    enabled: boolean = true
): UseInfiniteQueryResult<InfiniteData<TMDbResponse<Movie>>, Error> =>
    useInfiniteQuery({
        queryKey: movieKeys.discover(params),
        queryFn: ({ pageParam }) =>
            discoverMovies({ ...params, page: pageParam as number }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
        enabled,
    });

export const useDiscoverTVShows = (
    params: DiscoverParams,
    enabled: boolean = true
): UseInfiniteQueryResult<InfiniteData<TMDbResponse<TVShow>>, Error> =>
    useInfiniteQuery({
        queryKey: tvKeys.discover(params),
        queryFn: ({ pageParam }) =>
            discoverTVShows({ ...params, page: pageParam as number }),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
        enabled,
    });

// ─── Genre Query Hooks (single-page, long-lived cache) ────────────────────────

export const useMovieGenres = (): UseQueryResult<Genre[], Error> =>
    useQuery({
        queryKey: movieKeys.genres(),
        queryFn: async () => {
            const data = await getMovieGenres();
            return data.genres;
        },
        staleTime: 60 * 60 * 1000, // genres rarely change
    });

export const useTVGenres = (): UseQueryResult<Genre[], Error> =>
    useQuery({
        queryKey: tvKeys.genres(),
        queryFn: async () => {
            const data = await getTVGenres();
            return data.genres;
        },
        staleTime: 60 * 60 * 1000,
    });

// ─── Utility: flatten infinite pages into flat array ─────────────────────────

export const flattenPages = <T>(
    data: InfiniteData<TMDbResponse<T>> | undefined
): T[] => data?.pages.flatMap((p) => p.results) ?? [];
