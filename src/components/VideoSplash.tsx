import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/Colors';
import { useRef, useEffect } from 'react';

interface VideoSplashProps {
    onFinish: () => void;
}

export default function VideoSplash({ onFinish }: Readonly<VideoSplashProps>) {
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Video asset
    const asset = require('../../assets/video/intro.mp4');

    // Create player
    const player = useVideoPlayer(asset, player => {
        player.loop = false;
        player.muted = false;
        player.play();
    });

    useEffect(() => {
        let timer: any;
        let initTimer: any;

        // Wait a bit for video metadata to load so we can get the duration
        initTimer = setTimeout(() => {
            const duration = player.duration * 1000;
            console.log('Video duration:', duration, 'ms');

            timer = setTimeout(() => {
                console.log('Timer finished - starting fade');
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }).start(() => {
                    onFinish();
                });
            }, duration || 5000); // Fallback to 5s if duration is 0
        }, 500);

        return () => {
            clearTimeout(initTimer);
            clearTimeout(timer);
        };
    }, [player, fadeAnim, onFinish]);

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <VideoView
                style={styles.video}
                player={player}
                contentFit="cover"
                nativeControls={false}
                allowsPictureInPicture={false}
            />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
        alignItems: 'center',
        justifyContent: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
    },
});