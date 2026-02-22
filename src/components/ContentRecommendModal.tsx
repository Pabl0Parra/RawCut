import React from "react";
import { BaseRecommendModal } from "./BaseRecommendModal";
import type { BaseRecommendModalProps } from "./BaseRecommendModal";
import type { GenericRecommendModalProps } from "../types/tvDetail.types";

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
        enableSearch: false, 
    };

    return <BaseRecommendModal {...baseProps} />;
};

export default ContentRecommendModal;