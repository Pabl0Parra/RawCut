import React, { useState } from 'react';
import { TouchableOpacity, Modal, Pressable, View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useAuthStore } from "../../stores/authStore";

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
                style={{ marginRight: 16 }}
            >
                <Ionicons name="person-circle-outline" size={32} color={Colors.white} />
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
                            <Ionicons name="log-out-outline" size={20} color={Colors.bloodRed} />
                            <Text style={[styles.menuItemText, { color: Colors.bloodRed }]}>Cerrar Sesión</Text>
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
    menuContent: {
        position: "absolute",
        right: 16,
        backgroundColor: Colors.metalGray,
        borderRadius: 12,
        padding: 8,
        minWidth: 200,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        // Shadow for iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        // Elevation for Android
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
