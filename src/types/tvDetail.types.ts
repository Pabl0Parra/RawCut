import type { TVShow, Season, Episode, Genre } from "../lib/tmdb";

export interface TVShowWithDetails extends TVShow {
    genres: Genre[];
}

export interface TVShowLoadResult {
    tvShow: TVShowWithDetails;
    relatedShows: TVShow[];
    trailerKey: string | null;
}

export interface SeasonProgressInfo {
    season_number: number;
    episode_count: number;
}

export interface NextEpisodeInfo {
    season: number;
    episode: number;
}

export interface SeasonCardProps {
    season: Season;
    tvShowId: number;
    isWatched: boolean;
    onPress: (seasonNumber: number) => void;
}

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

export interface EpisodeModalProps {
    visible: boolean;
    onClose: () => void;
    episode: Episode | null;
}

export interface EpisodeListItemProps {
    episode: Episode;
    tvShowId: number;
    seasonNumber: number;
    isWatched: boolean;
    onToggleWatched: () => void;
    onPress: () => void;
}

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

export const TV_MEDIA_TYPE = "tv" as const;

export const PRODUCER_JOBS = ["Producer", "Executive Producer"] as const;

export const MAX_PRODUCERS_DISPLAY = 3;