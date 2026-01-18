import React from "react";
import { BaseRecommendModal } from "./BaseRecommendModal";
import type { BaseRecommendModalProps } from "./BaseRecommendModal";
import type { Movie } from "../lib/tmdb";
import { extractYear } from "../utils/movieDetail.utils";

/**
 * Props for RecommendModal (movie-specific)
 */
export interface RecommendModalProps {
    visible: boolean;
    onClose: () => void;
    movie: Movie;
    posterUrl: string | null;
    currentUserId: string | undefined;
}

/**
 * Movie recommendation modal with search functionality
 * Wraps BaseRecommendModal with movie-specific props
 */
export const RecommendModal: React.FC<RecommendModalProps> = ({
    visible,
    onClose,
    movie,
    posterUrl,
    currentUserId,
}) => {
    const baseProps: BaseRecommendModalProps = {
        visible,
        onClose,
        contentId: movie.id,
        contentTitle: movie.title,
        contentYear: extractYear(movie.release_date),
        posterUrl,
        mediaType: "movie",
        currentUserId,
        enableSearch: true, // Enable search for movie modal
    };

    return <BaseRecommendModal {...baseProps} />;
};

export default RecommendModal;