import i18next from "i18next";

const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = process.env.EXPO_PUBLIC_TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p/w500";

export interface CastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
}

export interface CrewMember {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
}

export interface Credits {
    cast: CastMember[];
    crew: CrewMember[];
}

export interface Episode {
    id: number;
    name: string;
    overview: string;
    still_path: string | null;
    vote_average: number;
    air_date: string;
    episode_number: number;
    season_number: number;
}

export interface Season {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
    episode_count: number;
    air_date: string;
    vote_average: number;
}

export interface Movie {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    original_language: string;
    popularity: number;
    runtime?: number;
    credits?: Credits;
}

export interface TVShow {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
    original_language: string;
    popularity: number;
    seasons?: Season[];
    episode_run_time?: number[];
    next_episode_to_air?: Episode | null;
    last_episode_to_air?: Episode | null;
    status?: string;
    number_of_episodes?: number;
    number_of_seasons?: number;
    credits?: Credits;
    created_by?: {
        id: number;
        name: string;
        profile_path: string | null;
    }[];
}

export interface TMDbResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}

const fetchTMDb = async <T>(
    endpoint: string,
    params: Record<string, string> = {},
    signal?: AbortSignal,
): Promise<T> => {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append("api_key", TMDB_API_KEY);

    const currentLang = i18next.language;
    const langMap: Record<string, string> = { ca: "ca-ES", en: "en-US" };
    const lang = langMap[currentLang] ?? "es-ES";
    url.searchParams.append("language", lang);

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), { signal });

    if (!response.ok) {
        if (response.status === 404) {
            return null as T;
        }
        throw new Error(`TMDb API Error: ${response.status}`);
    }

    return response.json();
};

const EXCLUDED_LANGUAGES = new Set(["ja", "zh", "ko", "ar", "hi"]);

const filterByLanguage = <T extends { original_language: string }>(items: T[]): T[] => {
    if (!items) return [];
    return items.filter(item => !EXCLUDED_LANGUAGES.has(item.original_language));
};

export const getPopularMovies = async (page: number = 1): Promise<TMDbResponse<Movie>> => {
    const response = await fetchTMDb<TMDbResponse<Movie>>("/movie/popular", { page: page.toString() });
    return { ...response, results: filterByLanguage(response.results) };
};

export const getPopularTVShows = async (page: number = 1): Promise<TMDbResponse<TVShow>> => {
    const response = await fetchTMDb<TMDbResponse<TVShow>>("/tv/popular", { page: page.toString() });
    return { ...response, results: filterByLanguage(response.results) };
};

export const searchMovies = async (query: string, page: number = 1): Promise<TMDbResponse<Movie>> => {
    const response = await fetchTMDb<TMDbResponse<Movie>>("/search/movie", { query, page: page.toString() });
    return { ...response, results: filterByLanguage(response.results) };
};

export const searchTVShows = async (query: string, page: number = 1): Promise<TMDbResponse<TVShow>> => {
    const response = await fetchTMDb<TMDbResponse<TVShow>>("/search/tv", { query, page: page.toString() });
    return { ...response, results: filterByLanguage(response.results) };
};

export const getMovieDetails = async (id: number): Promise<(Movie & { genres: { id: number; name: string }[] }) | null> => {
    const details = await fetchTMDb<Movie & { genres: { id: number; name: string }[] }>(`/movie/${id}`, { append_to_response: "credits" });
    if (details && EXCLUDED_LANGUAGES.has(details.original_language)) return null;
    return details;
};

export const getTVShowDetails = async (id: number): Promise<(TVShow & { genres: { id: number; name: string }[] }) | null> => {
    const details = await fetchTMDb<TVShow & { genres: { id: number; name: string }[] }>(`/tv/${id}`, { append_to_response: "credits" });
    if (details && EXCLUDED_LANGUAGES.has(details.original_language)) return null;
    return details;
};

export const getTVSeasonDetails = async (tvId: number, seasonNumber: number): Promise<Season & { episodes: Episode[] }> => {
    return fetchTMDb(`/tv/${tvId}/season/${seasonNumber}`);
};

