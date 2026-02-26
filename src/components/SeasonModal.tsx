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
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
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
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.modalHandleContainer}>
                    <View style={styles.modalHandle} />
                </View>
                <View style={styles.header}>
                    <Text style={styles.title}>{modalTitle}</Text>
                    <TouchableOpacity
                        onPress={onClose}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                        <Ionicons name="close" size={24} color={Colors.bloodRed} />
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
        backgroundColor: Colors.panelBackground,
        padding: 16,
        paddingTop: 8,
    } as ViewStyle,
    modalHandleContainer: {
        width: "100%",
        height: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    } as ViewStyle,
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#ffffff22",
        borderRadius: 2,
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