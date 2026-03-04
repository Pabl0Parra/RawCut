import React, { useCallback, useMemo, memo, useEffect } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    useAnimatedProps,
    useSharedValue,
    withSpring,
    withRepeat,
    withTiming,
    withDelay,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

const TAB_BAR_PADDING_BOTTOM = 8;
const ICON_BOTTOM_PADDING = 4;
const ANIMATION_DURATION = 400;

const TIMING_CONFIG = { duration: ANIMATION_DURATION } as const;

// ─── Blood ring constants (scaled to 42px circle) ─────────────────────────────
const SIZE = 42;
const CX = SIZE / 2;        // 21
const CY = SIZE / 2;        // 21
const RING_R = 14;
const BOTTOM_Y = CY + RING_R; // 35

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ─── Single blood drip ────────────────────────────────────────────────────────
const BloodDrip = memo(({ delay, offsetX = 0, active }: { delay: number; offsetX?: number; active: boolean }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        if (active) {
            progress.value = withDelay(
                delay,
                withRepeat(
                    withTiming(1, { duration: 2800, easing: Easing.in(Easing.quad) }),
                    -1,
                    false,
                ),
            );
        } else {
            progress.value = withTiming(0, { duration: 300 });
        }
    }, [active]);

    const x = CX + offsetX;

    const streamProps = useAnimatedProps(() => {
        const streamLength = interpolate(progress.value, [0, 1], [0, 20]);
        const topWidth = 3.5;
        const opacity = interpolate(progress.value, [0, 0.05, 0.85, 1], [0, 1, 1, 0]);
        const y1 = BOTTOM_Y;
        const y2 = BOTTOM_Y + streamLength;
        const hw = topWidth / 2;
        return {
            d: streamLength < 0.5 ? 'M0 0' :
                `M ${x - hw} ${y1} A ${hw} ${hw} 0 0 1 ${x + hw} ${y1} Q ${x + hw} ${y2} ${x} ${y2} Q ${x - hw} ${y2} ${x - hw} ${y1} Z`,
            fillOpacity: opacity,
        };
    });

    const splatProps = useAnimatedProps(() => {
        const splatProgress = interpolate(progress.value, [0.88, 0.95, 1], [0, 1, 0]);
        const r = interpolate(splatProgress, [0, 1], [0, 3]);
        const opacity = interpolate(progress.value, [0.88, 0.92, 1], [0, 0.5, 0]);
        return { r, fillOpacity: opacity };
    });

    return (
        <>
            <AnimatedPath animatedProps={streamProps} fill="#CC0000" />
            <AnimatedCircle cx={x} cy={BOTTOM_Y + 19} animatedProps={splatProps} fill="#6B0000" />
        </>
    );
});

// ─── Full blood ring ──────────────────────────────────────────────────────────
const BloodRing = memo(({ active }: { active: boolean }) => (
    <View style={styles.bloodRingContainer}>
        <Svg width={SIZE} height={SIZE + 20} style={StyleSheet.absoluteFill}>
            {/* Dark ring base */}
            <Circle cx={CX} cy={CY} r={RING_R} stroke="#1A0000" strokeWidth="5" fill="none" />
            {/* Deep red ring */}
            <Circle cx={CX} cy={CY} r={RING_R} stroke="#6B0000" strokeWidth="3" fill="none" />
            {/* Bright blood highlight arc */}
            <Circle
                cx={CX} cy={CY} r={RING_R}
                stroke="#CC0000"
                strokeWidth="1.5"
                strokeDasharray={`${2 * Math.PI * RING_R * 0.35} ${2 * Math.PI * RING_R * 0.65}`}
                strokeDashoffset={-2 * Math.PI * RING_R * 0.07}
                fill="none"
                opacity={0.8}
            />
            <BloodDrip delay={0} offsetX={-2} active={active} />
            <BloodDrip delay={500} offsetX={3} active={active} />
            <BloodDrip delay={950} offsetX={-1} active={active} />
        </Svg>
    </View>
));

// ─── Tab item ─────────────────────────────────────────────────────────────────
interface TabBarItemProps {
    readonly active: boolean;
    readonly icon: (props: { color: string; focused: boolean }) => React.ReactNode;
    readonly label: string;
    readonly onPress: () => void;
    readonly onLongPress: () => void;
    readonly badge?: string | number;
}

