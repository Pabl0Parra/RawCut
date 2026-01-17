import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    Easing,
    withSequence,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Crypto from 'expo-crypto';

const { width, height } = Dimensions.get('window');
const SMOKE_IMAGE = require('../../assets/smoke.png');

const getSecureRandom = () => {
    const array = new Uint32Array(1);
    Crypto.getRandomValues(array);
    return array[0] / 4294967295; // Max Uint32 value
};

interface SmokePuffProps {
    delay: number;
    duration: number;
    startX: number;
    startY: number;
    scaleStart: number;
    scaleEnd: number;
}

const SmokePuff = ({ delay, duration, startX, startY, scaleStart, scaleEnd }: SmokePuffProps) => {
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(startX);
    const translateY = useSharedValue(startY);
    const scale = useSharedValue(scaleStart);
    const rotate = useSharedValue(getSecureRandom() * 360);

    useEffect(() => {
        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(0.4, { duration: duration / 2 }), // fade in to 0.4 opacity (subtle)
                    withTiming(0, { duration: duration / 2 })  // fade out
                ),
                -1
            )
        );

        // Subtle sideways movement
        translateX.value = withDelay(
            delay,
            withRepeat(withTiming(startX + (getSecureRandom() * 100 - 50), { duration: duration, easing: Easing.linear }), -1, true)
        );

        // Upward drift
        translateY.value = withDelay(
            delay,
            withRepeat(withTiming(startY - 300, { duration: duration, easing: Easing.linear }), -1)
        );

        // Expansion
        scale.value = withDelay(
            delay,
            withRepeat(withTiming(scaleEnd, { duration: duration }), -1)
        );

        // Rotation
        rotate.value = withDelay(delay, withRepeat(withTiming(rotate.value + 45, { duration: duration }), -1));

    }, []);

    const style = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { scale: scale.value },
                { rotate: `${rotate.value}deg` }
            ],
        };
    });

    return (
        <Animated.View style={[styles.puff, style]}>
            <Image source={SMOKE_IMAGE} style={{ width: 500, height: 500 }} contentFit="contain" />
        </Animated.View>
    );
};

export default function SmokeBackground() {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <SmokePuff delay={0} duration={15000} startX={-100} startY={height} scaleStart={1} scaleEnd={1.5} />
            <SmokePuff delay={5000} duration={18000} startX={width * 0.4} startY={height + 100} scaleStart={0.8} scaleEnd={2} />
            <SmokePuff delay={2000} duration={20000} startX={width * 0.8} startY={height + 50} scaleStart={1.2} scaleEnd={1.8} />
            <SmokePuff delay={8000} duration={22000} startX={0} startY={height * 0.5} scaleStart={0.5} scaleEnd={1.5} />
        </View>
    );
}

const styles = StyleSheet.create({
    puff: {
        position: 'absolute',
        width: 500,
        height: 500,
    },
});
