import React, { useReducer, useCallback, useMemo, memo } from 'react';
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    LayoutChangeEvent,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    useAnimatedReaction,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

// Constants
const TAB_BAR_PADDING_BOTTOM = 8;
const ICON_BOTTOM_PADDING = 4;
const ANIMATION_DURATION = 400;

// Timing config - reuse same object to avoid recreation
const TIMING_CONFIG = { duration: ANIMATION_DURATION } as const;

// Types
interface TabLayout {
    readonly x: number;
    readonly index: number;
}

type LayoutAction = {
    readonly type: 'ADD_LAYOUT';
    readonly payload: TabLayout;
};

interface TabBarItemProps {
    readonly active: boolean;
    readonly icon: (props: { color: string; focused: boolean }) => React.ReactNode;
    readonly label: string;
    readonly onLayout: (e: LayoutChangeEvent) => void;
    readonly onPress: () => void;
    readonly onLongPress: () => void;
    readonly badge?: string | number;
}

// Reducer for layout management
function layoutReducer(state: TabLayout[], action: LayoutAction): TabLayout[] {
    if (action.type === 'ADD_LAYOUT') {
        const existingIndex = state.findIndex(item => item.index === action.payload.index);
        if (existingIndex !== -1) {
            // Only update if x value actually changed
            if (state[existingIndex].x === action.payload.x) {
                return state;
            }
            const newState = [...state];
            newState[existingIndex] = action.payload;
            return newState;
        }
        return [...state, action.payload];
    }
    return state;
}

// Individual tab component with animations - MEMOIZED
const TabBarItem = memo(function TabBarItem({
    active,
    icon,
    label,
    onLayout,
    onPress,
    onLongPress,
    badge,
}: TabBarItemProps) {
    // Circle scale animation (appears when active)
    const animatedCircleStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: withSpring(active ? 1 : 0, TIMING_CONFIG) },
        ],
    }), [active]);

    // Icon opacity animation
    const animatedIconStyle = useAnimatedStyle(() => ({
        opacity: withSpring(active ? 1 : 0.5, TIMING_CONFIG),
    }), [active]);

    // Vertical position animation (moves up when active)
    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: withSpring(active ? -12 : 0, TIMING_CONFIG) },
        ],
    }), [active]);

    // Memoize icon render to avoid recreation
    const renderedIcon = useMemo(() =>
        icon({
            color: active ? Colors.bloodRed : Colors.metalSilver,
            focused: active,
        }),
        [icon, active]
    );

    return (
        <Pressable
            onPress={onPress}
            onLongPress={onLongPress}
            onLayout={onLayout}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
        >
            <Animated.View style={[styles.tabItemInner, animatedContainerStyle]}>
                {/* White circle background */}
                <Animated.View style={[styles.circleBackground, animatedCircleStyle]} />

                {/* Icon */}
                <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                    {renderedIcon}
                </Animated.View>

                {/* Badge */}
                {badge !== undefined && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                )}
            </Animated.View>

            {/* Label - only visible when not active */}
            <Animated.Text
                style={[
                    styles.label,
                    {
                        opacity: active ? 0 : 1,
                        color: Colors.metalSilver,
                    },
                ]}
            >
                {label}
            </Animated.Text>
        </Pressable>
    );
});

// Main animated tab bar component
export default function AnimatedTabBar({
    state,
    descriptors,
    navigation,
}: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const [layouts, dispatch] = useReducer(layoutReducer, []);

    // Shared value for the x offset
    const xOffset = useSharedValue(0);

    // Memoize visible routes - only recalculate when routes or descriptors change
    const visibleRoutes = useMemo(() =>
        state.routes.filter(route => {
            const { options } = descriptors[route.key];
            return options.tabBarIcon != null;
        }),
        [state.routes, descriptors]
    );

    // Memoize active index calculation
    const activeVisibleIndex = useMemo(() =>
        visibleRoutes.findIndex(
            route => route.key === state.routes[state.index]?.key
        ),
        [visibleRoutes, state.routes, state.index]
    );

    // Handle layout measurements - stable callback
    const handleLayout = useCallback((event: LayoutChangeEvent, index: number) => {
        dispatch({
            type: 'ADD_LAYOUT',
            payload: { x: event.nativeEvent.layout.x, index },
        });
    }, []);

    // Update xOffset using useAnimatedReaction for smoother updates
    // This keeps the animation logic on the UI thread
    useAnimatedReaction(
        () => {
            const activeLayout = layouts.find(layout => layout.index === activeVisibleIndex);
            return activeLayout ? activeLayout.x - 25 : null;
        },
        (newOffset, previousOffset) => {
            if (newOffset !== null && newOffset !== previousOffset) {
                xOffset.value = newOffset;
            }
        },
        [activeVisibleIndex, layouts]
    );

    // Animated style for sliding SVG background
    const animatedBackgroundStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: withSpring(xOffset.value, TIMING_CONFIG) }],
    }), []);

    // Calculate safe bottom padding
    const safeBottomPadding = Math.max(insets.bottom, TAB_BAR_PADDING_BOTTOM);

    // Memoize container style
    const containerStyle = useMemo(() =>
        [styles.container, { paddingBottom: safeBottomPadding }],
        [safeBottomPadding]
    );

    // Create memoized press handlers for each tab
    const createPressHandler = useCallback((routeKey: string, routeName: string, isFocused: boolean) => () => {
        const event = navigation.emit({
            type: 'tabPress',
            target: routeKey,
            canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(routeName);
        }
    }, [navigation]);

    const createLongPressHandler = useCallback((routeKey: string) => () => {
        navigation.emit({
            type: 'tabLongPress',
            target: routeKey,
        });
    }, [navigation]);

    // Pre-compute tab data to avoid recalculations in render
    const tabsData = useMemo(() =>
        visibleRoutes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = index === activeVisibleIndex;
            const icon = options.tabBarIcon as
                | ((props: { color: string; focused: boolean }) => React.ReactNode)
                | undefined;

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
        [visibleRoutes, descriptors, activeVisibleIndex]
    );

    return (
        <View style={containerStyle}>
            {/* Animated curved background */}
            <Animated.View style={[styles.curvedBackground, animatedBackgroundStyle]}>
                <Svg width={110} height={60} viewBox="0 0 110 60">
                    <Path
                        fill={Colors.black}
                        d="M20 0H0c11.046 0 20 9.49 20 21.2v5.3c0 20.49 15.67 37.1 35 37.1s35-16.61 35-37.1v-5.3c0-11.708 8.954-21.2 20-21.2H20z"
                    />
                </Svg>
            </Animated.View>

            {/* Tab items */}
            <View style={styles.tabsContainer}>
                {tabsData.map((tab) => {
                    if (!tab.icon) return null;

                    return (
                        <TabBarItem
                            key={tab.key}
                            active={tab.isFocused}
                            icon={tab.icon}
                            label={tab.label}
                            onLayout={(e) => handleLayout(e, tab.index)}
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
    },
    curvedBackground: {
        position: 'absolute',
        top: 0,
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingBottom: ICON_BOTTOM_PADDING,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 4,
        minWidth: 60,
    },
    tabItemInner: {
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleBackground: {
        position: 'absolute',
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: Colors.white,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        fontFamily: 'Inter_500Medium',
        marginTop: -4,
    },
    badge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: Colors.white,
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: Colors.bloodRed,
        zIndex: 20,
    },
    badgeText: {
        color: Colors.bloodRed,
        fontSize: 10,
        fontWeight: 'bold',
        lineHeight: 12,
    },
});