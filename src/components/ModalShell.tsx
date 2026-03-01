import React from "react";
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";

interface ModalShellProps {
    readonly visible: boolean;
    readonly onClose: () => void;
    readonly title: string;
    readonly titleNumberOfLines?: number;
    readonly children: React.ReactNode;
}

export function ModalShell({
    visible,
    onClose,
    title,
    titleNumberOfLines = 1,
    children,
}: ModalShellProps): React.JSX.Element {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.modalHandleContainer}>
                    <View style={styles.modalHandle} />
                </View>
                <View style={styles.header}>
                    <Text style={styles.title} numberOfLines={titleNumberOfLines}>
                        {title}
                    </Text>
                    <TouchableOpacity
                        onPress={onClose}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                        <Ionicons name="close" size={24} color={Colors.vibrantRed} />
                    </TouchableOpacity>
                </View>
                {children}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.panelBackground,
        padding: 16,
        paddingTop: 8,
    } as ViewStyle,
    modalHandleContainer: {
        width: "100%",
        height: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    } as ViewStyle,
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: "#ffffff22",
        borderRadius: 2,
    } as ViewStyle,
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 24,
        marginHorizontal: 16,
        gap: 16,
    } as ViewStyle,
    title: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: 24,
        fontFamily: "BebasNeue_400Regular",
    } as TextStyle,
});

export default ModalShell;