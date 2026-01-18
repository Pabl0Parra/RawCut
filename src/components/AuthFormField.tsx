import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
} from "react-native";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";

/**
 * Props for AuthFormField component
 */
export interface AuthFormFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    label: string;
    placeholder: string;
    error?: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "number-pad";
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    autoCorrect?: boolean;
    maxLength?: number;
}

/**
 * Reusable form field component for authentication screens
 * Integrates with react-hook-form and supports password visibility toggle
 */
export function AuthFormField<T extends FieldValues>({
    control,
    name,
    label,
    placeholder,
    error,
    secureTextEntry = false,
    keyboardType = "default",
    autoCapitalize = "none",
    autoCorrect = false,
    maxLength,
}: AuthFormFieldProps<T>): React.JSX.Element {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={secureTextEntry ? styles.passwordContainer : undefined}>
                <Controller
                    control={control}
                    name={name}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            style={[
                                styles.input,
                                secureTextEntry && styles.passwordInput,
                            ]}
                            placeholder={placeholder}
                            placeholderTextColor="#71717a"
                            value={value}
                            onChangeText={onChange}
                            onBlur={onBlur}
                            secureTextEntry={secureTextEntry && !showPassword}
                            autoCapitalize={autoCapitalize}
                            keyboardType={keyboardType}
                            autoCorrect={autoCorrect}
                            maxLength={maxLength}
                        />
                    )}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                    >
                        <Ionicons
                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                            size={24}
                            color={Colors.metalSilver}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {!!error && <Text style={styles.fieldError}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    inputGroup: {
        marginBottom: 16,
    } as ViewStyle,
    label: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    } as TextStyle,
    input: {
        backgroundColor: Colors.metalBlack,
        borderColor: Colors.metalSilver,
        borderWidth: 1,
        color: "#f4f4f5",
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 4,
    } as TextStyle,
    passwordContainer: {
        position: "relative",
    } as ViewStyle,
    passwordInput: {
        paddingRight: 48,
    } as TextStyle,
    eyeIcon: {
        position: "absolute",
        right: 16,
        top: 16,
    } as ViewStyle,
    fieldError: {
        color: Colors.bloodRed,
        fontSize: 14,
        marginTop: 4,
    } as TextStyle,
});

export default AuthFormField;
