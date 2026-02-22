import type { Movie, Credits, Genre } from "../lib/tmdb";
import type { Profile } from "../lib/supabase";

export interface MovieWithDetails extends Movie {
    genres: Genre[];
    credits?: Credits;
    runtime?: number;
}

export interface MovieLoadResult {
    movie: MovieWithDetails;
    relatedMovies: Movie[];
    trailerKey: string | null;
}

export type MediaType = "movie" | "tv";

export interface ActionButtonConfig {
    isActive: boolean;
    activeIcon: string;
    inactiveIcon: string;
    activeLabel: string;
    inactiveLabel: string;
    onPress: () => void;
    iconFamily: "Ionicons" | "MaterialCommunityIcons";
}

export interface ActionButtonProps {
    isActive: boolean;
    activeIcon: string;
    inactiveIcon: string;
    activeLabel: string;
    inactiveLabel: string;
    onPress: () => void;
    iconFamily?: "Ionicons" | "MaterialCommunityIcons";
}

export interface RecommendModalProps {
    visible: boolean;
    onClose: () => void;
    movie: MovieWithDetails;
    posterUrl: string | null;
    currentUserId: string | undefined;
}

export interface RecommendationState {
    message: string;
    searchQuery: string;
    users: Profile[];
    selectedUser: Profile | null;
    isSending: boolean;
    isLoadingUsers: boolean;
    showUserList: boolean;
}

export const INITIAL_RECOMMENDATION_STATE: RecommendationState = {
    message: "",
    searchQuery: "",
    users: [],
    selectedUser: null,
    isSending: false,
    isLoadingUsers: false,
    showUserList: true,
};

export interface SendRecommendationResult {
    success: boolean;
    error?: string;
}

export interface SendRecommendationParams {
    senderId: string;
    receiverId: string;
    tmdbId: number;
    mediaType: MediaType;
    message: string | null;
}

export const DIRECTOR_JOB = "Director" as const;
export const PRODUCER_JOBS = ["Producer", "Executive Producer"] as const;

export const MAX_PRODUCERS_DISPLAY = 3;

export const MAX_RECOMMENDATION_MESSAGE_LENGTH = 200;

export const MAX_USERS_TO_LOAD = 50;

export const MAX_SEARCH_RESULTS = 10;