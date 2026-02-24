import type { Profile, Recommendation, RecommendationComment, Rating } from "../lib/supabase";

export type MediaType = "movie" | "tv";

export type RecommendationTab = "received" | "sent";

export interface RecommendationWithRelations extends Recommendation {
    sender: Profile | null;
    receiver: Profile | null;
    comments: RecommendationComment[];
    rating: Rating | null;
}

export interface TmdbContentData {
    title: string;
    poster: string | null;
}

export type TmdbDataMap = Record<string, TmdbContentData>;

export const createTmdbCacheKey = (mediaType: MediaType, tmdbId: number): string => {
    return `${mediaType}-${tmdbId}`;
};

export interface RecommendationCardProps {
    item: RecommendationWithRelations;
    tmdbData: TmdbContentData;
    isExpanded: boolean;
    isReceived: boolean;
    currentUserId: string | undefined;
    onToggleExpand: (id: string) => void;
    onAddComment: (recommendationId: string, text: string) => Promise<boolean>;
    onMarkCommentsRead: (recommendationId: string) => void;
    onDeleteComment: (recommendationId: string, commentId: string) => Promise<boolean>;
    onDeleteRecommendation: (recommendationId: string) => Promise<boolean>;
}

export interface RecommendationsScreenState {
    activeTab: RecommendationTab;
    tmdbData: TmdbDataMap;
    expandedId: string | null;
    newComment: string;
    isSendingComment: boolean;
}

export const INITIAL_RECOMMENDATIONS_STATE: RecommendationsScreenState = {
    activeTab: "received",
    tmdbData: {},
    expandedId: null,
    newComment: "",
    isSendingComment: false,
};

export const MAX_COMMENT_LENGTH = 500;

export const DEFAULT_TMDB_DATA: TmdbContentData = {
    title: "Sin título",
    poster: null,
};

export const LOADING_TMDB_DATA: TmdbContentData = {
    title: "Cargando...",
    poster: null,
};