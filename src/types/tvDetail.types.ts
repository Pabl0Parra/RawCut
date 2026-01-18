import type { TVShow, Season, Episode, Credits, Video, Genre, CastMember } from "../lib/tmdb";
import type { Profile } from "../lib/supabase";

/**
 * Extended TVShow type with full details from TMDb API
 */
export interface TVShowWithDetails extends TVShow {
    genres: Genre[];
}

/**
 * Result of loading all TV show data
 */
export interface TVShowLoadResult {
    tvShow: TVShowWithDetails;
    relatedShows: TVShow[];
    trailerKey: string | null;
}

/**
 * Season with simplified structure for progress tracking
 */
export interface SeasonProgressInfo {
    season_number: number;
    episode_count: number;
}

/**
 * Next episode to watch info
 */
export interface NextEpisodeInfo {
    season: number;
    episode: number;
}

/**
 * Props for SeasonCard component
 */
export interface SeasonCardProps {
    season: Season;
    tvShowId: number;
    isWatched: boolean;
    onPress: (seasonNumber: number) => void;
}

/**
 * Props for SeasonModal component
 */
export interface SeasonModalProps {
    visible: boolean;
    onClose: () => void;
    seasonNumber: number | null;
    episodes: Episode[];
    isLoading: boolean;
    tvShowId: number;
    onToggleEpisode: (episodeNumber: number) => Promise<void>;
    onSelectEpisode: (episode: Episode) => void;
    isEpisodeWatched: (seasonNumber: number, episodeNumber: number) => boolean;
}

/**
 * Props for EpisodeModal component
 */
export interface EpisodeModalProps {
    visible: boolean;
    onClose: () => void;
    episode: Episode | null;
}

/**
 * Props for EpisodeListItem component
 */
export interface EpisodeListItemProps {
    episode: Episode;
    tvShowId: number;
    seasonNumber: number;
    isWatched: boolean;
    onToggleWatched: () => void;
    onPress: () => void;
}

/**
 * Generic RecommendModal props that work for both movies and TV
 */
export interface GenericRecommendModalProps {
    visible: boolean;
    onClose: () => void;
    contentId: number;
    contentTitle: string;
    contentYear: string;
    posterUrl: string | null;
    mediaType: "movie" | "tv";
    currentUserId: string | undefined;
}

/**
 * State for TV detail screen
 */
export interface TVDetailScreenState {
    tvShow: TVShowWithDetails | null;
    relatedShows: TVShow[];
    trailerKey: string | null;
    isLoading: boolean;
    showRecommendModal: boolean;
    showTrailerModal: boolean;
    showSeasonModal: boolean;
    showEpisodeModal: boolean;
    selectedSeasonNumber: number | null;
    seasonEpisodes: Episode[];
    isLoadingSeason: boolean;
    selectedEpisode: Episode | null;
}

/**
 * Initial state for TV detail screen
 */
export const INITIAL_TV_DETAIL_STATE: TVDetailScreenState = {
    tvShow: null,
    relatedShows: [],
    trailerKey: null,
    isLoading: true,
    showRecommendModal: false,
    showTrailerModal: false,
    showSeasonModal: false,
    showEpisodeModal: false,
    selectedSeasonNumber: null,
    seasonEpisodes: [],
    isLoadingSeason: false,
    selectedEpisode: null,
};

/**
 * Media type constant
 */
export const TV_MEDIA_TYPE = "tv" as const;

/**
 * Producer job titles for filtering
 */
export const PRODUCER_JOBS = ["Producer", "Executive Producer"] as const;

/**
 * Maximum producers to display
 */
export const MAX_PRODUCERS_DISPLAY = 3;