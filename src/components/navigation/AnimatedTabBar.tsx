import React, { useReducer, useCallback, useEffect } from 'react';
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
    withTiming,
    useSharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

// Constants
const TAB_BAR_PADDING_BOTTOM = 8;
const ICON_BOTTOM_PADDING = 4;

// Types
interface TabLayout {
    readonly x: number;
    readonly index: number;
}

type LayoutAction = {
    type: 'ADD_LAYOUT';
    payload: TabLayout;
};

interface TabBarComponentProps {
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
        // Check if this index already exists
        const existingIndex = state.findIndex(item => item.index === action.payload.index);
        if (existingIndex !== -1) {
            // Update existing
            const newState = [...state];
            newState[existingIndex] = action.payload;
            return newState;
        }
        // Add new
        return [...state, action.payload];
    }
    return state;
}

// Individual tab component with animations
function TabBarItem({
    active,
    icon,
    label,
    onLayout,
    onPress,
    onLongPress,
    badge,
}: Readonly<TabBarComponentProps>) {
    // Circle scale animation (appears when active)
    const animatedCircleStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: withTiming(active ? 1 : 0, { duration: 250 }) },
        ],
    }));

    // Icon opacity animation
    const animatedIconStyle = useAnimatedStyle(() => ({
        opacity: withTiming(active ? 1 : 0.5, { duration: 250 }),
    }));

    // Vertical position animation (moves up when active)
    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: withTiming(active ? -12 : 0, { duration: 250 }) },
        ],
    }));

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
                    {icon({
                        color: active ? Colors.bloodRed : Colors.metalSilver,
                        focused: active,
                    })}
                </Animated.View>

                {/* Badge - placed outside iconContainer to avoid inheriting dimmed opacity when tab is inactive */}
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
}

// Main animated tab bar component
export default function AnimatedTabBar({
    state,
    descriptors,
    navigation,
}: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const [layouts, dispatch] = useReducer(layoutReducer, []);

    // Shared value for the x offset - this is what drives the animation
    const xOffset = useSharedValue(0);

    // Filter to only routes that have a tabBarIcon (these are the ones that render)
    const visibleRoutes = state.routes.filter(route => {
        const { options } = descriptors[route.key];
        return options.tabBarIcon != null;
    });

    // Find the active index within visible routes only
    const activeVisibleIndex = visibleRoutes.findIndex(
        route => route.key === state.routes[state.index]?.key
    );

    // Handle layout measurements
    const handleLayout = useCallback((event: LayoutChangeEvent, index: number) => {
        dispatch({
            type: 'ADD_LAYOUT',
            payload: { x: event.nativeEvent.layout.x, index },
        });
    }, []);

    // Update xOffset when active tab or layouts change
    // This runs on JS thread and updates the shared value
    useEffect(() => {
        // Just check if we have layouts, don't compare to routes length
        if (layouts.length === 0) {
            return;
        }

        const activeLayout = layouts.find(layout => layout.index === activeVisibleIndex);
        if (!activeLayout) return;

        const newOffset = activeLayout.x - 25;
        xOffset.value = newOffset;
    }, [activeVisibleIndex, layouts, xOffset]);

    // Animated style for sliding SVG background
    const animatedBackgroundStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: withTiming(xOffset.value, { duration: 250 }) }],
    }));

    // Calculate safe bottom padding (ensure minimum padding even on devices without notch)
    const safeBottomPadding = Math.max(insets.bottom, TAB_BAR_PADDING_BOTTOM);

    return (
        <View style={[styles.container, { paddingBottom: safeBottomPadding }]}>
            {/* Animated curved background - wrapped in Animated.View */}
            <Animated.View style={[styles.curvedBackground, animatedBackgroundStyle]}>
                <Svg
                    width={110}
                    height={60}
                    viewBox="0 0 110 60"
                >
                    <Path
                        fill={Colors.black}
                        d="M20 0H0c11.046 0 20 8.953 20 20v5c0 19.33 15.67 35 35 35s35-15.67 35-35v-5c0-11.045 8.954-20 20-20H20z"
                    />
                </Svg>
            </Animated.View>

            {/* Tab items */}
            <View style={styles.tabsContainer}>
                {visibleRoutes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = index === activeVisibleIndex;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    // Get the icon from options
                    const icon = options.tabBarIcon as
                        | ((props: { color: string; focused: boolean }) => React.ReactNode)
                        | undefined;

                    if (!icon) return null;

                    return (
                        <TabBarItem
                            key={route.key}
                            active={isFocused}
                            icon={icon}
                            label={options.title ?? route.name}
                            onLayout={(e) => handleLayout(e, index)}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            badge={options.tabBarBadge}
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
        // paddingBottom is now applied dynamically with safe area insets
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