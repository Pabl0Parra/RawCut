const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = process.env.EXPO_PUBLIC_TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p/w500";

// Types
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
    return fetchTMDb(`/movie/${id}`, { append_to_response: "credits" });
};

export const getTVShowDetails = async (id: number): Promise<TVShow & { genres: { id: number; name: string }[] }> => {
    return fetchTMDb(`/tv/${id}`, { append_to_response: "credits" });
};

export const getTVSeasonDetails = async (tvId: number, seasonNumber: number): Promise<Season & { episodes: Episode[] }> => {
    return fetchTMDb(`/tv/${tvId}/season/${seasonNumber}`);
};

export const getRelatedMovies = async (id: number): Promise<TMDbResponse<Movie>> => {
    return fetchTMDb<TMDbResponse<Movie>>(`/movie/${id}/similar`);
};

export const getRelatedTVShows = async (id: number): Promise<TMDbResponse<TVShow>> => {
    return fetchTMDb<TMDbResponse<TVShow>>(`/tv/${id}/similar`);
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
    return fetchTMDb<PersonCredits>(`/person/${id}/combined_credits`);
};

// Helper function to get full image URL
export const getImageUrl = (path: string | null, size: "w200" | "w300" | "w500" | "original" = "w500"): string | null => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
};


export interface Genre {
    id: number;
    name: string;
}

export interface DiscoverParams {
    with_genres?: string;
    primary_release_year?: string; // For Movies
    first_air_date_year?: string; // For TV
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
    };

    if (params.with_genres) queryParams.with_genres = params.with_genres;
    if (params.primary_release_year) queryParams.primary_release_year = params.primary_release_year;

    return fetchTMDb<TMDbResponse<Movie>>("/discover/movie", queryParams);
};

export const discoverTVShows = async (params: DiscoverParams): Promise<TMDbResponse<TVShow>> => {
    const queryParams: Record<string, string> = {
        page: (params.page || 1).toString(),
        sort_by: params.sort_by || "popularity.desc",
    };

    if (params.with_genres) queryParams.with_genres = params.with_genres;
    if (params.first_air_date_year) queryParams.first_air_date_year = params.first_air_date_year;

    return fetchTMDb<TMDbResponse<TVShow>>("/discover/tv", queryParams);
};
