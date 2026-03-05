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

const PersonCard = React.memo(
    ({ item }: { item: PersonListItem }) => {
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
    },
    (prevProps, nextProps) => prevProps.item.id === nextProps.item.id && prevProps.item.subtitle === nextProps.item.subtitle
);

export const PersonList: React.FC<PersonListProps> = ({ items, title, keyPrefix }) => {
    if (!items || items.length === 0) return null;

    const renderItem = React.useCallback(({ item }: { item: PersonListItem }) => {
        return <PersonCard item={item} />;
    }, []);

    const getItemLayout = React.useCallback(
        (_: any, index: number) => ({
            length: 112, // 100 width + 12 gap
            offset: 112 * index,
            index,
        }),
        []
    );

    return (
        <View style={detailScreenStyles.sectionContainer}>
            <Text style={detailScreenStyles.sectionTitle}>{title}</Text>
            <FlatList
                data={items}
                keyExtractor={(item, index) => `${keyPrefix}-${item.id}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={detailScreenStyles.horizontalList}
                renderItem={renderItem}
                getItemLayout={getItemLayout}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={5}
                removeClippedSubviews={false}
            />
        </View>
    );
};