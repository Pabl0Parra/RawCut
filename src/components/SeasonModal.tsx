import React from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
} from "react-native";

import { Colors } from "../constants/Colors";
import EpisodeListItem from "./EpisodeListItem";
import type { SeasonModalProps } from "../types/tvDetail.types";
import type { Episode } from "../lib/tmdb";

export const SeasonModal: React.FC<SeasonModalProps> = ({
    visible,
    onClose,
    seasonNumber,
    episodes,
    isLoading,
    tvShowId,
    onToggleEpisode,
    onSelectEpisode,
    isEpisodeWatched,
}) => {
    const modalTitle = seasonNumber === null
        ? "Episodios"
        : `Temporada ${seasonNumber}`;

    const handleToggleEpisode = async (episodeNumber: number): Promise<void> => {
        await onToggleEpisode(episodeNumber);
    };

    const renderEpisodeItem = ({ item }: { item: Episode }): React.JSX.Element => {
        const watched = seasonNumber === null
            ? false
            : isEpisodeWatched(seasonNumber, item.episode_number);

        return (
            <EpisodeListItem
                episode={item}
                tvShowId={tvShowId}
                seasonNumber={seasonNumber ?? 0}
                isWatched={watched}
                onToggleWatched={() => handleToggleEpisode(item.episode_number)}
                onPress={() => onSelectEpisode(item)}
            />
        );
    };

    const keyExtractor = (item: Episode): string => item.id.toString();

    const renderContent = (): React.JSX.Element => {
        if (isLoading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.bloodRed} />
                </View>
            );
        }

        return (
            <FlatList
                data={episodes}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                renderItem={renderEpisodeItem}
            />
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
                    <Text style={styles.title}>{modalTitle}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                </View>

                {renderContent()}
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
        alignItems: "center",
        marginBottom: 24,
        marginHorizontal: 16,
    } as ViewStyle,
    title: {
        color: Colors.textPrimary,
        fontSize: 24,
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
    closeButton: {
        color: Colors.bloodRed,
        fontSize: 18,
        marginRight: 16,
    } as TextStyle,
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    listContent: {
        paddingBottom: 20,
    } as ViewStyle,
});

export default SeasonModal;