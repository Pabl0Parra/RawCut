import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { getImageUrl } from '../lib/tmdb';
import { detailScreenStyles } from '../styles/detailScreenStyles';

interface ContentItem {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    vote_average: number;
}

interface ContentHorizontalListProps {
    data: ContentItem[];
    title: string;
    mediaType: "movie" | "tv";
}

export const ContentHorizontalList: React.FC<ContentHorizontalListProps> = ({
    data,
    title,
    mediaType
}) => {
    if (!data || data.length === 0) return null;

    const formatRating = (rating: number) => {
        return rating > 0 ? rating.toFixed(1) : "N/A";
    };

    const renderItem = ({ item }: { item: ContentItem }) => {
        const posterUrl = getImageUrl(item.poster_path, "w300");
        const displayName = item.title || item.name || "Sin título";

        return (
            <TouchableOpacity
                style={detailScreenStyles.mediaItem}
                onPress={() => router.push(`/${mediaType}/${item.id}`)}
            >
                {posterUrl ? (
                    <Image
                        source={{ uri: posterUrl }}
                        style={detailScreenStyles.mediaImage}
                        contentFit="cover"
                    />
                ) : (
                    <View style={detailScreenStyles.mediaPlaceholder}>
                        <Text style={detailScreenStyles.mediaPlaceholderIcon}>
                            {mediaType === "movie" ? "🎬" : "📺"}
                        </Text>
                    </View>
                )}
                <Text style={detailScreenStyles.mediaName} numberOfLines={2}>
                    {displayName}
                </Text>
                <Text style={detailScreenStyles.mediaSubtitle} numberOfLines={1}>
                    ⭐ {formatRating(item.vote_average)}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={detailScreenStyles.sectionContainer}>
            <Text style={detailScreenStyles.sectionTitle}>{title}</Text>
            <FlatList
                data={data}
                keyExtractor={(item, index) => `${mediaType}-${item.id}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={detailScreenStyles.horizontalList}
                renderItem={renderItem}
            />
        </View>
    );
};
