import {
    getMovieDetails,
    getTVShowDetails,
    getImageUrl,
} from "../lib/tmdb";
import type {
    MediaType,
    TmdbContentData,
    TmdbDataMap,
    RecommendationWithRelations,
} from "../types/recommendations.types";
import {
    createTmdbCacheKey,
    DEFAULT_TMDB_DATA,
} from "../types/recommendations.types";

export const fetchTmdbDataForItem = async (
    mediaType: MediaType,
    tmdbId: number
): Promise<TmdbContentData> => {
    try {
        if (mediaType === "movie") {
            const details = await getMovieDetails(tmdbId);
            if (!details) throw new Error("TMDb item not found");
            return {
                title: details.title,
                poster: details.poster_path,
            };
        }

        const details = await getTVShowDetails(tmdbId);
        if (!details) throw new Error("TMDb item not found");
        return {
            title: details.name,
            poster: details.poster_path,
        };
    } catch (err) {
        console.warn(`[recommendations] TMDb unavailable for ${mediaType}/${tmdbId}:`, err);
        return DEFAULT_TMDB_DATA;
    }
};

export const fetchTmdbDataBatch = async (
    recommendations: RecommendationWithRelations[],
    existingCache: TmdbDataMap
): Promise<TmdbDataMap> => {
    const newData: TmdbDataMap = {};

    
    const itemsToFetch: Array<{ key: string; mediaType: MediaType; tmdbId: number }> = [];

    for (const rec of recommendations) {
        const key = createTmdbCacheKey(rec.media_type, rec.tmdb_id);

        if (!existingCache[key] && !newData[key]) {
            itemsToFetch.push({
                key,
                mediaType: rec.media_type,
                tmdbId: rec.tmdb_id,
            });
        }
    }

    
    const fetchPromises = itemsToFetch.map(async ({ key, mediaType, tmdbId }) => {
        const data = await fetchTmdbDataForItem(mediaType, tmdbId);
        return { key, data };
    });

    const results = await Promise.all(fetchPromises);

    for (const { key, data } of results) {
        newData[key] = data;
    }

    return newData;
};

export const getPosterUrl = (poster: string | null): string | null => {
    return getImageUrl(poster, "w200");
};

export const getMediaTypeIcon = (mediaType: MediaType): string => {
    return mediaType === "movie" ? "🎬" : "📺";
};

export const getSenderFromReceived = (
    recommendation: RecommendationWithRelations
): RecommendationWithRelations["sender"] => {
    return recommendation.sender;
};

export const getReceiverFromSent = (
    recommendation: RecommendationWithRelations
): RecommendationWithRelations["receiver"] => {
    return recommendation.receiver;
};

export const formatReceivedUserDisplay = (
    recommendation: RecommendationWithRelations
): string => {
    const sender = getSenderFromReceived(recommendation);
    const username = sender?.username ?? "desconocido";
    return `De: @${username}`;
};

export const formatSentUserDisplay = (
    recommendation: RecommendationWithRelations
): string => {
    const receiver = getReceiverFromSent(recommendation);
    const username = receiver?.username ?? "desconocido";
    return `Para: @${username}`;
};

export const hasUnreadReceivedContent = (
    recommendation: RecommendationWithRelations,
    currentUserId: string | undefined
): boolean => {
    
    if (!recommendation.is_read) {
        return true;
    }

    
    const hasUnreadComments = recommendation.comments?.some(
        (comment) => comment.user_id !== currentUserId && !comment.is_read
    );

    return hasUnreadComments ?? false;
};

export const hasUnreadSentContent = (
    recommendation: RecommendationWithRelations,
    currentUserId: string | undefined
): boolean => {
    
    const hasUnreadComments = recommendation.comments?.some(
        (comment) => comment.user_id !== currentUserId && !comment.is_read
    );

    return hasUnreadComments ?? false;
};

export const getCommentAuthorDisplay = (
    commentUserId: string,
    currentUserId: string | undefined,
    otherUsername: string | undefined
): string => {
    if (commentUserId === currentUserId) {
        return "Tú";
    }
    return `@${otherUsername ?? "usuario"}`;
};

export const buildContentPath = (
    mediaType: MediaType,
    tmdbId: number
): string => {
    return mediaType === "movie" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
};

export const canSendComment = (
    comment: string,
    isSending: boolean
): boolean => {
    return comment.trim().length > 0 && !isSending;
};

export const canRateReceivedRecommendation = (
    currentRating: number | undefined
): boolean => {
    return currentRating === undefined;
};

export const canRateSentRecommendation = (): boolean => {
    return false;
};

export const isNotNullish = <T>(value: T | null | undefined): value is T => {
    return value !== null && value !== undefined;
};