const TabBarItem = memo(function TabBarItem({
    active,
    icon,
    label,
    onPress,
    onLongPress,
    badge,
}: TabBarItemProps) {

    const animatedCircleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(active ? 1 : 0, TIMING_CONFIG) }],
    }), [active]);

    const animatedIconStyle = useAnimatedStyle(() => ({
        opacity: withSpring(active ? 1 : 0.5, TIMING_CONFIG),
    }), [active]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: withSpring(active ? -12 : 0, TIMING_CONFIG) }],
    }), [active]);

    const renderedIcon = useMemo(() =>
        icon({ color: active ? Colors.vibrantRed : Colors.metalSilver, focused: active }),
        [icon, active],
    );

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
        >
            <Animated.View style={[styles.tabItemInner, animatedContainerStyle]}>
                {/* Blood ring sits behind the circle */}
                {active && <BloodRing active={active} />}

                {/* The filled circle */}
                <Animated.View style={[styles.circleBackground, animatedCircleStyle]} />

                {/* Icon on top */}
                <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                    {renderedIcon}
                </Animated.View>

                {badge !== undefined && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
            </Animated.View>

            <Animated.Text
                style={[styles.label, { opacity: active ? 0 : 1, color: Colors.metalSilver }]}
            >
                {label}
            </Animated.Text>
        </Pressable>
    );
});

// ─── Main tab bar ─────────────────────────────────────────────────────────────
export default function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    const visibleRoutes = useMemo(() =>
        state.routes.filter(route => descriptors[route.key].options.tabBarIcon != null),
        [state.routes, descriptors],
    );

    const activeVisibleIndex = useMemo(() =>
        visibleRoutes.findIndex(route => route.key === state.routes[state.index]?.key),
        [visibleRoutes, state.routes, state.index],
    );

    const safeBottomPadding = Math.max(insets.bottom, TAB_BAR_PADDING_BOTTOM);
    const containerStyle = useMemo(() => [styles.container, { paddingBottom: safeBottomPadding }], [safeBottomPadding]);

    const createPressHandler = useCallback((routeKey: string, routeName: string, isFocused: boolean) => () => {
        const event = navigation.emit({ type: 'tabPress', target: routeKey, canPreventDefault: true });
        if (!isFocused && !event.defaultPrevented) navigation.navigate(routeName);
    }, [navigation]);

    const createLongPressHandler = useCallback((routeKey: string) => () => {
        navigation.emit({ type: 'tabLongPress', target: routeKey });
    }, [navigation]);

    const tabsData = useMemo(() =>
        visibleRoutes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = index === activeVisibleIndex;
            const icon = options.tabBarIcon as ((props: { color: string; focused: boolean }) => React.ReactNode) | undefined;
            return {
                key: route.key,
                routeName: route.name,
                isFocused,
                icon,
                label: options.title ?? route.name,
                badge: options.tabBarBadge,
                index,
            };
        }),
        [visibleRoutes, descriptors, activeVisibleIndex],
    );

    return (
        <View style={containerStyle}>
            <View style={styles.tabsContainer}>
                {tabsData.map((tab) => {
                    if (!tab.icon) return null;
                    return (
                        <TabBarItem
                            key={tab.key}
                            active={tab.isFocused}
                            icon={tab.icon}
                            label={tab.label}
                            onPress={createPressHandler(tab.key, tab.routeName, tab.isFocused)}
                            onLongPress={createLongPressHandler(tab.key)}
                            badge={tab.badge}
                        />
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.metalGray,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: ICON_BOTTOM_PADDING,
        paddingHorizontal: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 2,
    },
    tabItemInner: {
        width: 44,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    /** Container for the 42×62 SVG, centred over the 44×32 tabItemInner */
    bloodRingContainer: {
        position: 'absolute',
        top: -(SIZE / 2 - 16),
        left: -(SIZE / 2 - 22),
        width: SIZE,
        height: SIZE + 20,
        zIndex: 0,
    },
    circleBackground: {
        position: 'absolute',
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.metalGray,
        borderWidth: 2,
        borderColor: Colors.vibrantRed,
        overflow: 'hidden',
        zIndex: 1,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    label: {
        fontSize: 9,
        fontFamily: 'Inter_500Medium',
        marginTop: -2,
        paddingBottom: 12,
        textAlign: 'center',
    },
    badge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: Colors.white,
        borderRadius: 10,
        minWidth: 14,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: Colors.vibrantRed,
        zIndex: 20,
    },
    badgeText: {
        color: Colors.vibrantRed,
        fontSize: 9,
        fontWeight: 'bold',
        lineHeight: 11,
    },
});