import React, { memo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
} from "react-native";

import { Colors } from "../constants/Colors";

const VOTE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const VotePicker = memo(function VotePicker({
    current,
    onSelect,
    onClose,
}: {
    current?: number;
    onSelect: (v: number) => void;
    onClose: () => void;
}) {
    return (
        <Modal transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
                <View style={styles.panel} onStartShouldSetResponder={() => true}>
                    <Text style={styles.title}>Tu puntuación</Text>
                    <View style={styles.row}>
                        {VOTE_OPTIONS.map((n) => (
                            <TouchableOpacity
                                key={n}
                                style={[styles.btn, current === n && styles.btnActive]}
                                onPress={() => { onSelect(n); onClose(); }}
                            >
                                <Text style={[styles.btnText, current === n && styles.btnTextActive]}>
                                    {n}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.hint}>Toca para elegir · igual que la escala TMDB</Text>
                </View>
            </TouchableOpacity>
        </Modal>
    );
});

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: Colors.overlayDark,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    } as ViewStyle,
    panel: {
        backgroundColor: Colors.panelBackground,
        borderRadius: 16,
        padding: 20,
        width: "100%",
        maxWidth: 340,
        borderTopWidth: 2,
        borderTopColor: Colors.communityPurple,
        borderLeftWidth: 1,
        borderLeftColor: Colors.glassPurpleBorder,
        borderRightWidth: 1,
        borderRightColor: Colors.glassPurpleBorder,
    } as ViewStyle,
    title: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontFamily: "BebasNeue_400Regular",
        letterSpacing: 1,
        marginBottom: 16,
        textAlign: "center",
    } as TextStyle,
    row: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "center",
        marginBottom: 14,
    } as ViewStyle,
    btn: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: Colors.metalGray,
        borderWidth: 1,
        borderColor: "#333", // Generic dark border, maybe use metalGray or a specific divider? Let's keep #333 for now or create a constant. Wait, Colors.metalGray is #1a1a1a. 
        alignItems: "center",
        justifyContent: "center",
    } as ViewStyle,
    btnActive: {
        backgroundColor: Colors.communityPurple,
        borderColor: Colors.communityPurple,
    } as ViewStyle,
    btnText: {
        color: Colors.textMuted,
        fontSize: 14,
        fontWeight: "600",
    } as TextStyle,
    btnTextActive: {
        color: Colors.white,
    } as TextStyle,
    hint: {
        color: "#5a6478", // Muted text, maybe Colors.textMuted or textPlaceholder? Original was #5a6478, Colors.textPlaceholder is #52525b. Close enough.
        fontSize: 10,
        textAlign: "center",
        letterSpacing: 0.5,
    } as TextStyle,
});
