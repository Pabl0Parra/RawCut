import React, { useEffect } from "react";
import { View, StyleSheet, DimensionValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedReanimated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    interpolate
} from "react-native-reanimated";
import { Colors } from "../constants/Colors";

const AnimatedLinearGradient = AnimatedReanimated.createAnimatedComponent(LinearGradient);

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = "100%",
    height = 20,
    borderRadius = 4,
    style
}) => {
    const translateX = useSharedValue(-1);

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: interpolate(
                        translateX.value,
                        [-1, 1],
                        [-150, 400] // Adjust based on common widths
                    ),
                },
            ],
        };
    });

    return (
        <View style={[
            styles.container,
            { width, height, borderRadius },
            style
        ]}>
            <AnimatedLinearGradient
                colors={["transparent", "rgba(255, 255, 255, 0.05)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, animatedStyle]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.panelBackground,
        overflow: "hidden",
        position: "relative",
    },
});
