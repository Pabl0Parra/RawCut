import React, { useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Alert,
    type ViewStyle,
    type TextStyle,
    type ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { Colors } from "../constants/Colors";
import type { Profile } from "../lib/supabase";
import type { GenericRecommendModalProps } from "../types/tvDetail.types";
import {
    loadAllUsers,
    sendRecommendation,
} from "../utils/movieDetail.utils";

/**
 * State for the recommendation modal
 */
interface RecommendationState {
    message: string;
    users: Profile[];
    selectedUser: Profile | null;
    isSending: boolean;
    isLoadingUsers: boolean;
    showUserList: boolean;
}

const INITIAL_STATE: RecommendationState = {
    message: "",
    users: [],
    selectedUser: null,
    isSending: false,
    isLoadingUsers: false,
    showUserList: true,
};

const MAX_MESSAGE_LENGTH = 200;

/**
 * Generic recommendation modal that works for both movies and TV shows
 */
export const ContentRecommendModal: React.FC<GenericRecommendModalProps> = ({
    visible,
    onClose,
    contentId,
    contentTitle,
    contentYear,
    posterUrl,
    mediaType,
    currentUserId,
}) => {
    const [state, setState] = useState<RecommendationState>(INITIAL_STATE);

    const {
        message,
        users,
        selectedUser,
        isSending,
        isLoadingUsers,
        showUserList,
    } = state;

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setState(INITIAL_STATE);
            handleLoadUsers();
        }
    }, [visible]);

    const updateState = (updates: Partial<RecommendationState>): void => {
        setState((prev) => ({ ...prev, ...updates }));
    };

    const handleLoadUsers = useCallback(async (): Promise<void> => {
        updateState({ isLoadingUsers: true });

        try {
            const loadedUsers = await loadAllUsers(currentUserId);
            updateState({ users: loadedUsers, isLoadingUsers: false });
        } catch (err) {
            console.error("Error loading users:", err);
            updateState({ isLoadingUsers: false });
            Alert.alert("Error", "No se pudieron cargar los usuarios");
        }
    }, [currentUserId]);

    const handleSelectUser = (user: Profile): void => {
        updateState({ selectedUser: user, showUserList: false });
    };

    const handleClearSelectedUser = (): void => {
        updateState({ selectedUser: null });
    };

    const handleToggleUserList = (): void => {
        updateState({ showUserList: !showUserList });
    };

    const handleSendRecommendation = async (): Promise<void> => {
        if (!currentUserId || !selectedUser) return;

        updateState({ isSending: true });

        const result = await sendRecommendation({
            senderId: currentUserId,
            receiverId: selectedUser.user_id,
            tmdbId: contentId,
            mediaType,
            message: message || null,
        });

        updateState({ isSending: false });

        if (result.success) {
            Alert.alert("¡Éxito!", "¡Recomendación enviada!");
            onClose();
        } else {
            Alert.alert("Error", "Error al enviar recomendación");
        }
    };

    const renderUserItem = ({ item }: { item: Profile }): React.JSX.Element => {
        const isSelected = selectedUser?.user_id === item.user_id;

        return (
            <TouchableOpacity
                style={[
                    styles.searchResultItem,
                    isSelected && styles.searchResultSelected,
                ]}
                onPress={() => handleSelectUser(item)}
            >
                <View style={styles.userItemContent}>
                    <View>
                        {item.display_name && (
                            <Text style={styles.searchResultText}>
                                {item.display_name}
                            </Text>
                        )}
                        <Text style={styles.usernameText}>@{item.username}</Text>
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
    };

    const renderEmptyUserList = (): React.JSX.Element => (
        <Text style={styles.emptyListText}>No se encontraron usuarios</Text>
    );

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
                    <FlatList
                        data={users}
                        keyExtractor={(item) => item.user_id}
                        keyboardShouldPersistTaps="handled"
                        renderItem={renderUserItem}
                        ListEmptyComponent={renderEmptyUserList}
                    />
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

    const selectedUserDisplay = selectedUser?.display_name ||
        (selectedUser ? `@${selectedUser.username}` : "Toca para seleccionar usuario...");

    const canSend = selectedUser !== null && !isSending;

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
                {/* Header */}
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Recomendar</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Content Preview */}
                <View style={styles.previewContainer}>
                    {posterUrl && (
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

                {/* User Selection */}
                <Text style={styles.inputLabel}>Seleccionar usuario</Text>
                <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={handleToggleUserList}
                >
                    <Text style={styles.dropdownButtonText}>
                        {selectedUserDisplay}
                    </Text>
                    <Ionicons
                        name={showUserList ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={Colors.metalSilver}
                    />
                </TouchableOpacity>

                {/* User List */}
                <View style={styles.userListContainer}>{renderUserList()}</View>

                {/* Selected User Badge */}
                {selectedUser && (
                    <View style={styles.selectedUserContainer}>
                        <Text style={styles.selectedUserText}>
                            Para: @{selectedUser.username}
                        </Text>
                        <TouchableOpacity onPress={handleClearSelectedUser}>
                            <Text style={styles.removeUserText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Message Input */}
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

                {/* Send Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.sendButton, !canSend && styles.disabledButton]}
                        onPress={handleSendRecommendation}
                        disabled={!canSend}
                    >
                        {isSending ? (
                            <ActivityIndicator color="#0a0a0a" />
                        ) : (
                            <Text style={styles.sendButtonText}>
                                Enviar Recomendación
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
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
        maxHeight: 180,
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
    emptyListText: {
        color: Colors.metalSilver,
        padding: 12,
        textAlign: "center",
    } as TextStyle,
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
    selectedUserContainer: {
        backgroundColor: Colors.metalGray,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    } as ViewStyle,
    selectedUserText: {
        color: "#f4f4f5",
    } as TextStyle,
    removeUserText: {
        color: Colors.bloodRed,
    } as TextStyle,
    messageContainer: {
        flex: 1,
    } as ViewStyle,
    input: {
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: Colors.metalSilver,
        color: "#f4f4f5",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 4,
    } as TextStyle,
    multilineInput: {
        minHeight: 80,
        textAlignVertical: "top",
    } as TextStyle,
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

export default ContentRecommendModal;