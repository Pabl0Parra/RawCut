import React from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { Image } from "expo-image";

import { Colors } from "../constants/Colors";
import type { EpisodeModalProps } from "../types/tvDetail.types";
import { getStillUrl, formatRating } from "../utils/tvDetail.utils";

export const EpisodeModal: React.FC<EpisodeModalProps> = ({
    visible,
    onClose,
    episode,
}) => {
    if (!episode) {
        return null;
    }

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
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title} numberOfLines={2}>
                        {modalTitle}
                    </Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {renderStill()}

                    <Text style={styles.meta}>
                        Emitido: {episode.air_date}
                    </Text>
                    <Text style={styles.rating}>
                        ⭐ {formatRating(episode.vote_average)}/10
                    </Text>

                    <Text style={styles.sectionTitle}>Sinopsis</Text>
                    <Text style={styles.overview}>
                        {episode.overview || "Sin descripción disponible para este episodio."}
                    </Text>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
        padding: 16,
    } as ViewStyle,
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 24,
        marginHorizontal: 16,
        gap: 16,
    } as ViewStyle,
    title: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: 24,
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
    closeButton: {
        color: Colors.bloodRed,
        fontSize: 18,
        marginRight: 16,
    } as TextStyle,
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