export const getRelatedMovies = async (id: number): Promise<TMDbResponse<Movie>> => {
    const response = await fetchTMDb<TMDbResponse<Movie>>(`/movie/${id}/similar`);
    return response?.results
        ? { ...response, results: filterByLanguage(response.results) }
        : response;
};

export const getRelatedTVShows = async (id: number): Promise<TMDbResponse<TVShow>> => {
    const response = await fetchTMDb<TMDbResponse<TVShow>>(`/tv/${id}/similar`);
    return response?.results
        ? { ...response, results: filterByLanguage(response.results) }
        : response;
};

export interface Video {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official: boolean;
}

export const getMovieVideos = async (id: number): Promise<{ results: Video[] }> => {
    return fetchTMDb(`/movie/${id}/videos`);
};

export const getTVVideos = async (id: number): Promise<{ results: Video[] }> => {
    return fetchTMDb(`/tv/${id}/videos`);
};

export interface Person {
    id: number;
    name: string;
    biography: string;
    profile_path: string | null;
    birthday: string | null;
    place_of_birth: string | null;
    known_for_department: string;
}

export interface PersonCredits {
    cast: (Movie | TVShow)[];
    crew: (Movie | TVShow)[];
}

export const getPersonDetails = async (id: number): Promise<Person> => {
    return fetchTMDb<Person>(`/person/${id}`);
};

export const getPersonCredits = async (id: number): Promise<PersonCredits> => {
    const credits = await fetchTMDb<PersonCredits>(`/person/${id}/combined_credits`);
    if (credits) {
        return {
            cast: filterByLanguage(credits.cast as any),
            crew: filterByLanguage(credits.crew as any),
        } as PersonCredits;
    }
    return credits;
};

export const getImageUrl = (path: string | null | undefined, size: "w200" | "w300" | "w500" | "original" = "w500"): string | null => {
    if (!path) return null;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `https://image.tmdb.org/t/p/${size}${cleanPath}`;
};

export function isValidTmdbId(id: any): boolean {
    if (id === null || id === undefined) return false;
    const num = Number(id);
    return Number.isInteger(num) && num > 0;
}

export function getTmdbBaseUrl(): string {
    return TMDB_BASE_URL;
}

export interface Genre {
    id: number;
    name: string;
}

export interface DiscoverParams {
    with_genres?: string;
    primary_release_year?: string;
    first_air_date_year?: string;
    sort_by?: string;
    page?: number;
}

export const getMovieGenres = async (): Promise<{ genres: Genre[] }> => {
    return fetchTMDb<{ genres: Genre[] }>("/genre/movie/list");
};

export const getTVGenres = async (): Promise<{ genres: Genre[] }> => {
    return fetchTMDb<{ genres: Genre[] }>("/genre/tv/list");
};

export const discoverMovies = async (params: DiscoverParams): Promise<TMDbResponse<Movie>> => {
    const queryParams: Record<string, string> = {
        page: (params.page || 1).toString(),
        sort_by: params.sort_by || "popularity.desc",
        "primary_release_date.lte": new Date().toISOString().split('T')[0],
    };

    if (params.with_genres) queryParams.with_genres = params.with_genres;
    if (params.primary_release_year) queryParams.primary_release_year = params.primary_release_year;

    const response = await fetchTMDb<TMDbResponse<Movie>>("/discover/movie", queryParams);
    return { ...response, results: filterByLanguage(response.results) };
};

export const discoverTVShows = async (params: DiscoverParams): Promise<TMDbResponse<TVShow>> => {
    const queryParams: Record<string, string> = {
        page: (params.page || 1).toString(),
        sort_by: params.sort_by || "popularity.desc",
        "first_air_date.lte": new Date().toISOString().split('T')[0],
    };

    if (params.with_genres) queryParams.with_genres = params.with_genres;
    if (params.first_air_date_year) queryParams.first_air_date_year = params.first_air_date_year;

    const response = await fetchTMDb<TMDbResponse<TVShow>>("/discover/tv", queryParams);
    return { ...response, results: filterByLanguage(response.results) };
};