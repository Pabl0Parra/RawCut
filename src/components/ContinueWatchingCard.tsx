import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/Colors';
import { getImageUrl } from '../lib/tmdb';
import type { ContinueWatchingItem } from '../types/homeScreen.types';

interface ContinueWatchingCardProps {
    item: any; // Using any for now to support both home and watchlist types
    onPress: (showId: number) => void;
    nextEpisode?: { season: number; episode: number } | null;
    horizontal?: boolean;
}

export const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({
    item,
    onPress,
    nextEpisode,
    horizontal = false
}) => {
    // Handle both ContinueWatchingItem (home) and WatchlistTVItem (watchlist)
    const show = item.show || item;
    const progress = item.progress;

    const backdropUrl = getImageUrl(show.backdrop_path, 'w500');

    // progress can be the object from home or the direct 0-1 number from watchlist hook
    const progressPercentage = typeof progress === 'number'
        ? progress * 100
        : (progress?.watched / Math.max(1, progress?.total)) * 100;

    return (
        <TouchableOpacity
            style={[styles.container, horizontal && styles.horizontalContainer]}
            onPress={() => onPress(show.id)}
            activeOpacity={0.8}
        >
            <View style={[styles.imageWrapper, horizontal && styles.horizontalImage]}>
                {backdropUrl ? (
                    <Image
                        source={{ uri: backdropUrl }}
                        style={styles.image}
                        contentFit="cover"
                    />
                ) : (
                    <View style={[styles.image, styles.placeholder]}>
                        <Ionicons name="tv-outline" size={40} color={Colors.metalSilver} />
                    </View>
                )}

                {/* Overlay oscuro para legibilidad */}
                <View style={styles.overlay} />

                {/* Ícono de Play central */}
                <View style={styles.playOverlay}>
                    <View style={styles.playCircle}>
                        <Ionicons name="play" size={24} color={Colors.white} />
                    </View>
                </View>

                {/* Etiqueta de Siguiente Episodio */}
                {nextEpisode && (
                    <View style={styles.nextBadge}>
                        <Text style={styles.nextBadgeLabel}>SIGUIENTE</Text>
                        <Text style={styles.nextBadgeValue}>
                            S{nextEpisode.season} E{nextEpisode.episode}
                        </Text>
                    </View>
                )}

                {/* Barra de Progreso */}
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                </View>
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={1}>
                    {show.name}
                </Text>
                {typeof progress === 'object' && progress.watched !== undefined && (
                    <Text style={styles.episodeText}>
                        {progress.watched} / {progress.total} episodios completados
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 16,
    } as ViewStyle,
    horizontalContainer: {
        width: 280,
        marginRight: 16,
        marginBottom: 0,
    } as ViewStyle,
    imageWrapper: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: Colors.metalGray,
        position: 'relative',

        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    } as ViewStyle,
    horizontalImage: {
        height: 157.5, // 280 * 9/16
    } as ViewStyle,
    image: {
        width: '100%',
        height: '100%',
    } as ImageStyle,
    placeholder: {
        alignItems: 'center',
        justifyContent: 'center',
    } as ViewStyle,
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
    } as ViewStyle,
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    } as ViewStyle,
    playCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(239, 68, 68, 0.9)', // vibrantRed with transparency
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
        paddingLeft: 4,
    } as ViewStyle,
    nextBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.85)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.8)',
        alignItems: 'center',
    } as ViewStyle,
    nextBadgeLabel: {
        color: Colors.metalSilver,
        fontSize: 7,
        fontWeight: 'bold',
        letterSpacing: 1,
        fontFamily: Fonts.interBold,
    } as TextStyle,
    nextBadgeValue: {
        color: Colors.white,
        fontSize: 12,
        fontFamily: Fonts.bebas,
        marginTop: -1,
    } as TextStyle,
    progressBarBg: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    } as ViewStyle,
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.vibrantRed,
    } as ViewStyle,
    infoContainer: {
        marginTop: 8,
        paddingHorizontal: 4,
    } as ViewStyle,
    title: {
        color: Colors.white,
        fontSize: 16,
        fontFamily: Fonts.bebas,
        letterSpacing: 0.8,
    } as TextStyle,
    episodeText: {
        color: Colors.metalSilver,
        fontSize: 11,
        fontFamily: Fonts.inter,
        marginTop: 2,
    } as TextStyle,
});

export default ContinueWatchingCard;
