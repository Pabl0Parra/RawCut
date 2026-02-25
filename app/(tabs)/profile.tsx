import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Modal } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter, Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../src/stores/authStore";
import { useRecommendationStore } from "../../src/stores/recommendationStore";
import { useContentStore } from "../../src/stores/contentStore";
import { useAvatarUpload } from "../../src/hooks/useAvatarUpload";
import { Colors } from "../../src/constants/Colors";

const APP_VERSION = "1.0.0";

const LANGUAGES = [
    { code: "es", label: "Español" },
    { code: "en", label: "English" },
    { code: "ca", label: "Català" },
];

const LINKS = {
    help: "https://cortoCrudo.app/help",
    privacy: "https://cortoCrudo.app/privacy",
    terms: "https://cortoCrudo.app/terms",
} as const;

function formatMemberSince(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function getInitials(username: string | undefined, email: string | undefined): string {
    if (username && !username.startsWith("user_")) {
        return username.slice(0, 2).toUpperCase();
    }
    if (email) {
        return email.slice(0, 2).toUpperCase();
    }
    return "??";
}

interface AvatarSectionProps {
    readonly avatarUrl: string | null;
    readonly username: string | undefined;
    readonly email: string | undefined;
    readonly isUploading: boolean;
    readonly uploadProgress: number;
    readonly onPress: () => void;
}

function AvatarSection({
    avatarUrl,
    username,
    email,
    isUploading,
    uploadProgress,
    onPress,
}: Readonly<AvatarSectionProps>): React.JSX.Element {
    const { t } = useTranslation();
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
                        onError={() => console.warn("[Profile] Avatar image failed to load")}
                    />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                )}

                { }
                {isUploading && (
                    <View style={styles.avatarOverlay}>
                        <ActivityIndicator size="large" color={Colors.white} />
                        <Text style={styles.uploadProgressText}>
                            {Math.round(uploadProgress * 100)}%
                        </Text>
                    </View>
                )}
            </View>

            { }
            {!isUploading && (
                <View style={styles.cameraBadge}>
                    <Ionicons name="camera" size={16} color={Colors.white} />
                </View>
            )}
        </TouchableOpacity>
    );
}

interface SectionHeaderProps {
    readonly title: string;
}

function SectionHeader({ title }: Readonly<SectionHeaderProps>): React.JSX.Element {
    return <Text style={styles.sectionTitle}>{title}</Text>;
}

interface InfoRowProps {
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly label: string;
    readonly value: string;
    readonly onEdit?: () => void;
    readonly isEditable?: boolean;
}

