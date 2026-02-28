import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { getImageUrl } from '../lib/tmdb';
import { detailScreenStyles } from '../styles/detailScreenStyles';

interface PersonListItem {
    id: number;
    name: string;
    subtitle: string;
    profile_path: string | null;
}

interface PersonListProps {
    items: PersonListItem[];
    title: string;
    keyPrefix: string;
}

export const PersonList: React.FC<PersonListProps> = ({ items, title, keyPrefix }) => {
    if (!items || items.length === 0) return null;

    const renderItem = ({ item }: { item: PersonListItem }) => {
        const profileUrl = getImageUrl(item.profile_path, "w200");

        return (
            <TouchableOpacity
                style={detailScreenStyles.mediaItem}
                onPress={() => router.push(`/person/${item.id}` as any)}
                activeOpacity={0.7}
            >
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
                    {item.subtitle}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={detailScreenStyles.sectionContainer}>
            <Text style={detailScreenStyles.sectionTitle}>{title}</Text>
            <FlatList
                data={items}
                keyExtractor={(item) => `${keyPrefix}-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={detailScreenStyles.horizontalList}
                renderItem={renderItem}
            />
        </View>
    );
};