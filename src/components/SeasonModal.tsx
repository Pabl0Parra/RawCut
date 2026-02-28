import React from "react";
import {
    View,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    type ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "../constants/Colors";
import { ModalShell } from "./ModalShell";
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
    const { t } = useTranslation();

    const modalTitle = seasonNumber === null
        ? t("details.episodes")
        : `${t("details.season")} ${seasonNumber}`;

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
        <ModalShell visible={visible} onClose={onClose} title={modalTitle}>
            {renderContent()}
        </ModalShell>
    );
};

const styles = StyleSheet.create({
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