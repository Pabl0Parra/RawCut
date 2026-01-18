import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { getImageUrl } from '../lib/tmdb';
import { detailScreenStyles } from '../styles/detailScreenStyles';

interface CastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
}

interface CastMemberListProps {
    cast: CastMember[];
    title?: string;
}

export const CastMemberList: React.FC<CastMemberListProps> = ({ cast, title = "Reparto" }) => {
    if (!cast || cast.length === 0) return null;

    const renderCastItem = ({ item }: { item: CastMember }) => {
        const profileUrl = getImageUrl(item.profile_path, "w200");

        return (
            <View style={detailScreenStyles.mediaItem}>
                {profileUrl ? (
                    <Image
                        source={{ uri: profileUrl }}
                        style={detailScreenStyles.mediaImage}
                        contentFit="cover"
                    />
                ) : (
                    <View style={detailScreenStyles.mediaPlaceholder}>
                        <Text style={detailScreenStyles.mediaPlaceholderIcon}>👤</Text>
                    </View>
                )}
                <Text style={detailScreenStyles.mediaName} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={detailScreenStyles.mediaSubtitle} numberOfLines={2}>
                    {item.character}
                </Text>
            </View>
        );
    };

    return (
        <View style={detailScreenStyles.sectionContainer}>
            <Text style={detailScreenStyles.sectionTitle}>{title}</Text>
            <FlatList
                data={cast}
                keyExtractor={(item, index) => `cast-${item.id}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={detailScreenStyles.horizontalList}
                renderItem={renderCastItem}
            />
        </View>
    );
};
