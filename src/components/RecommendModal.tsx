import React from "react";
import { BaseRecommendModal } from "./BaseRecommendModal";
import type { BaseRecommendModalProps } from "./BaseRecommendModal";
import type { Movie } from "../lib/tmdb";
import { extractYear } from "../utils/movieDetail.utils";

export interface RecommendModalProps {
    visible: boolean;
    onClose: () => void;
    movie: Movie;
    posterUrl: string | null;
    currentUserId: string | undefined;
}

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
        enableSearch: true, 
    };

    return <BaseRecommendModal {...baseProps} />;
};

export default RecommendModal;