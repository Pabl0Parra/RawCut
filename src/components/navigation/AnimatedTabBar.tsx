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

const TAB_BAR_PADDING_BOTTOM = 8;
const ICON_BOTTOM_PADDING = 4;
const ANIMATION_DURATION = 400;

const TIMING_CONFIG = { duration: ANIMATION_DURATION } as const;

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
        transform: [
            { scale: withSpring(active ? 1 : 0, TIMING_CONFIG) },
        ],
    }), [active]);

    const animatedIconStyle = useAnimatedStyle(() => ({
        opacity: withSpring(active ? 1 : 0.5, TIMING_CONFIG),
    }), [active]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: withSpring(active ? -12 : 0, TIMING_CONFIG) },
        ],
    }), [active]);

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
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
        >
            <Animated.View style={[styles.tabItemInner, animatedContainerStyle]}>
                <Animated.View style={[styles.circleBackground, animatedCircleStyle]}>
                    <Svg width={42} height={42} viewBox="0 0 48 48">
                        <Path
                            fill="#FFFFFF"
                            d="M24 0C10.745 0 0 10.745 0 24s10.745 24 24 24 24-10.745 24-24S37.255 0 24 0z"
                        />
                    </Svg>
                </Animated.View>

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

export default function AnimatedTabBar({
    state,
    descriptors,
    navigation,
}: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    const visibleRoutes = useMemo(() =>
        state.routes.filter(route => {
            const { options } = descriptors[route.key];
            return options.tabBarIcon != null;
        }),
        [state.routes, descriptors]
    );

    const activeVisibleIndex = useMemo(() =>
        visibleRoutes.findIndex(
            route => route.key === state.routes[state.index]?.key
        ),
        [visibleRoutes, state.routes, state.index]
    );



    const safeBottomPadding = Math.max(insets.bottom, TAB_BAR_PADDING_BOTTOM);

    const containerStyle = useMemo(() =>
        [styles.container, { paddingBottom: safeBottomPadding }],
        [safeBottomPadding]
    );

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
    circleBackground: {
        position: 'absolute',
        width: 42,
        height: 42,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
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
        borderColor: Colors.bloodRed,
        zIndex: 20,
    },
    badgeText: {
        color: Colors.bloodRed,
        fontSize: 9,
        fontWeight: 'bold',
        lineHeight: 11,
    },
});