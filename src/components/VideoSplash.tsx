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
        player.play();
    });

    useEffect(() => {
        const subscription = player.addListener('playToEnd', () => {
            // Add a delay before starting the fade
            setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }).start(() => {
                    onFinish();
                });
            }, 1000); // Wait 1 second (1000ms) after video ends
        });

        return () => {
            subscription.remove();
        };
    }, [player, fadeAnim, onFinish]);

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <VideoView
                style={styles.video}
                player={player}
                contentFit="cover"
                nativeControls={false}
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
