import React, { useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    StyleSheet,
    Alert,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../constants/Colors";
import type { Profile } from "../lib/supabase";
import { supabase } from "../lib/supabase";
import {
    loadAllUsers,
    searchUsers,
    sendRecommendation,
} from "../utils/movieDetail.utils";
import type {
    SendRecommendationParams,
    MediaType,
} from "../types/movieDetail.types";

export interface BaseRecommendModalProps {
    visible: boolean;
    onClose: () => void;
    contentId: number;
    contentTitle: string;
    contentYear: string;
    posterUrl: string | null;
    mediaType: MediaType;
    currentUserId: string | undefined;
    enableSearch?: boolean;
}

interface RecommendationState {
    message: string;
    searchQuery: string;
    users: Profile[];
    selectedUsers: Profile[];
    isSending: boolean;
    isLoadingUsers: boolean;
    showUserList: boolean;
}

const INITIAL_STATE: RecommendationState = {
    message: "",
    searchQuery: "",
    users: [],
    selectedUsers: [],
    isSending: false,
    isLoadingUsers: false,
    showUserList: true,
};

const MAX_MESSAGE_LENGTH = 200;

export const BaseRecommendModal: React.FC<BaseRecommendModalProps> = ({
    visible,
    onClose,
    contentId,
    contentTitle,
    contentYear,
    posterUrl,
    mediaType,
    currentUserId,
    enableSearch = false,
}) => {
    const [state, setState] = useState<RecommendationState>(INITIAL_STATE);

    const {
        message,
        searchQuery,
        users,
        selectedUsers,
        isSending,
        isLoadingUsers,
        showUserList,
    } = state;

    
    useEffect(() => {
        if (visible) {
            setState(INITIAL_STATE);
            handleLoadAllUsers();
        }
    }, [visible]);

    const updateState = (updates: Partial<RecommendationState>): void => {
        setState((prev) => ({ ...prev, ...updates }));
    };

    const handleLoadAllUsers = useCallback(async (): Promise<void> => {
        if (!currentUserId) return;

        updateState({ isLoadingUsers: true });

        try {
            const loadedUsers = await loadAllUsers(currentUserId);
            
            const filtered = loadedUsers.filter((u) => u.user_id !== currentUserId);
            updateState({ users: filtered, isLoadingUsers: false });
        } catch (err) {
            console.error("Error loading users:", err);
            updateState({ isLoadingUsers: false });
            Alert.alert("Error", "No se pudieron cargar los usuarios");
        }
    }, [currentUserId]);

    const handleSearchUsers = useCallback(
        async (query: string): Promise<void> => {
            if (!currentUserId) return;

            updateState({ searchQuery: query });

            if (query.length <= 2) {
                handleLoadAllUsers();
                return;
            }

            updateState({ isLoadingUsers: true });

            try {
                const searchResults = await searchUsers(query, currentUserId);
                updateState({ users: searchResults, isLoadingUsers: false });
            } catch (err) {
                console.error("Error searching users:", err);
                updateState({ isLoadingUsers: false });
            }
        },
        [currentUserId, handleLoadAllUsers]
    );

    
    const handleToggleUser = (user: Profile): void => {
        const isSelected = selectedUsers.some((u) => u.user_id === user.user_id);
        const newSelected = isSelected
            ? selectedUsers.filter((u) => u.user_id !== user.user_id)
            : [...selectedUsers, user];
        updateState({ selectedUsers: newSelected });
    };

    
    const handleRemoveUser = (userId: string): void => {
        updateState({
            selectedUsers: selectedUsers.filter((u) => u.user_id !== userId),
        });
    };

    const handleToggleUserList = (): void => {
        updateState({ showUserList: !showUserList });
    };

    const handleSendRecommendation = async (): Promise<void> => {
        if (!currentUserId || selectedUsers.length === 0) return;

        updateState({ isSending: true });

        
        const receiverIds = selectedUsers.map((u) => u.user_id);
        const { data: existing } = await supabase
            .from("recommendations")
            .select("receiver_id")
            .eq("sender_id", currentUserId)
            .eq("tmdb_id", contentId)
            .eq("media_type", mediaType)
            .in("receiver_id", receiverIds);

        const alreadySentTo = new Set((existing ?? []).map((r: { receiver_id: string }) => r.receiver_id));
        const newRecipients = selectedUsers.filter((u) => !alreadySentTo.has(u.user_id));

        if (newRecipients.length === 0) {
            updateState({ isSending: false });
            Alert.alert(
                "Ya enviada",
                "Ya has recomendado este título a todos los usuarios seleccionados."
            );
            return;
        }

        const results = await Promise.all(
            newRecipients.map((user) => {
                const params: SendRecommendationParams = {
                    senderId: currentUserId,
                    receiverId: user.user_id,
                    tmdbId: contentId,
                    mediaType,
                    message: message || null,
                };
                return sendRecommendation(params);
            })
        );

        updateState({ isSending: false });

        const failedCount = results.filter((r) => !r.success).length;
        const skippedCount = alreadySentTo.size;

        if (failedCount === 0) {
            const count = newRecipients.length;
            const skippedNote = skippedCount > 0
                ? ` (${skippedCount} ya enviada${skippedCount > 1 ? "s" : ""})`
                : "";
            Alert.alert(
                "¡Éxito!",
                count === 1
                    ? `¡Recomendación enviada!${skippedNote}`
                    : `¡Recomendación enviada a ${count} usuarios!${skippedNote}`
            );
            onClose();
        } else if (failedCount < newRecipients.length) {
            Alert.alert(
                "Parcialmente enviado",
                `${newRecipients.length - failedCount} de ${newRecipients.length} recomendaciones se enviaron correctamente.`
            );
            onClose();
        } else {
            Alert.alert("Error", "Error al enviar la recomendación");
        }
    };

    const renderUserList = (): React.JSX.Element | null => {
        if (!showUserList) return null;

        if (isLoadingUsers) {
            return (
                <ActivityIndicator
                    size="small"
                    color={Colors.bloodRed}
                    style={styles.loadingIndicator}
                />
            );
        }

        if (users.length > 0) {
            return (
                <View style={styles.searchResults}>
                    {users.map((user) => {
                        const isSelected = selectedUsers.some(
                            (u) => u.user_id === user.user_id
                        );
                        return (
                            <TouchableOpacity
                                key={user.user_id}
                                style={[
                                    styles.searchResultItem,
                                    isSelected && styles.searchResultSelected,
                                ]}
                                onPress={() => handleToggleUser(user)}
                            >
                                <View style={styles.userItemContent}>
                                    <View>
                                        {!!user.display_name && (
                                            <Text style={styles.searchResultText}>
                                                {user.display_name}
                                            </Text>
                                        )}
                                        <Text style={styles.usernameText}>
                                            @{user.username}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={20}
                                            color={Colors.bloodRed}
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            );
        }

        return (
            <View style={styles.emptyUsersContainer}>
                <Text style={styles.emptyUsersText}>
                    No hay otros usuarios disponibles
                </Text>
            </View>
        );
    };

    const dropdownLabel =
        selectedUsers.length === 0
            ? "Toca para seleccionar usuario(s)..."
            : `${selectedUsers.length} usuario${selectedUsers.length > 1 ? "s" : ""} seleccionado${selectedUsers.length > 1 ? "s" : ""}`;

    const canSend = selectedUsers.length > 0 && !isSending;

    const sendButtonLabel = isSending
        ? undefined
        : selectedUsers.length <= 1
            ? "Enviar Recomendación"
            : `Enviar a ${selectedUsers.length} usuarios`;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalContainer}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollContent}
                >
                    {}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Recomendar</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {}
                    <View style={styles.previewContainer}>
                        {!!posterUrl && (
                            <Image
                                source={{ uri: posterUrl }}
                                style={styles.previewImage}
                            />
                        )}
                        <View style={styles.previewInfo}>
                            <Text style={styles.previewTitle}>{contentTitle}</Text>
                            <Text style={styles.previewYear}>{contentYear}</Text>
                        </View>
                    </View>

                    {}
                    {enableSearch && (
                        <>
                            <Text style={styles.inputLabel}>Buscar usuario</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Escribe un nombre de usuario..."
                                placeholderTextColor="#71717a"
                                value={searchQuery}
                                onChangeText={handleSearchUsers}
                                onFocus={() => updateState({ showUserList: true })}
                            />
                        </>
                    )}

                    {}
                    {!enableSearch && (
                        <Text style={styles.inputLabel}>Seleccionar usuario(s)</Text>
                    )}

                    {}
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={handleToggleUserList}
                    >
                        <Text style={styles.dropdownButtonText}>{dropdownLabel}</Text>
                        <Ionicons
                            name={showUserList ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={Colors.metalSilver}
                        />
                    </TouchableOpacity>

                    {}
                    <View style={styles.userListContainer}>{renderUserList()}</View>

                    {}
                    {selectedUsers.length > 0 && (
                        <View style={styles.chipsContainer}>
                            {selectedUsers.map((user) => (
                                <View key={user.user_id} style={styles.chip}>
                                    <Text style={styles.chipText}>
                                        @{user.username}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => handleRemoveUser(user.user_id)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <Text style={styles.chipRemove}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {}
                    <View style={styles.messageContainer}>
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            placeholder="¿Por qué recomiendas esto?"
                            placeholderTextColor="#71717a"
                            value={message}
                            onChangeText={(text) => updateState({ message: text })}
                            maxLength={MAX_MESSAGE_LENGTH}
                            multiline
                            numberOfLines={3}
                        />
                        <Text style={styles.charCount}>
                            {message.length}/{MAX_MESSAGE_LENGTH}
                        </Text>
                    </View>

                    {}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.sendButton, !canSend && styles.disabledButton]}
                            onPress={handleSendRecommendation}
                            disabled={!canSend}
                        >
                            {isSending ? (
                                <ActivityIndicator color="#0a0a0a" />
                            ) : (
                                <Text style={styles.sendButtonText}>{sendButtonLabel}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
        padding: 16,
    } as ViewStyle,
    scrollContent: {
        flexGrow: 1,
    } as ViewStyle,
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    } as ViewStyle,
    modalTitle: {
        color: "#f4f4f5",
        fontSize: 24,
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
    closeButtonText: {
        color: Colors.bloodRed,
        fontSize: 18,
    } as TextStyle,
    previewContainer: {
        flexDirection: "row",
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    } as ViewStyle,
    previewImage: {
        width: 50,
        height: 75,
        borderRadius: 4,
    } as ImageStyle,
    previewInfo: {
        flex: 1,
        marginLeft: 12,
    } as ViewStyle,
    previewTitle: {
        color: "#f4f4f5",
        fontWeight: "bold",
    } as TextStyle,
    previewYear: {
        color: Colors.metalSilver,
        fontSize: 14,
    } as TextStyle,
    inputLabel: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    } as TextStyle,
    input: {
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        color: "#f4f4f5",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 4,
        marginBottom: 8,
    } as TextStyle,
    multilineInput: {
        marginBottom: 4,
        minHeight: 80,
        textAlignVertical: "top",
    } as TextStyle,
    dropdownButton: {
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 4,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    } as ViewStyle,
    dropdownButtonText: {
        color: "#f4f4f5",
        flex: 1,
    } as TextStyle,
    userListContainer: {
        zIndex: 50,
    } as ViewStyle,
    loadingIndicator: {
        marginVertical: 8,
    } as ViewStyle,
    searchResults: {
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        marginBottom: 16,
        maxHeight: 200,
        borderWidth: 1,
        borderColor: Colors.bloodRed,
        overflow: "hidden",
    } as ViewStyle,
    searchResultItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.metalSilver,
    } as ViewStyle,
    searchResultSelected: {
        backgroundColor: "rgba(220, 38, 38, 0.2)",
        borderColor: Colors.bloodRed,
    } as ViewStyle,
    searchResultText: {
        color: "#f4f4f5",
    } as TextStyle,
    usernameText: {
        color: "#f4f4f5",
        fontSize: 12,
        opacity: 0.7,
    } as TextStyle,
    userItemContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    } as ViewStyle,
    emptyUsersContainer: {
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        alignItems: "center",
    } as ViewStyle,
    emptyUsersText: {
        color: Colors.metalSilver,
        textAlign: "center",
    } as TextStyle,
    
    chipsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 16,
    } as ViewStyle,
    chip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(220, 38, 38, 0.15)",
        borderWidth: 1,
        borderColor: Colors.bloodRed,
        borderRadius: 9999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
    } as ViewStyle,
    chipText: {
        color: "#f4f4f5",
        fontSize: 13,
    } as TextStyle,
    chipRemove: {
        color: Colors.bloodRed,
        fontSize: 12,
        fontWeight: "bold",
    } as TextStyle,
    messageContainer: {
        flex: 1,
    } as ViewStyle,
    charCount: {
        color: Colors.metalSilver,
        fontSize: 12,
        textAlign: "right",
        marginTop: 4,
    } as TextStyle,
    buttonContainer: {
        paddingTop: 16,
    } as ViewStyle,
    sendButton: {
        backgroundColor: Colors.bloodRed,
        paddingVertical: 16,
        borderRadius: 4,
    } as ViewStyle,
    disabledButton: {
        opacity: 0.5,
    } as ViewStyle,
    sendButtonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
        textTransform: "uppercase",
    } as TextStyle,
});

export default BaseRecommendModal;
