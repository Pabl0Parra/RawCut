import React from "react";
import { BaseRecommendModal } from "./BaseRecommendModal";
import type { BaseRecommendModalProps } from "./BaseRecommendModal";
import type { GenericRecommendModalProps } from "../types/tvDetail.types";

/**
 * Generic content recommendation modal (for movies and TV shows)
 * Wraps BaseRecommendModal without search functionality
 */
export const ContentRecommendModal: React.FC<GenericRecommendModalProps> = ({
    visible,
    onClose,
    contentId,
    contentTitle,
    contentYear,
    posterUrl,
    mediaType,
    currentUserId,
}) => {
    const baseProps: BaseRecommendModalProps = {
        visible,
        onClose,
        contentId,
        contentTitle,
        contentYear,
        posterUrl,
        mediaType,
        currentUserId,
        enableSearch: false, // No search for generic modal
    };

    return <BaseRecommendModal {...baseProps} />;
};

export default ContentRecommendModal;