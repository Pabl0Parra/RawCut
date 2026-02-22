import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, Animated, TouchableOpacity, Text } from 'react-native';
import { Colors } from '../constants/Colors';
import { useRef, useEffect } from 'react';

interface VideoSplashProps {
    onFinish: () => void;
}

const SPLASH_TIMEOUT_MS = 8000; 

export default function VideoSplash({ onFinish }: Readonly<VideoSplashProps>) {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const hasSetupListener = useRef(false);
    const onFinishRef = useRef(onFinish);
    const hasFinished = useRef(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    
    onFinishRef.current = onFinish;

    const finishSplash = () => {
        if (hasFinished.current) return;
        hasFinished.current = true;

        console.log('[VideoSplash] Finishing splash screen');

        
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
        }).start(() => {
            onFinishRef.current();
        });
    };

    const player = useVideoPlayer(require('../../assets/video/intro.mp4'), (p) => {
        console.log('[VideoSplash] Video player initialized');
        p.loop = false;
        p.muted = false;
        p.play();
    });

    useEffect(() => {
        console.log('[VideoSplash] Component mounted');

        if (hasSetupListener.current) return;
        hasSetupListener.current = true;

        
        timeoutRef.current = setTimeout(() => {
            console.warn('[VideoSplash] Timeout reached, forcing splash to finish');
            finishSplash();
        }, SPLASH_TIMEOUT_MS);

        const subscription = player.addListener('playToEnd', () => {
            console.log('[VideoSplash] Video playback ended');
            finishSplash();
        });

        
        const errorSubscription = player.addListener('statusChange', (status) => {
            if (status.error) {
                console.error('[VideoSplash] Video error:', status.error);
                finishSplash();
            }
        });

        return () => {
            console.log('[VideoSplash] Component unmounting');
            subscription.remove();
            errorSubscription.remove();
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [player]);

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <VideoView
                style={styles.video}
                player={player}
                contentFit="cover"
                nativeControls={false}
            />
            {__DEV__ && (
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={finishSplash}
                >
                    <Text style={styles.skipText}>Skip (Dev)</Text>
                </TouchableOpacity>
            )}
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
    skipButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: 'rgba(220, 38, 38, 0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    skipText: {
        color: Colors.white,
        fontSize: 14,
        fontFamily: 'Inter_600SemiBold',
    },
});