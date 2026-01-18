import {
    getMovieDetails,
    getRelatedMovies,
    getMovieVideos,
    type Movie,
    type Video,
    type CrewMember,
} from "../lib/tmdb";
import { supabase, type Profile } from "../lib/supabase";
import type {
    MovieWithDetails,
    MovieLoadResult,
    SendRecommendationParams,
    SendRecommendationResult,
    MediaType,
} from "../types/movieDetail.types";
import {
    DIRECTOR_JOB,
    PRODUCER_JOBS,
    MAX_PRODUCERS_DISPLAY,
    MAX_USERS_TO_LOAD,
    MAX_SEARCH_RESULTS,
} from "../types/movieDetail.types";

/**
 * Finds the best trailer from a list of videos
 * Prioritizes official YouTube trailers
 */
export const findBestTrailer = (videos: Video[]): Video | undefined => {
    const officialTrailer = videos.find(
        (video) =>
            video.type === "Trailer" &&
            video.site === "YouTube" &&
            video.official
    );

    if (officialTrailer) {
        return officialTrailer;
    }

    return videos.find(
        (video) => video.type === "Trailer" && video.site === "YouTube"
    );
};

/**
 * Extracts trailer key from video list
 */
export const extractTrailerKey = (videos: Video[]): string | null => {
    const trailer = findBestTrailer(videos);
    return trailer?.key ?? null;
};

/**
 * Loads complete movie data including details, related movies, and trailer
 */
export const loadMovieData = async (
    movieId: number
): Promise<MovieLoadResult> => {
    const [movieDetails, relatedResponse, videosResponse] = await Promise.all([
        getMovieDetails(movieId),
        getRelatedMovies(movieId),
        getMovieVideos(movieId),
    ]);

    return {
        movie: movieDetails,
        relatedMovies: relatedResponse.results,
        trailerKey: extractTrailerKey(videosResponse.results),
    };
};

/**
 * Filters crew members by job title
 */
export const filterCrewByJob = (
    crew: CrewMember[] | undefined,
    job: string
): CrewMember[] => {
    if (!crew) return [];
    return crew.filter((member) => member.job === job);
};

/**
 * Filters crew members by multiple job titles
 */
export const filterCrewByJobs = (
    crew: CrewMember[] | undefined,
    jobs: readonly string[]
): CrewMember[] => {
    if (!crew) return [];
    return crew.filter((member) => jobs.includes(member.job));
};

/**
 * Gets directors from credits
 */
export const getDirectors = (crew: CrewMember[] | undefined): CrewMember[] => {
    return filterCrewByJob(crew, DIRECTOR_JOB);
};

/**
 * Gets producers from credits (limited to MAX_PRODUCERS_DISPLAY)
 */
export const getProducers = (crew: CrewMember[] | undefined): CrewMember[] => {
    return filterCrewByJobs(crew, PRODUCER_JOBS).slice(0, MAX_PRODUCERS_DISPLAY);
};

/**
 * Formats crew member names as comma-separated string
 */
export const formatCrewNames = (crewMembers: CrewMember[]): string => {
    return crewMembers.map((member) => member.name).join(", ");
};

/**
 * Extracts year from release date string
 */
export const extractYear = (releaseDate: string | undefined): string => {
    if (!releaseDate) return "";
    return releaseDate.split("-")[0];
};

/**
 * Formats movie runtime as "Xh Ym" string
 */
export const formatRuntime = (runtime: number | undefined): string => {
    if (!runtime) return "";
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}m`;
};

/**
 * Formats movie metadata (year and runtime) as single string
 */
export const formatMovieMetadata = (
    releaseDate: string | undefined,
    runtime: number | undefined
): string => {
    const year = extractYear(releaseDate);
    const formattedRuntime = formatRuntime(runtime);

    if (year && formattedRuntime) {
        return `${year} • ${formattedRuntime}`;
    }

    return year || formattedRuntime;
};

/**
 * Formats vote average to single decimal place
 */
export const formatRating = (voteAverage: number): string => {
    return voteAverage.toFixed(1);
};

// ============================================================================
// User & Recommendation Functions
// ============================================================================

/**
 * Searches for users by username (excludes current user)
 */
export const searchUsers = async (
    query: string,
    currentUserId: string | undefined
): Promise<Profile[]> => {
    if (!currentUserId) return [];

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${query}%`)
        .neq("user_id", currentUserId)
        .limit(MAX_SEARCH_RESULTS);

    if (error) {
        console.error("Error searching users:", error);
        return [];
    }

    return data ?? [];
};

/**
 * Loads all available users for recommendations (excludes current user)
 */
export const loadAllUsers = async (
    currentUserId: string | undefined
): Promise<Profile[]> => {
    if (!currentUserId) return [];

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("user_id", currentUserId)
        .order("username", { ascending: true })
        .limit(MAX_USERS_TO_LOAD);

    if (error) {
        console.error("Error loading users:", error);
        throw new Error(`Error loading users: ${error.message}`);
    }

    return data ?? [];
};

/**
 * Sends a recommendation to another user
 */
export const sendRecommendation = async (
    params: SendRecommendationParams
): Promise<SendRecommendationResult> => {
    const { senderId, receiverId, tmdbId, mediaType, message } = params;

    try {
        const { error } = await supabase.from("recommendations").insert({
            sender_id: senderId,
            receiver_id: receiverId,
            tmdb_id: tmdbId,
            media_type: mediaType,
            message: message || null,
        });

        if (error) {
            console.error("Supabase insert error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Error sending recommendation:", err);
        return { success: false, error: errorMessage };
    }
};

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a value is not null or undefined
 */
export const isNotNullish = <T>(value: T | null | undefined): value is T => {
    return value !== null && value !== undefined;
};

/**
 * Parses movie ID from route params
 * Returns null if invalid
 */
export const parseMovieId = (id: string | undefined): number | null => {
    if (!id) return null;
    const parsed = Number.parseInt(id, 10);
    return Number.isNaN(parsed) ? null : parsed;
};