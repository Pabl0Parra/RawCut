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
    getCuratedTVShows,
    getClassicMovies,
    getCuratedMovies,
    getNewReleases,
    getByGenre,
    type Movie,
    type TVShow,
    type Genre,
    type TMDbResponse,
    type DiscoverParams,
} from "../lib/tmdb";

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const movieKeys = {
    all: ["movies"] as const,
    popular: (page?: number) => ["movies", "latest", page ?? "infinite"] as const,
    discover: (params: DiscoverParams) => ["movies", "discover", params] as const,
    classics: () => ["movies", "classics"] as const,
    curated: () => ["movies", "curated"] as const,
    genres: () => ["genres", "movies"] as const,
};

export const tvKeys = {
    all: ["tv"] as const,
    popular: (page?: number) => ["tv", "latest", page ?? "infinite"] as const,
    discover: (params: DiscoverParams) => ["tv", "discover", params] as const,
    curated: () => ["tv", "curated"] as const,
    genres: () => ["genres", "tv"] as const,
};

// ─── Shared infinite query config ────────────────────────────────────────────

const infinitePageParam = {
    initialPageParam: 1 as number,
    getNextPageParam: <T>(lastPage: TMDbResponse<T>): number | undefined =>
        lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
};

// ─── Infinite Query Hooks (for paginated browse lists) ───────────────────────

export const usePopularMovies = (): UseInfiniteQueryResult<
    InfiniteData<TMDbResponse<Movie>>,
    Error
> =>
    useInfiniteQuery({
        queryKey: movieKeys.popular(),
        queryFn: ({ pageParam }) => getPopularMovies(pageParam),
        ...infinitePageParam,
        staleTime: 5 * 60 * 1000,
    });

export const usePopularTVShows = (): UseInfiniteQueryResult<
    InfiniteData<TMDbResponse<TVShow>>,
    Error
> =>
    useInfiniteQuery({
        queryKey: tvKeys.popular(),
        queryFn: ({ pageParam }) => getPopularTVShows(pageParam),
        ...infinitePageParam,
        staleTime: 5 * 60 * 1000,
    });

export const useDiscoverMovies = (
    params: DiscoverParams,
    enabled: boolean = true
): UseInfiniteQueryResult<InfiniteData<TMDbResponse<Movie>>, Error> =>
    useInfiniteQuery({
        queryKey: movieKeys.discover(params),
        queryFn: ({ pageParam }) =>
            discoverMovies({ ...params, page: pageParam }),
        ...infinitePageParam,
        enabled,
    });

export const useDiscoverTVShows = (
    params: DiscoverParams,
    enabled: boolean = true
): UseInfiniteQueryResult<InfiniteData<TMDbResponse<TVShow>>, Error> =>
    useInfiniteQuery({
        queryKey: tvKeys.discover(params),
        queryFn: ({ pageParam }) =>
            discoverTVShows({ ...params, page: pageParam }),
        ...infinitePageParam,
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

// ─── ForYou: Curated & Classic Hooks ─────────────────────────────────────────

export const useCuratedTVShows = (): UseInfiniteQueryResult<
    InfiniteData<TMDbResponse<TVShow>>,
    Error
> =>
    useInfiniteQuery({
        queryKey: tvKeys.curated(),
        queryFn: ({ pageParam }) => getCuratedTVShows(pageParam),
        ...infinitePageParam,
        staleTime: 10 * 60 * 1000,
    });

export const useClassicMovies = (): UseInfiniteQueryResult<
    InfiniteData<TMDbResponse<Movie>>,
    Error
> =>
    useInfiniteQuery({
        queryKey: movieKeys.classics(),
        queryFn: ({ pageParam }) => getClassicMovies(pageParam),
        ...infinitePageParam,
        staleTime: 30 * 60 * 1000,
    });

export const useCuratedMovies = (): UseInfiniteQueryResult<
    InfiniteData<TMDbResponse<Movie>>,
    Error
> =>
    useInfiniteQuery({
        queryKey: movieKeys.curated(),
        queryFn: ({ pageParam }) => getCuratedMovies(pageParam),
        ...infinitePageParam,
        staleTime: 10 * 60 * 1000,
    });

// ─── New Content Hooks ────────────────────────────────────────────────────────
// Fixed: replaced `any` with proper Movie | TVShow union type

export const useNewReleasesContent = (
    type: "movie" | "tv",
): UseInfiniteQueryResult<InfiniteData<TMDbResponse<Movie | TVShow>>, Error> =>
    useInfiniteQuery({
        queryKey: [type === "movie" ? "movies" : "tv", "new_releases"],
        queryFn: ({ pageParam }) =>
            getNewReleases(type, pageParam) as Promise<TMDbResponse<Movie | TVShow>>,
        ...infinitePageParam,
        staleTime: 15 * 60 * 1000,
    });

export const useGenreContent = (
    type: "movie" | "tv",
    genreIds: string,
    genreKey: string,
): UseInfiniteQueryResult<InfiniteData<TMDbResponse<Movie | TVShow>>, Error> =>
    useInfiniteQuery({
        queryKey: [type === "movie" ? "movies" : "tv", "genre", genreKey],
        queryFn: ({ pageParam }) =>
            getByGenre(type, genreIds, pageParam) as Promise<TMDbResponse<Movie | TVShow>>,
        ...infinitePageParam,
        staleTime: 20 * 60 * 1000,
    });

// ─── Utility: flatten infinite pages into flat array ─────────────────────────

export const flattenPages = <T>(
    data: InfiniteData<TMDbResponse<T>> | undefined,
): T[] => data?.pages.flatMap((p) => p.results) ?? [];