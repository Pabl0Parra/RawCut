import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Animated,
    Linking,
    Platform,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useAuthStore } from "../../src/stores/authStore";
import { useAvatarUpload, type ImageSource } from "../../src/hooks/useAvatarUpload";
import { Colors, Fonts } from "../../src/constants/Colors";

/** App version - should be synced with app.json */
const APP_VERSION = "1.0.0";

/** External links */
const LINKS = {
    help: "https://cortoCrudo.app/help",
    privacy: "https://cortoCrudo.app/privacy",
    terms: "https://cortoCrudo.app/terms",
} as const;

/** Format date to localized string */
function formatMemberSince(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/** Get initials from username or email */
function getInitials(username: string | undefined, email: string | undefined): string {
    if (username && !username.startsWith("user_")) {
        return username.slice(0, 2).toUpperCase();
    }
    if (email) {
        return email.slice(0, 2).toUpperCase();
    }
    return "??";
}

// ============================================================================
// Sub-Components
// ============================================================================

/** Avatar component with upload capability */
interface AvatarSectionProps {
    avatarUrl: string | null;
    username: string | undefined;
    email: string | undefined;
    isUploading: boolean;
    uploadProgress: number;
    onPress: () => void;
}

function AvatarSection({
    avatarUrl,
    username,
    email,
    isUploading,
    uploadProgress,
    onPress,
}: AvatarSectionProps): React.JSX.Element {
    console.log("AvatarSection rendering. Profile username:", username, "Avatar URL:", avatarUrl);
    const initials = getInitials(username, email);

    return (
        <TouchableOpacity
            style={styles.avatarContainer}
            onPress={onPress}
            disabled={isUploading}
            activeOpacity={0.8}
            accessibilityLabel="Cambiar foto de perfil"
            accessibilityRole="button"
        >
            <View style={styles.avatarWrapper}>
                {avatarUrl ? (
                    <Image
                        key={avatarUrl}
                        source={avatarUrl}
                        style={styles.avatarImage}
                        contentFit="cover"
                        transition={200}
                        onError={() => console.log("Profile Image Load Error for URL:", avatarUrl)}
                    />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                )}

                {/* Upload overlay */}
                {isUploading && (
                    <View style={styles.avatarOverlay}>
                        <ActivityIndicator size="large" color={Colors.white} />
                        <Text style={styles.uploadProgressText}>
                            {Math.round(uploadProgress * 100)}%
                        </Text>
                    </View>
                )}

                {/* Camera badge */}
                {!isUploading && (
                    <View style={styles.cameraBadge}>
                        <Ionicons name="camera" size={16} color={Colors.white} />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

/** Section header component */
interface SectionHeaderProps {
    title: string;
}

function SectionHeader({ title }: SectionHeaderProps): React.JSX.Element {
    return <Text style={styles.sectionTitle}>{title}</Text>;
}

/** Profile info row component */
interface InfoRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    onEdit?: () => void;
    isEditable?: boolean;
}

function InfoRow({
    icon,
    label,
    value,
    onEdit,
    isEditable = false,
}: InfoRowProps): React.JSX.Element {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
                <Ionicons name={icon} size={20} color={Colors.metalSilver} />
                <View style={styles.infoRowText}>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{value}</Text>
                </View>
            </View>
            {isEditable && onEdit && (
                <TouchableOpacity
                    onPress={onEdit}
                    style={styles.editButton}
                    accessibilityLabel={`Editar ${label}`}
                    accessibilityRole="button"
                >
                    <Ionicons name="create-outline" size={20} color={Colors.bloodRed} />
                </TouchableOpacity>
            )}
        </View>
    );
}

/** Settings row with toggle or navigation */
interface SettingsRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    rightElement?: React.ReactNode;
    destructive?: boolean;
}

function SettingsRow({
    icon,
    label,
    onPress,
    rightElement,
    destructive = false,
}: SettingsRowProps): React.JSX.Element {
    return (
        <TouchableOpacity
            style={styles.settingsRow}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityLabel={label}
            accessibilityRole="button"
        >
            <View style={styles.settingsRowLeft}>
                <Ionicons
                    name={icon}
                    size={22}
                    color={destructive ? Colors.bloodRed : Colors.metalSilver}
                />
                <Text
                    style={[
                        styles.settingsLabel,
                        destructive && styles.settingsLabelDestructive,
                    ]}
                >
                    {label}
                </Text>
            </View>
            {rightElement ?? (
                <Ionicons name="chevron-forward" size={20} color={Colors.metalSilver} />
            )}
        </TouchableOpacity>
    );
}

/** Username edit modal/inline component */
interface UsernameEditorProps {
    currentUsername: string;
    isLoading: boolean;
    error: string | null;
    onSave: (newUsername: string) => Promise<void>;
    onCancel: () => void;
}

function UsernameEditor({
    currentUsername,
    isLoading,
    error,
    onSave,
    onCancel,
}: UsernameEditorProps): React.JSX.Element {
    const [value, setValue] = useState(currentUsername);

    const handleSave = async () => {
        if (value.trim() && value.trim() !== currentUsername) {
            await onSave(value.trim());
        } else {
            onCancel();
        }
    };

    return (
        <View style={styles.editorContainer}>
            <View style={styles.editorInputRow}>
                <TextInput
                    style={styles.editorInput}
                    value={value}
                    onChangeText={setValue}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                    placeholder="Nombre de usuario"
                    placeholderTextColor={Colors.placeholderGray}
                    autoFocus
                    selectTextOnFocus
                />
                <View style={styles.editorButtons}>
                    <TouchableOpacity
                        style={styles.editorButtonSave}
                        onPress={handleSave}
                        disabled={isLoading}
                        accessibilityLabel="Guardar"
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <Ionicons name="checkmark" size={22} color={Colors.white} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.editorButtonCancel}
                        onPress={onCancel}
                        disabled={isLoading}
                        accessibilityLabel="Cancelar"
                    >
                        <Ionicons name="close" size={22} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </View>
            {error && <Text style={styles.editorError}>{error}</Text>}
        </View>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ProfileScreen(): React.JSX.Element {
    const {
        profile,
        user,
        updateUsername,
        signOut,
        fetchProfile,
        isLoading,
        error,
        clearError,
    } = useAuthStore();

    const {
        isUploading,
        uploadProgress,
        error: avatarError,
        pickAndUploadAvatar,
        deleteAvatar,
        clearError: clearAvatarError,
    } = useAvatarUpload();

    const [isEditingUsername, setIsEditingUsername] = useState(false);

    const isGenericUsername = profile?.username?.startsWith("user_");

    // Clear errors when leaving edit mode
    useEffect(() => {
        if (!isEditingUsername) {
            clearError();
        }
    }, [isEditingUsername, clearError]);

    /** Handle avatar press - show picker options */
    const handleAvatarPress = useCallback(() => {
        const options: Array<{
            text: string;
            onPress?: () => void;
            style?: "cancel" | "destructive";
        }> = [
                {
                    text: "Tomar foto",
                    onPress: () => {
                        (async () => {
                            if (user?.id) {
                                const url = await pickAndUploadAvatar(user.id, "camera");
                                if (url) {
                                    await fetchProfile();
                                }
                            }
                        })();
                    },
                },
                {
                    text: "Elegir de galería",
                    onPress: () => {
                        (async () => {
                            if (user?.id) {
                                const url = await pickAndUploadAvatar(user.id, "gallery");
                                if (url) {
                                    await fetchProfile();
                                }
                            }
                        })();
                    },
                },
            ];

        // Add remove option if avatar exists
        if (profile?.avatar_url) {
            options.push({
                text: "Eliminar foto",
                style: "destructive",
                onPress: () => {
                    (async () => {
                        if (user?.id) {
                            const success = await deleteAvatar(user.id, profile.avatar_url);
                            if (success) {
                                await fetchProfile();
                            }
                        }
                    })();
                },
            });
        }

        options.push({ text: "Cancelar", style: "cancel" });

        Alert.alert("Foto de perfil", "Elige una opción", options);
    }, [user?.id, profile?.avatar_url, pickAndUploadAvatar, deleteAvatar, fetchProfile]);

    /** Handle username update */
    const handleUpdateUsername = useCallback(
        async (newUsername: string) => {
            const success = await updateUsername(newUsername);
            if (success) {
                setIsEditingUsername(false);
                Alert.alert("Éxito", "Nombre de usuario actualizado");
            }
        },
        [updateUsername]
    );

    /** Handle sign out */
    const handleSignOut = useCallback(() => {
        Alert.alert(
            "Cerrar sesión",
            "¿Estás seguro de que quieres cerrar sesión?",
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Cerrar sesión", style: "destructive", onPress: signOut },
            ]
        );
    }, [signOut]);

    /** Handle delete account */
    const handleDeleteAccount = useCallback(() => {
        Alert.alert(
            "Eliminar cuenta",
            "Esta acción es irreversible. Se eliminarán todos tus datos, listas y recomendaciones. ¿Estás seguro?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar cuenta",
                    style: "destructive",
                    onPress: () => {
                        // TODO: Implement account deletion
                        Alert.alert(
                            "Próximamente",
                            "Esta función estará disponible pronto. Contacta soporte para eliminar tu cuenta."
                        );
                    },
                },
            ]
        );
    }, []);

    /** Open external link */
    const openLink = useCallback((url: string) => {
        Linking.openURL(url).catch(() => {
            Alert.alert("Error", "No se pudo abrir el enlace");
        });
    }, []);

    /** Show settings coming soon */
    const showComingSoon = useCallback((feature: string) => {
        Alert.alert("Próximamente", `${feature} estará disponible pronto.`);
    }, []);

    // Show avatar error if present
    useEffect(() => {
        if (avatarError) {
            Alert.alert("Error", avatarError);
            clearAvatarError();
        }
    }, [avatarError, clearAvatarError]);

    return (
        <View style={styles.container}>
            <KeyboardAwareScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                extraScrollHeight={Platform.select({ ios: 20, android: 40 })}
            >
                {/* Header with Avatar */}
                <View style={styles.header}>
                    <AvatarSection
                        avatarUrl={profile?.avatar_url ?? null}
                        username={profile?.username}
                        email={user?.email}
                        isUploading={isUploading}
                        uploadProgress={uploadProgress}
                        onPress={handleAvatarPress}
                    />
                    <Text style={styles.displayName}>
                        @{profile?.username ?? "usuario"}
                    </Text>
                    <Text style={styles.emailText}>{user?.email}</Text>
                </View>

                {/* Generic username prompt */}
                {isGenericUsername && !isEditingUsername && (
                    <TouchableOpacity
                        style={styles.genericPrompt}
                        onPress={() => setIsEditingUsername(true)}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="information-circle"
                            size={20}
                            color={Colors.bloodRed}
                        />
                        <Text style={styles.genericPromptText}>
                            Aún tienes un nombre genérico. ¡Personaliza tu perfil!
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color={Colors.bloodRed} />
                    </TouchableOpacity>
                )}

                {/* Profile Information Section */}
                <View style={styles.section}>
                    <SectionHeader title="Información del perfil" />

                    {isEditingUsername ? (
                        <UsernameEditor
                            currentUsername={profile?.username ?? ""}
                            isLoading={isLoading}
                            error={error}
                            onSave={handleUpdateUsername}
                            onCancel={() => {
                                setIsEditingUsername(false);
                                clearError();
                            }}
                        />
                    ) : (
                        <InfoRow
                            icon="person-outline"
                            label="Nombre de usuario"
                            value={`@${profile?.username ?? "usuario"}`}
                            isEditable
                            onEdit={() => setIsEditingUsername(true)}
                        />
                    )}

                    <InfoRow
                        icon="mail-outline"
                        label="Correo electrónico"
                        value={user?.email ?? "—"}
                    />

                    <InfoRow
                        icon="calendar-outline"
                        label="Miembro desde"
                        value={
                            profile?.created_at
                                ? formatMemberSince(profile.created_at)
                                : "—"
                        }
                    />
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <SectionHeader title="Configuración" />

                    <SettingsRow
                        icon="notifications-outline"
                        label="Notificaciones"
                        onPress={() => showComingSoon("Notificaciones")}
                    />

                    <SettingsRow
                        icon="moon-outline"
                        label="Tema"
                        onPress={() => showComingSoon("Selección de tema")}
                    />

                    <SettingsRow
                        icon="language-outline"
                        label="Idioma"
                        onPress={() => showComingSoon("Selección de idioma")}
                    />
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <SectionHeader title="Acerca de" />

                    <SettingsRow
                        icon="help-circle-outline"
                        label="Centro de ayuda"
                        onPress={() => showComingSoon("Centro de ayuda")}
                    />

                    <SettingsRow
                        icon="shield-checkmark-outline"
                        label="Política de privacidad"
                        onPress={() => showComingSoon("Política de privacidad")}
                    />

                    <SettingsRow
                        icon="document-text-outline"
                        label="Términos de servicio"
                        onPress={() => showComingSoon("Términos de servicio")}
                    />

                    <View style={styles.versionRow}>
                        <Ionicons
                            name="information-circle-outline"
                            size={22}
                            color={Colors.metalSilver}
                        />
                        <Text style={styles.settingsLabel}>Versión</Text>
                        <Text style={styles.versionText}>{APP_VERSION}</Text>
                    </View>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <SectionHeader title="Cuenta" />

                    <SettingsRow
                        icon="trash-outline"
                        label="Eliminar cuenta"
                        onPress={handleDeleteAccount}
                        destructive
                    />
                </View>

                {/* Sign Out Button */}
                <TouchableOpacity
                    style={styles.signOutButton}
                    onPress={handleSignOut}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={22} color={Colors.white} />
                    <Text style={styles.signOutText}>Cerrar Sesión</Text>
                </TouchableOpacity>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>CortoCrudo v{APP_VERSION}</Text>
                    <Text style={styles.footerAuthor}>Made with ❤️ by Pabl0Parra</Text>
                </View>
            </KeyboardAwareScrollView>
        </View>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "transparent",
    } as ViewStyle,
    scrollView: {
        flex: 1,
    } as ViewStyle,
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40,
    } as ViewStyle,

    // Header
    header: {
        alignItems: "center",
        marginBottom: 24,
    } as ViewStyle,
    avatarContainer: {
        marginBottom: 16,
    } as ViewStyle,
    avatarWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: "hidden",
        position: "relative",
    } as ViewStyle,
    avatarImage: {
        width: "100%",
        height: "100%",
    } as ImageStyle,
    avatarPlaceholder: {
        width: "100%",
        height: "100%",
        backgroundColor: Colors.metalGray,
        borderWidth: 2,
        borderColor: Colors.metalSilver,
        borderRadius: 60,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    avatarInitials: {
        fontSize: 40,
        fontWeight: "bold",
        color: Colors.metalSilver,
    } as TextStyle,
    avatarOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    uploadProgressText: {
        color: Colors.white,
        fontSize: 14,
        marginTop: 8,
        fontWeight: "600",
    } as TextStyle,
    cameraBadge: {
        position: "absolute",
        bottom: 4,
        right: 4,
        backgroundColor: Colors.bloodRed,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: Colors.metalBlack,
    } as ViewStyle,
    displayName: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.white,
        marginBottom: 4,
    } as TextStyle,
    emailText: {
        fontSize: 14,
        color: Colors.metalSilver,
    } as TextStyle,

    // Generic username prompt
    genericPrompt: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(220, 38, 38, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(220, 38, 38, 0.3)",
        borderRadius: 12,
        padding: 14,
        marginBottom: 24,
        gap: 10,
    } as ViewStyle,
    genericPromptText: {
        flex: 1,
        color: Colors.bloodRed,
        fontSize: 14,
        fontWeight: "500",
    } as TextStyle,

    // Sections
    section: {
        backgroundColor: Colors.metalGray,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    } as ViewStyle,
    sectionTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.metalSilver,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 16,
    } as TextStyle,

    // Info rows
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(113, 113, 122, 0.2)",
    } as ViewStyle,
    infoRowLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    } as ViewStyle,
    infoRowText: {
        marginLeft: 14,
        flex: 1,
    } as ViewStyle,
    infoLabel: {
        fontSize: 12,
        color: Colors.metalSilver,
        marginBottom: 2,
    } as TextStyle,
    infoValue: {
        fontSize: 16,
        color: Colors.white,
        fontWeight: "500",
    } as TextStyle,
    editButton: {
        padding: 8,
    } as ViewStyle,

    // Settings rows
    settingsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(113, 113, 122, 0.2)",
    } as ViewStyle,
    settingsRowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    } as ViewStyle,
    settingsLabel: {
        fontSize: 16,
        color: Colors.white,
    } as TextStyle,
    settingsLabelDestructive: {
        color: Colors.bloodRed,
    } as TextStyle,
    versionRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        gap: 14,
    } as ViewStyle,
    versionText: {
        fontSize: 16,
        color: Colors.metalSilver,
        marginLeft: "auto",
    } as TextStyle,

    // Username editor
    editorContainer: {
        paddingVertical: 8,
    } as ViewStyle,
    editorInputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    } as ViewStyle,
    editorInput: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
        borderWidth: 1,
        borderColor: Colors.bloodRed,
        borderRadius: 10,
        color: Colors.white,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
    } as TextStyle,
    editorButtons: {
        flexDirection: "row",
        gap: 8,
    } as ViewStyle,
    editorButtonSave: {
        backgroundColor: "#22c55e",
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    editorButtonCancel: {
        backgroundColor: Colors.bloodRed,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    editorError: {
        color: Colors.bloodRed,
        fontSize: 13,
        marginTop: 10,
    } as TextStyle,

    // Sign out button
    signOutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: Colors.bloodRed,
        paddingVertical: 16,
        borderRadius: 12,
        gap: 10,
        marginTop: 8,
    } as ViewStyle,
    signOutText: {
        color: Colors.white,
        fontWeight: "bold",
        fontSize: 16,
    } as TextStyle,

    // Footer
    footer: {
        alignItems: "center",
        marginTop: 32,
        paddingBottom: 20,
    } as ViewStyle,
    footerText: {
        color: Colors.metalSilver,
        fontSize: 14,
        opacity: 0.6,
    } as TextStyle,
    footerAuthor: {
        color: Colors.metalSilver,
        fontSize: 12,
        marginTop: 4,
        opacity: 0.4,
    } as TextStyle,
});