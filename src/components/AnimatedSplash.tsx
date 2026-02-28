import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    interpolate
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Colors } from '../constants/Colors';

const LOGO_SOURCE = require('../../assets/corto-crudo-logo.png');

export default function AnimatedSplash() {
    const animation = useSharedValue(0);

    useEffect(() => {
        animation.value = withTiming(1, {
            duration: 1000,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const scale = interpolate(animation.value, [0, 1], [0.3, 1]);
        const opacity = interpolate(animation.value, [0, 1], [0, 1]);

        return {
            opacity,
            transform: [
                { scale },
            ],
        };
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.logoContainer, animatedStyle]}>
                <Image
                    source={LOGO_SOURCE}
                    style={styles.logo}
                    contentFit="contain"
                />
            </Animated.View>
            <Animated.View style={[styles.textContainer, { opacity: animation }]}>
                <Text style={styles.loadingText}>Preparando la aplicación…</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.metalBlack,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    logoContainer: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        marginTop: 20,
    },
    loadingText: {
        fontSize: 14,
        fontFamily: 'Inter_400Regular',
        color: Colors.metalSilver,
        letterSpacing: 1,
    }
});
