import {
    getTVShowDetails,
    getRelatedTVShows,
    getTVSeasonDetails,
    getTVVideos,
    getImageUrl,
    type Video,
    type Episode,
    type Season,
    type CrewMember,
} from "../lib/tmdb";
import type {
    TVShowWithDetails,
    TVShowLoadResult,
    SeasonProgressInfo,
} from "../types/tvDetail.types";
import { PRODUCER_JOBS, MAX_PRODUCERS_DISPLAY } from "../types/tvDetail.types";

export const findBestTrailer = (videos: Video[]): Video | undefined => {
    const officialTrailer = videos.find(
        (video) =>
            video.type === "Trailer" &&
            video.site === "YouTube" &&
            video.official
    );

    return officialTrailer ?? videos.find(
        (video) => video.type === "Trailer" && video.site === "YouTube"
    );
};

export const extractTrailerKey = (videos: Video[]): string | null => {
    const trailer = findBestTrailer(videos);
    return trailer?.key ?? null;
};

export const loadTVShowData = async (
    tvId: number
): Promise<TVShowLoadResult> => {
    const [tvShowDetails, relatedResponse, videosResponse] = await Promise.all([
        getTVShowDetails(tvId),
        getRelatedTVShows(tvId),
        getTVVideos(tvId),
    ]);

    return {
        tvShow: tvShowDetails,
        relatedShows: relatedResponse.results,
        trailerKey: extractTrailerKey(videosResponse.results),
    };
};

export const loadSeasonEpisodes = async (
    tvId: number,
    seasonNumber: number
): Promise<Episode[]> => {
    const data = await getTVSeasonDetails(tvId, seasonNumber);
    return data.episodes;
};

export const extractYear = (firstAirDate: string | undefined): string => {
    if (!firstAirDate) return "";
    return firstAirDate.split("-")[0];
};

export const formatRating = (voteAverage: number): string => {
    return voteAverage.toFixed(1);
};

export const seasonsToProgressInfo = (
    seasons: Season[] | undefined
): SeasonProgressInfo[] => {
    if (!seasons) return [];

    return seasons.map((season) => ({
        season_number: season.season_number,
        episode_count: season.episode_count,
    }));
};

export const getCreators = (
    createdBy: TVShowWithDetails["created_by"] | undefined
): string => {
    if (!createdBy || createdBy.length === 0) return "";
    return createdBy.map((creator) => creator.name).join(", ");
};

export const getProducers = (
    crew: CrewMember[] | undefined
): CrewMember[] => {
    if (!crew) return [];
    return crew
        .filter((member) => PRODUCER_JOBS.includes(member.job as typeof PRODUCER_JOBS[number]))
        .slice(0, MAX_PRODUCERS_DISPLAY);
};

export const formatCrewNames = (crewMembers: CrewMember[]): string => {
    return crewMembers.map((member) => member.name).join(", ");
};

export const getPosterUrl = (
    posterPath: string | null,
    size: "w200" | "w300" | "w500" = "w300"
): string | null => {
    return getImageUrl(posterPath, size);
};

export const getBackdropUrl = (backdropPath: string | null): string | null => {
    return getImageUrl(backdropPath, "original");
};

export const getStillUrl = (
    stillPath: string | null,
    size: "w300" | "w500" = "w300"
): string | null => {
    return getImageUrl(stillPath, size);
};

export const parseTVShowId = (id: string | undefined): number | null => {
    if (!id) return null;
    const parsed = Number.parseInt(id, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

export const hasCreators = (
    createdBy: TVShowWithDetails["created_by"] | undefined
): boolean => {
    return !!createdBy && createdBy.length > 0;
};

export const hasProducers = (crew: CrewMember[] | undefined): boolean => {
    return getProducers(crew).length > 0;
};

export const isNotNull = <T>(value: T | null): value is T => value !== null;