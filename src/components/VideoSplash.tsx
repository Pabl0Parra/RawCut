import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/Colors';
import { useRef, useEffect } from 'react';

interface VideoSplashProps {
    onFinish: () => void;
}

export default function VideoSplash({ onFinish }: Readonly<VideoSplashProps>) {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const hasSetupListener = useRef(false);
    const onFinishRef = useRef(onFinish);

    // Keep ref updated
    onFinishRef.current = onFinish;

    const player = useVideoPlayer(require('../../assets/video/intro.mp4'), (p) => {
        p.loop = false;
        p.muted = false;
        p.play();
    });

    useEffect(() => {
        if (hasSetupListener.current) return;
        hasSetupListener.current = true;

        const subscription = player.addListener('playToEnd', () => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }).start(() => {
                onFinishRef.current();
            });
        });

        return () => {
            subscription.remove();
        };
    }, [player, fadeAnim]);

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