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

/**
 * Fetches TMDb data for a single item
 */
export const fetchTmdbDataForItem = async (
    mediaType: MediaType,
    tmdbId: number
): Promise<TmdbContentData> => {
    try {
        if (mediaType === "movie") {
            const details = await getMovieDetails(tmdbId);
            return {
                title: details.title,
                poster: details.poster_path,
            };
        }

        const details = await getTVShowDetails(tmdbId);
        return {
            title: details.name,
            poster: details.poster_path,
        };
    } catch (err) {
        console.error(`Error fetching TMDb data for ${mediaType}/${tmdbId}:`, err);
        return DEFAULT_TMDB_DATA;
    }
};

/**
 * Fetches TMDb data for multiple recommendations
 * Only fetches items not already in the cache
 */
export const fetchTmdbDataBatch = async (
    recommendations: RecommendationWithRelations[],
    existingCache: TmdbDataMap
): Promise<TmdbDataMap> => {
    const newData: TmdbDataMap = {};

    // Collect unique items that need fetching
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

    // Fetch all items in parallel
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

/**
 * Gets the poster URL for TMDb content
 */
export const getPosterUrl = (poster: string | null): string | null => {
    return getImageUrl(poster, "w200");
};

/**
 * Gets the icon for a media type
 */
export const getMediaTypeIcon = (mediaType: MediaType): string => {
    return mediaType === "movie" ? "🎬" : "📺";
};

/**
 * Gets the "other user" in a recommendation (sender for received, receiver for sent)
 */
export const getOtherUser = (
    recommendation: RecommendationWithRelations,
    isReceived: boolean
): RecommendationWithRelations["sender"] => {
    return isReceived ? recommendation.sender : recommendation.receiver;
};

/**
 * Formats the user display text for a recommendation
 */
export const formatUserDisplay = (
    recommendation: RecommendationWithRelations,
    isReceived: boolean
): string => {
    const otherUser = getOtherUser(recommendation, isReceived);
    const username = otherUser?.username ?? "desconocido";
    const prefix = isReceived ? "De" : "Para";
    return `${prefix}: @${username}`;
};

/**
 * Checks if a recommendation has unread content
 */
export const hasUnreadContent = (
    recommendation: RecommendationWithRelations,
    isReceived: boolean,
    currentUserId: string | undefined
): boolean => {
    // Unread if received and not read
    if (isReceived && !recommendation.is_read) {
        return true;
    }

    // Unread if there are unread comments from the other user
    const hasUnreadComments = recommendation.comments?.some(
        (comment) => comment.user_id !== currentUserId && !comment.is_read
    );

    return hasUnreadComments ?? false;
};

/**
 * Gets the comment author display name
 */
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

/**
 * Builds the navigation path for a recommendation's content
 */
export const buildContentPath = (
    mediaType: MediaType,
    tmdbId: number
): string => {
    return mediaType === "movie" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
};

/**
 * Checks if a comment can be sent
 */
export const canSendComment = (
    comment: string,
    isSending: boolean
): boolean => {
    return comment.trim().length > 0 && !isSending;
};

/**
 * Checks if user can rate a recommendation
 */
export const canRateRecommendation = (
    isReceived: boolean,
    currentRating: number | undefined
): boolean => {
    return isReceived && currentRating === undefined;
};

/**
 * Type guard to filter out null/undefined values
 */
export const isNotNullish = <T>(value: T | null | undefined): value is T => {
    return value !== null && value !== undefined;
};