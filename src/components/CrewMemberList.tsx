import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { getImageUrl } from '../lib/tmdb';
import { detailScreenStyles } from '../styles/detailScreenStyles';

interface CrewMember {
    id: number;
    name: string;
    job: string;
    profile_path: string | null;
}

interface CrewMemberListProps {
    crew: CrewMember[];
    title: string;
}

export const CrewMemberList: React.FC<CrewMemberListProps> = ({ crew, title }) => {
    if (!crew || crew.length === 0) return null;

    const renderCrewItem = ({ item }: { item: CrewMember }) => {
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
                    {item.job}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={detailScreenStyles.sectionContainer}>
            <Text style={detailScreenStyles.sectionTitle}>{title}</Text>
            <FlatList
                data={crew}
                keyExtractor={(item, index) => `crew-${item.id}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={detailScreenStyles.horizontalList}
                renderItem={renderCrewItem}
            />
        </View>
    );
};
