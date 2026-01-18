import type { Profile, Recommendation, RecommendationComment, Rating } from "../lib/supabase";

/**
 * Media type union
 */
export type MediaType = "movie" | "tv";

/**
 * Tab type for recommendations screen
 */
export type RecommendationTab = "received" | "sent";

/**
 * Extended recommendation with joined relations
 * This represents the data shape returned from the store with populated relations
 */
export interface RecommendationWithRelations extends Recommendation {
    sender: Profile | null;
    receiver: Profile | null;
    comments: RecommendationComment[];
    rating: Rating | null;
}

/**
 * TMDb content data (minimal info needed for display)
 */
export interface TmdbContentData {
    title: string;
    poster: string | null;
}

/**
 * Map of TMDb content data keyed by "mediaType-tmdbId"
 */
export type TmdbDataMap = Record<string, TmdbContentData>;

/**
 * Creates a cache key for TMDb data
 */
export const createTmdbCacheKey = (mediaType: MediaType, tmdbId: number): string => {
    return `${mediaType}-${tmdbId}`;
};

/**
 * Props for StarRating component
 */
export interface StarRatingProps {
    recommendationId: string;
    currentRating: number;
    canRate: boolean;
    onRate: (recommendationId: string, rating: number) => void;
}

/**
 * Props for RecommendationCard component
 */
export interface RecommendationCardProps {
    item: RecommendationWithRelations;
    tmdbData: TmdbContentData;
    isExpanded: boolean;
    isReceived: boolean;
    currentUserId: string | undefined;
    onToggleExpand: (id: string) => void;
    onAddComment: (recommendationId: string, text: string) => Promise<boolean>;
    onAddRating: (recommendationId: string, rating: number) => Promise<void>;
    onMarkCommentsRead: (recommendationId: string) => void;
}

/**
 * State for the recommendations screen
 */
export interface RecommendationsScreenState {
    activeTab: RecommendationTab;
    tmdbData: TmdbDataMap;
    expandedId: string | null;
    newComment: string;
    isSendingComment: boolean;
}

/**
 * Initial state for recommendations screen
 */
export const INITIAL_RECOMMENDATIONS_STATE: RecommendationsScreenState = {
    activeTab: "received",
    tmdbData: {},
    expandedId: null,
    newComment: "",
    isSendingComment: false,
};

/**
 * Star rating values
 */
export const STAR_RATINGS = [1, 2, 3, 4, 5] as const;

/**
 * Maximum comment length
 */
export const MAX_COMMENT_LENGTH = 500;

/**
 * Default TMDb data when loading fails
 */
export const DEFAULT_TMDB_DATA: TmdbContentData = {
    title: "Sin título",
    poster: null,
};

/**
 * Loading placeholder for TMDb data
 */
export const LOADING_TMDB_DATA: TmdbContentData = {
    title: "Cargando...",
    poster: null,
};