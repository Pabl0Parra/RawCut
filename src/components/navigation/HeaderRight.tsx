import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Modal, Pressable, View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withRepeat,
    withTiming,
    withDelay,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { Colors } from "../../constants/Colors";
import { useAuthStore } from "../../stores/authStore";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

function getInitials(username: string | undefined, email: string | undefined): string {
    if (username && !username.startsWith("user_")) {
        return username.slice(0, 2).toUpperCase();
    }
    if (email) {
        return email.slice(0, 2).toUpperCase();
    }
    return "??";
}

const SIZE = 48;
const CX = SIZE / 2;   // 24
const CY = SIZE / 2;   // 24
const RING_R = 17;
// Bottom of the ring in SVG coords
const BOTTOM_Y = CY + RING_R; // 41

// A single blood drip: thin stream that grows, then a teardrop at the end
const BloodDrip = ({ delay, offsetX = 0, active }: { delay: number; offsetX?: number; active: boolean }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        if (active) {
            progress.value = withDelay(
                delay,
                withRepeat(
                    withTiming(1, { duration: 2800, easing: Easing.in(Easing.quad) }),
                    -1,
                    false
                )
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
                `M ${x - hw} ${y1}
                 A ${hw} ${hw} 0 0 1 ${x + hw} ${y1}
                 Q ${x + hw} ${y2} ${x} ${y2}
                 Q ${x - hw} ${y2} ${x - hw} ${y1}
                 Z`,
            fillOpacity: opacity,
        };
    });

    const splatProps = useAnimatedProps(() => {
        const splatProgress = interpolate(progress.value, [0.88, 0.95, 1], [0, 1, 0]);
        const r = interpolate(splatProgress, [0, 1], [0, 3]);
        const opacity = interpolate(progress.value, [0.88, 0.92, 1], [0, 0.5, 0]);
        return {
            r,
            fillOpacity: opacity,
        };
    });

    return (
        <>
            <AnimatedPath animatedProps={streamProps} fill="#CC0000" />
            <AnimatedCircle cx={x} cy={BOTTOM_Y + 21} animatedProps={splatProps} fill="#6B0000" />
        </>
    );
};

const BloodRing = ({ active }: { active: boolean }) => {
    return (
        <View style={{ position: 'absolute', top: -5, left: -5, width: SIZE, height: SIZE + 24 }}>
            <Svg width={SIZE} height={SIZE + 24} style={StyleSheet.absoluteFill}>
                {/* Dark ring base */}
                <Circle cx={CX} cy={CY} r={RING_R} stroke="#1A0000" strokeWidth="5" fill="none" />
                {/* Deep red ring */}
                <Circle cx={CX} cy={CY} r={RING_R} stroke="#6B0000" strokeWidth="3" fill="none" />
                {/* Bright blood highlight arc on top */}
                <Circle
                    cx={CX} cy={CY} r={RING_R}
                    stroke="#CC0000"
                    strokeWidth="1.5"
                    strokeDasharray={`${2 * Math.PI * RING_R * 0.35} ${2 * Math.PI * RING_R * 0.65}`}
                    strokeDashoffset={-2 * Math.PI * RING_R * 0.07}
                    fill="none"
                    opacity={0.8}
                />
                {/* Blood drips staggered */}
                <BloodDrip delay={0} offsetX={-2} active={active} />
                <BloodDrip delay={500} offsetX={3} active={active} />
                <BloodDrip delay={950} offsetX={-1} active={active} />
            </Svg>
        </View>
    );
};

export const HeaderRight = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [menuVisible, setMenuVisible] = useState(false);
    const { user, profile, signOut } = useAuthStore();

    const handleSignOut = () => {
        setMenuVisible(false);
        Alert.alert(
            "Cerrar Sesión",
            "¿Estás seguro de que quieres cerrar sesión?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Cerrar Sesión", style: "destructive", onPress: signOut }
            ]
        );
    };

    const goToProfile = () => {
        setMenuVisible(false);
        router.push("/profile");
    };

    return (
        <>
            <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                style={styles.headerButton}
            >
                <BloodRing active={!menuVisible} />
                <View style={styles.avatarInner}>
                    {profile?.avatar_url ? (
                        <Image
                            key={profile.avatar_url}
                            source={profile.avatar_url}
                            style={styles.avatarImage}
                            contentFit="cover"
                            transition={200}
                            onError={() => { }}
                        />
                    ) : (
                        <View style={styles.headerAvatarPlaceholder}>
                            <Text style={styles.headerInitials}>
                                {getInitials(profile?.username, user?.email)}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            <Modal
                visible={menuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setMenuVisible(false)}
                >
                    <View
                        style={[
                            styles.menuContent,
                            { top: Platform.OS === "ios" ? insets.top + 50 : 50 }
                        ]}
                    >
                        <View style={styles.userInfo}>
                            <Text style={styles.usernameText}>@{profile?.username || 'usuario'}</Text>
                            <Text style={styles.emailText}>{user?.email}</Text>
                        </View>

                        <TouchableOpacity style={styles.menuItem} onPress={goToProfile}>
                            <Ionicons name="person-outline" size={20} color={Colors.white} />
                            <Text style={styles.menuItemText}>Mi Perfil</Text>
                        </TouchableOpacity>

                        <View style={styles.separator} />

                        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                            <Ionicons name="log-out-outline" size={20} color={Colors.vibrantRed} />
                            <Text style={[styles.menuItemText, { color: Colors.vibrantRed }]}>Cerrar Sesión</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    headerButton: {
        marginRight: 16,
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInner: {
        width: 30,
        height: 30,
        borderRadius: 15,
        overflow: 'hidden',
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    headerAvatarPlaceholder: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerInitials: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.metalSilver,
    },
    menuContent: {
        position: "absolute",
        right: 16,
        backgroundColor: Colors.metalGray,
        borderRadius: 12,
        padding: 8,
        minWidth: 200,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        elevation: 10,
    },
    userInfo: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.1)",
        marginBottom: 4,
    },
    usernameText: {
        color: Colors.white,
        fontWeight: "bold",
        fontSize: 14,
    },
    emailText: {
        color: Colors.metalSilver,
        fontSize: 12,
        marginTop: 2,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        gap: 12,
        borderRadius: 8,
    },
    menuItemText: {
        color: Colors.white,
        fontSize: 16,
    },
    separator: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginVertical: 4,
    },
});