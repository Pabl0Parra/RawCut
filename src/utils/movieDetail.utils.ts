import {
    getMovieDetails,
    getRelatedMovies,
    getMovieVideos,
    type Video,
    type CrewMember,
} from "../lib/tmdb";
import { supabase, type Profile } from "../lib/supabase";
import type {
    MovieLoadResult,
    SendRecommendationParams,
    SendRecommendationResult,
} from "../types/movieDetail.types";
import {
    DIRECTOR_JOB,
    PRODUCER_JOBS,
    MAX_PRODUCERS_DISPLAY,
    MAX_USERS_TO_LOAD,
    MAX_SEARCH_RESULTS,
} from "../types/movieDetail.types";

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

export const extractTrailerKey = (videos: Video[]): string | null => {
    const trailer = findBestTrailer(videos);
    return trailer?.key ?? null;
};

export const loadMovieData = async (
    movieId: number
): Promise<MovieLoadResult> => {
    const [movieDetails, relatedResponse, videosResponse] = await Promise.all([
        getMovieDetails(movieId),
        getRelatedMovies(movieId),
        getMovieVideos(movieId),
    ]);

    if (!movieDetails) {
        throw new Error(`Movie with id ${movieId} not found`);
    }

    return {
        movie: movieDetails,
        relatedMovies: relatedResponse.results,
        trailerKey: extractTrailerKey(videosResponse.results),
    };
};

export const filterCrewByJob = (
    crew: CrewMember[] | undefined,
    job: string
): CrewMember[] => {
    if (!crew) return [];
    return crew.filter((member) => member.job === job);
};

export const filterCrewByJobs = (
    crew: CrewMember[] | undefined,
    jobs: readonly string[]
): CrewMember[] => {
    if (!crew) return [];
    return crew.filter((member) => jobs.includes(member.job));
};

export const getDirectors = (crew: CrewMember[] | undefined): CrewMember[] => {
    return filterCrewByJob(crew, DIRECTOR_JOB);
};

export const getProducers = (crew: CrewMember[] | undefined): CrewMember[] => {
    return filterCrewByJobs(crew, PRODUCER_JOBS).slice(0, MAX_PRODUCERS_DISPLAY);
};

export const formatCrewNames = (crewMembers: CrewMember[]): string => {
    return crewMembers.map((member) => member.name).join(", ");
};

export const extractYear = (releaseDate: string | undefined): string => {
    if (!releaseDate) return "";
    return releaseDate.split("-")[0];
};

export const formatRuntime = (runtime: number | undefined): string => {
    if (!runtime) return "";
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}m`;
};

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

export const formatRating = (voteAverage: number): string => {
    return voteAverage.toFixed(1);
};

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
            if (error.code === "23503") {
                console.warn("Recommendation failure: Foreign Key violation. Profiles entry might be missing.");
            }
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Error sending recommendation:", err);
        return { success: false, error: errorMessage };
    }
};

export const isNotNullish = <T>(value: T | null | undefined): value is T => {
    return value !== null && value !== undefined;
};

export const parseMovieId = (id: string | undefined): number | null => {
    if (!id) return null;
    const parsed = Number.parseInt(id, 10);
    return Number.isNaN(parsed) ? null : parsed;
};