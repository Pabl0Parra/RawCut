import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/stores/authStore";
import { Colors } from "../../src/constants/Colors";

export default function ProfileScreen() {
    const { profile, user, updateUsername, signOut, isLoading, error, clearError } = useAuthStore();
    const [newUsername, setNewUsername] = useState(profile?.username || "");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (profile?.username) {
            setNewUsername(profile.username);
        }
    }, [profile]);

    const handleUpdateUsername = async () => {
        if (!newUsername.trim()) {
            Alert.alert("Error", "El nombre de usuario no puede estar vacío");
            return;
        }

        if (newUsername.trim() === profile?.username) {
            setIsEditing(false);
            return;
        }

        const success = await updateUsername(newUsername.trim());
        if (success) {
            Alert.alert("Éxito", "Nombre de usuario actualizado correctamente");
            setIsEditing(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            "Cerrar sesión",
            "¿Estás seguro de que quieres cerrar sesión?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Cerrar sesión", style: "destructive", onPress: signOut },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            <Ionicons name="person-circle" size={100} color={Colors.metalSilver} />
                        </View>
                        <Text style={styles.emailText}>{user?.email}</Text>
                        <View style={styles.pointsBadge}>
                            <Ionicons name="flash" size={16} color="#fbbf24" />
                            <Text style={styles.pointsText}>{profile?.points || 0} puntos</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Información del Perfil</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nombre de Usuario</Text>
                            <View style={styles.usernameContainer}>
                                {isEditing ? (
                                    <View style={styles.editContainer}>
                                        <TextInput
                                            style={styles.input}
                                            value={newUsername}
                                            onChangeText={setNewUsername}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            maxLength={20}
                                            placeholder="Nombre de usuario"
                                            placeholderTextColor="#71717a"
                                        />
                                        <View style={styles.editButtons}>
                                            <TouchableOpacity
                                                style={styles.saveButton}
                                                onPress={handleUpdateUsername}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? (
                                                    <ActivityIndicator size="small" color="white" />
                                                ) : (
                                                    <Ionicons name="checkmark" size={24} color="white" />
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={styles.cancelButton}
                                                onPress={() => {
                                                    setNewUsername(profile?.username || "");
                                                    setIsEditing(false);
                                                    clearError();
                                                }}
                                            >
                                                <Ionicons name="close" size={24} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.displayContainer}>
                                        <Text style={styles.usernameText}>@{profile?.username}</Text>
                                        <TouchableOpacity
                                            style={styles.editIconButton}
                                            onPress={() => setIsEditing(true)}
                                        >
                                            <Ionicons name="create-outline" size={20} color={Colors.bloodRed} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                            {error && isEditing && (
                                <Text style={styles.errorText}>{error}</Text>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Ionicons name="log-out-outline" size={20} color="white" />
                        <Text style={styles.signOutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>

                    <Text style={styles.versionText}>RawCut v1.0.0</Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#0a0a0a",
    },
    container: {
        padding: 20,
        alignItems: "center",
    },
    header: {
        alignItems: "center",
        marginBottom: 40,
        marginTop: 20,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    emailText: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginBottom: 12,
    },
    pointsBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(251, 191, 36, 0.1)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(251, 191, 36, 0.3)",
    },
    pointsText: {
        color: "#fbbf24",
        fontWeight: "bold",
        marginLeft: 6,
        fontSize: 14,
    },
    section: {
        width: "100%",
        backgroundColor: Colors.metalGray,
        borderRadius: 12,
        padding: 20,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
    },
    sectionTitle: {
        color: "#f4f4f5",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 20,
    },
    inputGroup: {
        width: "100%",
    },
    label: {
        color: Colors.metalSilver,
        fontSize: 12,
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    usernameContainer: {
        minHeight: 50,
        justifyContent: "center",
    },
    displayContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    usernameText: {
        color: "white",
        fontSize: 20,
        fontWeight: "600",
    },
    editIconButton: {
        padding: 8,
    },
    editContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    input: {
        flex: 1,
        backgroundColor: "#18181b",
        borderWidth: 1,
        borderColor: Colors.bloodRed,
        borderRadius: 8,
        color: "white",
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    editButtons: {
        flexDirection: "row",
        marginLeft: 12,
        gap: 8,
    },
    saveButton: {
        backgroundColor: "#22c55e",
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButton: {
        backgroundColor: Colors.bloodRed,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        color: Colors.bloodRed,
        fontSize: 12,
        marginTop: 8,
    },
    signOutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(220, 38, 38, 0.1)",
        borderWidth: 1,
        borderColor: Colors.bloodRed,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        width: "100%",
    },
    signOutText: {
        color: "white",
        fontWeight: "bold",
        marginLeft: 10,
        fontSize: 16,
    },
    versionText: {
        color: "#444",
        fontSize: 12,
        marginTop: 40,
        marginBottom: 20,
    },
});
