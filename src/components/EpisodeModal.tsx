import React from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

import { Colors } from "../constants/Colors";
import { ModalShell } from "./ModalShell";
import type { EpisodeModalProps } from "../types/tvDetail.types";
import { getStillUrl, formatRating } from "../utils/tvDetail.utils";

export const EpisodeModal: React.FC<EpisodeModalProps> = ({
    visible,
    onClose,
    episode,
}) => {
    const { t } = useTranslation();

    if (!episode) return null;

    const modalTitle = `${episode.episode_number}. ${episode.name}`;
    const stillUrl = getStillUrl(episode.still_path, "w500");

    const renderStill = (): React.JSX.Element => {
        if (stillUrl) {
            return (
                <Image
                    source={{ uri: stillUrl }}
                    style={styles.image}
                    contentFit="cover"
                />
            );
        }

        return (
            <View style={styles.placeholder}>
                <Text style={styles.placeholderIcon}>📺</Text>
            </View>
        );
    };

    return (
        <ModalShell visible={visible} onClose={onClose} title={modalTitle} titleNumberOfLines={2}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderStill()}

                <Text style={styles.meta}>
                    {t("details.aired")}: {episode.air_date}
                </Text>
                <Text style={styles.rating}>
                    ⭐ {formatRating(episode.vote_average)}/10
                </Text>

                <Text style={styles.sectionTitle}>{t("details.overview")}</Text>
                <Text style={styles.overview}>
                    {episode.overview || t("details.noOverview")}
                </Text>
            </ScrollView>
        </ModalShell>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 40,
    } as ViewStyle,
    image: {
        width: "100%",
        height: 200,
        borderRadius: 8,
        marginBottom: 16,
    } as ImageStyle,
    placeholder: {
        width: "100%",
        height: 200,
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: Colors.metalGray,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    placeholderIcon: {
        fontSize: 40,
    } as TextStyle,
    meta: {
        color: Colors.metalGold,
        fontSize: 14,
        marginBottom: 4,
    } as TextStyle,
    rating: {
        color: Colors.tmdbYellow,
        fontSize: 18,
        marginTop: 8,
    } as TextStyle,
    sectionTitle: {
        color: Colors.textPrimary,
        fontSize: 18,
        marginTop: 24,
        marginBottom: 8,
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
    overview: {
        color: Colors.metalSilver,
        lineHeight: 24,
    } as TextStyle,
});

export default EpisodeModal;