const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = process.env.EXPO_PUBLIC_TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p/w500";

// Types
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
    popularity: number;
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
    popularity: number;
}

export interface TMDbResponse<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}

// API Helper
const fetchTMDb = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append("api_key", TMDB_API_KEY);
    url.searchParams.append("language", "es-ES"); // Spanish language for all responses

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`TMDb API Error: ${response.status}`);
    }

    return response.json();
};

// API Functions
export const getPopularMovies = async (page: number = 1): Promise<TMDbResponse<Movie>> => {
    return fetchTMDb<TMDbResponse<Movie>>("/movie/popular", { page: page.toString() });
};

export const getPopularTVShows = async (page: number = 1): Promise<TMDbResponse<TVShow>> => {
    return fetchTMDb<TMDbResponse<TVShow>>("/tv/popular", { page: page.toString() });
};

export const searchMovies = async (query: string, page: number = 1): Promise<TMDbResponse<Movie>> => {
    return fetchTMDb<TMDbResponse<Movie>>("/search/movie", { query, page: page.toString() });
};

export const searchTVShows = async (query: string, page: number = 1): Promise<TMDbResponse<TVShow>> => {
    return fetchTMDb<TMDbResponse<TVShow>>("/search/tv", { query, page: page.toString() });
};

export const getMovieDetails = async (id: number): Promise<Movie & { genres: { id: number; name: string }[] }> => {
    return fetchTMDb(`/movie/${id}`);
};

export const getTVShowDetails = async (id: number): Promise<TVShow & { genres: { id: number; name: string }[] }> => {
    return fetchTMDb(`/tv/${id}`);
};

// Helper function to get full image URL
export const getImageUrl = (path: string | null, size: "w200" | "w300" | "w500" | "original" = "w500"): string | null => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
};
