import React, { useState, useCallback } from 'react';
import { View, Modal, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Text } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface TrailerModalProps {
    visible: boolean;
    videoKey: string | null;
    onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Calculate height based on 16:9 aspect ratio
const VIDEO_HEIGHT = (SCREEN_WIDTH - 32) * 9 / 16;

export default function TrailerModal({ visible, videoKey, onClose }: Readonly<TrailerModalProps>) {
    const [playing, setPlaying] = useState(true);
    const [loading, setLoading] = useState(true);

    const onStateChange = useCallback((state: string) => {
        if (state === 'ended') {
            setPlaying(false);
        }
    }, []);

    if (!videoKey) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Trailer</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color={Colors.white} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.playerContainer}>
                        {loading && (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="large" color={Colors.bloodRed} />
                            </View>
                        )}
                        <YoutubePlayer
                            height={VIDEO_HEIGHT}
                            play={playing}
                            videoId={videoKey}
                            onChangeState={onStateChange}
                            onReady={() => setLoading(false)}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    content: {
        width: '100%',
        backgroundColor: Colors.metalGray,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        // Shadow for iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        // Elevation for Android
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.metalBlack,
    },
    title: {
        color: Colors.white,
        fontFamily: 'BebasNeue_400Regular',
        fontSize: 22,
    },
    closeButton: {
        padding: 4,
    },
    playerContainer: {
        width: '100%',
        height: VIDEO_HEIGHT,
        backgroundColor: '#000',
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        backgroundColor: '#000',
    },
});