function InfoRow({
    icon,
    label,
    value,
    onEdit,
    isEditable = false,
}: Readonly<InfoRowProps>): React.JSX.Element {
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

interface SettingsRowProps {
    readonly icon: keyof typeof Ionicons.glyphMap;
    readonly label: string;
    readonly onPress: () => void;
    readonly rightElement?: React.ReactNode;
    readonly destructive?: boolean;
}

function SettingsRow({
    icon,
    label,
    onPress,
    rightElement,
    destructive = false,
}: Readonly<SettingsRowProps>): React.JSX.Element {
    return (
        <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
                console.log(`[SettingsRow] Pressed: ${label}`);
                onPress();
            }}
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

interface UsernameEditorProps {
    readonly currentUsername: string;
    readonly isLoading: boolean;
    readonly error: string | null;
    readonly onSave: (newUsername: string) => Promise<void>;
    readonly onCancel: () => void;
}

function UsernameEditor({
    currentUsername,
    isLoading,
    error,
    onSave,
    onCancel,
}: Readonly<UsernameEditorProps>): React.JSX.Element {
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
                    placeholderTextColor={Colors.textPlaceholder}
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

export default function ProfileScreen(): React.JSX.Element {
    const router = useRouter();
    const {
        profile,
        user,
        updateUsername,
        signOut,
        deleteAccount,
        fetchProfile,
        isLoading,
        error,
        clearError,
    } = useAuthStore();

    const { clearContent } = useContentStore();
    const { clearRecommendations } = useRecommendationStore();

    const {
        isUploading,
        uploadProgress,
        error: avatarError,
        pickAndUploadAvatar,
        deleteAvatar,
        clearError: clearAvatarError,
    } = useAvatarUpload();

    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const { t, i18n } = useTranslation();

    const isGenericUsername = profile?.username?.startsWith("user_");


    useEffect(() => {
        if (!isEditingUsername) {
            clearError();
        }
    }, [isEditingUsername, clearError]);


    const handleAvatarPress = useCallback(() => {
        const options: Array<{
            text: string;
            onPress?: () => void;
            style?: "cancel" | "destructive";
        }> = [
                {
                    text: t("profile.avatar.takePhoto"),
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
                    text: t("profile.avatar.chooseGallery"),
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


        if (profile?.avatar_url) {
            options.push({
                text: t("profile.avatar.deletePhoto"),
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

        options.push({ text: t("profile.avatar.cancel"), style: "cancel" });

        Alert.alert(t("profile.avatar.title"), t("profile.avatar.subtitle"), options);
    }, [user?.id, profile?.avatar_url, pickAndUploadAvatar, deleteAvatar, fetchProfile, t]);


    const handleUpdateUsername = useCallback(
        async (newUsername: string) => {
            const success = await updateUsername(newUsername);
            if (success) {
                setIsEditingUsername(false);
                Alert.alert(t("profile.alerts.success"), t("profile.alerts.successUsername"));
            }
        },
        [updateUsername]
    );


    const handleSignOut = useCallback(() => {
        Alert.alert(
            t("profile.alerts.signOutTitle"),
            t("profile.alerts.signOutText"),
            [
                { text: t("profile.actions.cancel"), style: "cancel" },
                { text: t("profile.actions.signOut"), style: "destructive", onPress: signOut },
            ]
        );
    }, [signOut, t]);


    const handleDeleteAccount = useCallback(() => {
        Alert.alert(
            t("profile.alerts.deleteAccountTitle"),
            t("profile.alerts.deleteAccountText"),
            [
                { text: t("profile.actions.cancel"), style: "cancel" },
                {
                    text: t("profile.alerts.deleteAccountConfirm"),
                    style: "destructive",
                    onPress: () => {
                        (async () => {

                            if (profile?.avatar_url && user?.id) {
                                await deleteAvatar(user.id, profile.avatar_url);
                            }


                            const success = await deleteAccount();

                            if (success) {

                                clearContent();
                                clearRecommendations();

                                Alert.alert(
                                    t("profile.alerts.accountDeletedTitle"),
                                    t("profile.alerts.accountDeletedText")
                                );
                            } else {
                                Alert.alert(
                                    t("profile.alerts.errorTitle"),
                                    t("profile.alerts.errorDeleteAccount")
                                );
                            }
                        })();
                    },
                },
            ]
        );
    }, [user?.id, profile?.avatar_url, deleteAccount, deleteAvatar, clearContent, clearRecommendations, t]);


    const showComingSoon = useCallback((feature: string) => {
        Alert.alert(t("profile.alerts.comingSoonTitle"), `${feature} ${t("profile.alerts.comingSoonText")}`);
    }, [t]);


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
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                extraScrollHeight={Platform.select({ ios: 20, android: 40 })}
            >
                { }
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

                { }
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
                            {t("profile.genericUsername")}
                        </Text>
                        <Ionicons name="chevron-forward" size={18} color={Colors.bloodRed} />
                    </TouchableOpacity>
                )}

                { }
                <View style={styles.section}>
                    <SectionHeader title={t("profile.sections.info")} />

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
                            label={t("profile.fields.username")}
                            value={`@${profile?.username ?? "usuario"}`}
                            isEditable
                            onEdit={() => setIsEditingUsername(true)}
                        />
                    )}

                    <InfoRow
                        icon="mail-outline"
                        label={t("profile.fields.email")}
                        value={user?.email ?? "—"}
                    />

                    <InfoRow
                        icon="calendar-outline"
                        label={t("profile.fields.memberSince")}
                        value={
                            profile?.created_at
                                ? formatMemberSince(profile.created_at)
                                : "—"
                        }
                    />
                </View>

                { }
                <View style={styles.section}>
                    <SectionHeader title={t("profile.sections.settings")} />

                    <SettingsRow
                        icon="notifications-outline"
                        label={t("profile.settings.notifications")}
                        onPress={() => showComingSoon(t("profile.settings.notifications"))}
                    />

                    <SettingsRow
                        icon="moon-outline"
                        label={t("profile.settings.theme")}
                        onPress={() => showComingSoon(t("profile.settings.theme"))}
                    />

                    <SettingsRow
                        icon="language-outline"
                        label={t("profile.settings.language")}
                        onPress={() => setIsLanguageModalVisible(true)}
                        rightElement={<Text style={styles.languageText}>{LANGUAGES.find(l => l.code === i18n.language)?.label || "Español"}</Text>}
                    />
                </View>

                { }
                <View style={styles.section}>
                    <SectionHeader title={t("profile.sections.about")} />

                    <SettingsRow
                        icon="help-circle-outline"
                        label={t("profile.about.helpCenter")}
                        onPress={() => router.push("/help")}
                    />

                    <SettingsRow
                        icon="shield-checkmark-outline"
                        label={t("profile.about.privacyPolicy")}
                        onPress={() => router.push("/privacy")}
                    />

                    <SettingsRow
                        icon="document-text-outline"
                        label={t("profile.about.termsService")}
                        onPress={() => router.push("/terms")}
                    />

                    <View style={styles.versionRow}>
                        <Ionicons
                            name="information-circle-outline"
                            size={22}
                            color={Colors.metalSilver}
                        />
                        <Text style={styles.settingsLabel}>{t("profile.about.version")}</Text>
                        <Text style={styles.versionText}>{APP_VERSION}</Text>
                    </View>
                </View>

                { }
                <View style={styles.section}>
                    <SectionHeader title={t("profile.sections.account")} />

                    <SettingsRow
                        icon="trash-outline"
                        label={t("profile.actions.deleteAccount")}
                        onPress={handleDeleteAccount}
                        destructive
                    />
                </View>

                { }
                <TouchableOpacity
                    style={styles.signOutButton}
                    onPress={handleSignOut}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={22} color={Colors.white} />
                    <Text style={styles.signOutText}>{t("profile.actions.signOut")}</Text>
                </TouchableOpacity>

                { }
                <View style={styles.footer}>
                    <Text style={styles.footerText}>CortoCrudo v{APP_VERSION}</Text>
                    <Text style={styles.footerAuthor}>{t("profile.about.author")}</Text>
                </View>
            </KeyboardAwareScrollView>

            {/* Modal de Idioma */}
            <Modal
                visible={isLanguageModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsLanguageModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsLanguageModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t("profile.languageModal.title")}</Text>

                        {LANGUAGES.map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[
                                    styles.languageOption,
                                    i18n.language === lang.code && styles.languageOptionSelected
                                ]}
                                onPress={() => {
                                    i18n.changeLanguage(lang.code);
                                    setIsLanguageModalVisible(false);
                                }}
                            >
                                <Text style={[
                                    styles.languageOptionText,
                                    i18n.language === lang.code && styles.languageOptionTextSelected
                                ]}>
                                    {lang.label}
                                </Text>
                                {i18n.language === lang.code && (
                                    <Ionicons name="checkmark" size={20} color={Colors.bloodRed} />
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setIsLanguageModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>{t("profile.languageModal.close")}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

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


    header: {
        alignItems: "center",
        marginBottom: 24,
    } as ViewStyle,
    avatarContainer: {
        marginBottom: 16,
        position: "relative",
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
        backgroundColor: Colors.overlayDark,
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
        zIndex: 10,
        elevation: 5,
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


    genericPrompt: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.glassRedSubtle,
        borderWidth: 1,
        borderColor: Colors.glassRedBorder,
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


    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.glassSilver,
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


    settingsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.glassSilver,
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
    languageText: {
        fontSize: 16,
        color: Colors.metalSilver,
        marginRight: 8,
    } as TextStyle,
    versionText: {
        fontSize: 16,
        color: Colors.metalSilver,
        marginLeft: "auto",
    } as TextStyle,


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
        backgroundColor: Colors.successGreen,
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

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: Colors.overlayDark,
        justifyContent: "flex-end",
    } as ViewStyle,
    modalContent: {
        backgroundColor: Colors.metalGray,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === "ios" ? 40 : 24,
    } as ViewStyle,
    modalTitle: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    } as TextStyle,
    languageOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: Colors.metalBlack,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.glassSilver,
    } as ViewStyle,
    languageOptionSelected: {
        borderColor: Colors.bloodRed,
        backgroundColor: Colors.glassRedSubtle,
    } as ViewStyle,
    languageOptionText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: "500",
    } as TextStyle,
    languageOptionTextSelected: {
        color: Colors.bloodRed,
        fontWeight: "bold",
    } as TextStyle,
    modalCloseButton: {
        marginTop: 12,
        paddingVertical: 16,
        alignItems: "center",
        borderRadius: 12,
        backgroundColor: Colors.metalBlack,
    } as ViewStyle,
    modalCloseText: {
        color: Colors.metalSilver,
        fontSize: 16,
        fontWeight: "bold",
    } as TextStyle,
});