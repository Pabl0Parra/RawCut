import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
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
                    {item.character}
                </Text>
            </TouchableOpacity>
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
