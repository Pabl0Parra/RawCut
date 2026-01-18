import type { Movie, Credits, Genre } from "../lib/tmdb";
import type { Profile } from "../lib/supabase";

/**
 * Extended Movie type with full details from TMDb API
 * Used when fetching movie details with appended credits
 */
export interface MovieWithDetails extends Movie {
    genres: Genre[];
    credits?: Credits;
    runtime?: number;
}

/**
 * Result of loading all movie data (details, related, trailer)
 */
export interface MovieLoadResult {
    movie: MovieWithDetails;
    relatedMovies: Movie[];
    trailerKey: string | null;
}

/**
 * Media type union for content operations
 */
export type MediaType = "movie" | "tv";

/**
 * Configuration for action buttons (favorite, watchlist, watched)
 */
export interface ActionButtonConfig {
    isActive: boolean;
    activeIcon: string;
    inactiveIcon: string;
    activeLabel: string;
    inactiveLabel: string;
    onPress: () => void;
    iconFamily: "Ionicons" | "MaterialCommunityIcons";
}

/**
 * Props for the ActionButton component
 */
export interface ActionButtonProps {
    isActive: boolean;
    activeIcon: string;
    inactiveIcon: string;
    activeLabel: string;
    inactiveLabel: string;
    onPress: () => void;
    iconFamily?: "Ionicons" | "MaterialCommunityIcons";
}

/**
 * Props for the RecommendModal component
 */
export interface RecommendModalProps {
    visible: boolean;
    onClose: () => void;
    movie: MovieWithDetails;
    posterUrl: string | null;
    currentUserId: string | undefined;
}

/**
 * State for the recommendation flow
 */
export interface RecommendationState {
    message: string;
    searchQuery: string;
    users: Profile[];
    selectedUser: Profile | null;
    isSending: boolean;
    isLoadingUsers: boolean;
    showUserList: boolean;
}

/**
 * Initial state for recommendation flow
 */
export const INITIAL_RECOMMENDATION_STATE: RecommendationState = {
    message: "",
    searchQuery: "",
    users: [],
    selectedUser: null,
    isSending: false,
    isLoadingUsers: false,
    showUserList: true,
};

/**
 * Result of sending a recommendation
 */
export interface SendRecommendationResult {
    success: boolean;
    error?: string;
}

/**
 * Parameters for sending a recommendation
 */
export interface SendRecommendationParams {
    senderId: string;
    receiverId: string;
    tmdbId: number;
    mediaType: MediaType;
    message: string | null;
}

/**
 * Crew member job titles for filtering
 */
export const DIRECTOR_JOB = "Director" as const;
export const PRODUCER_JOBS = ["Producer", "Executive Producer"] as const;

/**
 * Maximum number of producers to display
 */
export const MAX_PRODUCERS_DISPLAY = 3;

/**
 * Maximum recommendation message length
 */
export const MAX_RECOMMENDATION_MESSAGE_LENGTH = 200;

/**
 * Maximum users to load in recommendation modal
 */
export const MAX_USERS_TO_LOAD = 50;

/**
 * Maximum users in search results
 */
export const MAX_SEARCH_RESULTS = 10;