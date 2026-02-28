import React, { JSX } from "react";
import {
    FlatList,
    StyleSheet,
    type ViewStyle,
} from "react-native";
import MovieCard from "./MovieCard";
import { UnauthenticatedState, LoadingState, EmptyState } from "./ContentLayoutStates";
import type { EnrichedContentItem } from "../hooks/useEnrichedContent";

interface ContentGridLayoutProps {
    readonly data: EnrichedContentItem[];
    readonly isLoading: boolean;
    readonly isAuthenticated: boolean;
    readonly emptyTitle: string;
    readonly emptySubtitle: string;
    readonly emptyIcon: string;
    readonly emptyAsset?: any;
    readonly onToggleFavorite?: (tmdbId: number, mediaType: "movie" | "tv") => void;
    readonly onToggleWatchlist?: (tmdbId: number, mediaType: "movie" | "tv") => void;
    readonly onToggleWatched?: (tmdbId: number, mediaType: "movie" | "tv") => void;
    readonly isFavorite?: (tmdbId: number, mediaType: "movie" | "tv") => boolean;
    readonly isInWatchlist?: (tmdbId: number, mediaType: "movie" | "tv") => boolean;
    readonly isWatched?: (tmdbId: number, mediaType: "movie" | "tv") => boolean;
}

export function ContentGridLayout({
    data,
    isLoading,
    isAuthenticated,
    emptyTitle,
    emptySubtitle,
    emptyIcon,
    emptyAsset,
    onToggleFavorite,
    onToggleWatchlist,
    onToggleWatched,
    isFavorite,
    isInWatchlist,
    isWatched,
}: Readonly<ContentGridLayoutProps>): JSX.Element {
    if (!isAuthenticated) {
        return (
            <UnauthenticatedState
                message="Inicia sesión para ver tu lista"
                buttonLabel="Iniciar Sesión"
            />
        );
    }

    if (isLoading && data.length === 0) {
        return <LoadingState />;
    }

    if (data.length === 0) {
        return (
            <EmptyState
                title={emptyTitle}
                subtitle={emptySubtitle}
                icon={emptyIcon}
                asset={emptyAsset}
            />
        );
    }

    const renderItem = ({ item }: { item: EnrichedContentItem }): JSX.Element => {
        const cardItem = {
            id: item.tmdb_id,
            title: item.title,
            name: item.title,
            poster_path: item.poster_path,
            backdrop_path: null,
            vote_average: item.vote_average,
            release_date: "",
            first_air_date: "",
            overview: "",
            original_title: item.title,
            original_name: item.title,
            vote_count: 0,
            genre_ids: [],
            popularity: 0,
            original_language: "en",
        };

        return (
            <MovieCard
                item={cardItem}
                mediaType={item.media_type}
                isFavorite={isFavorite?.(item.tmdb_id, item.media_type)}
                inWatchlist={isInWatchlist?.(item.tmdb_id, item.media_type)}
                isWatched={isWatched?.(item.tmdb_id, item.media_type)}
                onToggleFavorite={
                    onToggleFavorite
                        ? () => onToggleFavorite(item.tmdb_id, item.media_type)
                        : undefined
                }
                onToggleWatchlist={
                    onToggleWatchlist
                        ? () => onToggleWatchlist(item.tmdb_id, item.media_type)
                        : undefined
                }
                onToggleWatched={
                    onToggleWatched
                        ? () => onToggleWatched(item.tmdb_id, item.media_type)
                        : undefined
                }
            />
        );
    };

    return (
        <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.media_type}-${item.tmdb_id}`}
            numColumns={3}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
        />
    );
}

const styles = StyleSheet.create({
    columnWrapper: {
        paddingHorizontal: 8,
        gap: 12,
    } as ViewStyle,
    listContent: {
        paddingBottom: 20,
    } as ViewStyle,
});

export default ContentGridLayout;