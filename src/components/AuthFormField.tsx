import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    type ViewStyle,
    type TextStyle,
    type TextInputProps,
    type NativeSyntheticEvent,
    type TextInputFocusEventData,
} from "react-native";
import {
    Controller,
    type Control,
    type FieldValues,
    type Path,
} from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";

/** Input visual states for styling */
type InputState = "default" | "focused" | "error";

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
    keyboardType?: TextInputProps["keyboardType"];
    autoCapitalize?: TextInputProps["autoCapitalize"];
    autoCorrect?: boolean;
    maxLength?: number;
    returnKeyType?: TextInputProps["returnKeyType"];
    onSubmitEditing?: () => void;
    testID?: string;
}

/**
 * Get border color based on input state
 */
function getBorderColor(state: InputState): string {
    switch (state) {
        case "focused":
            return Colors.bloodRed;
        case "error":
            return Colors.bloodRed;
        default:
            return Colors.metalSilver;
    }
}

/**
 * Reusable form field component for authentication screens
 * Integrates with react-hook-form and supports password visibility toggle
 *
 * Features:
 * - Password visibility toggle with accessible button
 * - Focus state visual feedback
 * - Error state display
 * - Proper accessibility labels
 * - Return key support for form navigation
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
    returnKeyType = "next",
    onSubmitEditing,
    testID,
}: AuthFormFieldProps<T>): React.JSX.Element {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const togglePasswordVisibility = useCallback(() => {
        setShowPassword((prev) => !prev);
    }, []);

    const handleFocus = useCallback(
        (
            originalOnFocus?: (e: any) => void
        ) => {
            return (e: any) => {
                setIsFocused(true);
                originalOnFocus?.(e);
            };
        },
        []
    );

    const handleBlur = useCallback(
        (originalOnBlur?: () => void) => {
            return () => {
                setIsFocused(false);
                originalOnBlur?.();
            };
        },
        []
    );

    // Determine current input state for styling
    const inputState: InputState = error ? "error" : isFocused ? "focused" : "default";
    const borderColor = getBorderColor(inputState);

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
                                { borderColor },
                            ]}
                            placeholder={placeholder}
                            placeholderTextColor={Colors.placeholderGray}
                            value={value}
                            onChangeText={onChange}
                            onFocus={handleFocus()}
                            onBlur={handleBlur(onBlur)}
                            secureTextEntry={secureTextEntry && !showPassword}
                            autoCapitalize={autoCapitalize}
                            keyboardType={keyboardType}
                            autoCorrect={autoCorrect}
                            maxLength={maxLength}
                            returnKeyType={returnKeyType}
                            onSubmitEditing={onSubmitEditing}
                            blurOnSubmit={!onSubmitEditing}
                            accessibilityLabel={label}
                            accessibilityHint={placeholder}
                            accessibilityState={{
                                disabled: false,
                            }}
                            testID={testID ?? `input-${String(name)}`}
                            autoComplete={
                                secureTextEntry
                                    ? "password"
                                    : keyboardType === "email-address"
                                        ? "email"
                                        : "off"
                            }
                            textContentType={
                                secureTextEntry
                                    ? "password"
                                    : keyboardType === "email-address"
                                        ? "emailAddress"
                                        : "none"
                            }
                        />
                    )}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={togglePasswordVisibility}
                        activeOpacity={0.7}
                        accessibilityLabel={
                            showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                        accessibilityRole="button"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        testID={`toggle-password-${String(name)}`}
                    >
                        <Ionicons
                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                            size={24}
                            color={isFocused ? Colors.bloodRed : Colors.metalSilver}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {!!error && (
                <Text
                    style={styles.fieldError}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                >
                    {error}
                </Text>
            )}
        </View>
    );
}

/** Placeholder gray color - add to Colors if not present */
const PLACEHOLDER_GRAY = "#71717a";

// Extend Colors type safety
const ExtendedColors = {
    ...Colors,
    placeholderGray: PLACEHOLDER_GRAY,
} as const;

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
        fontWeight: "500",
    } as TextStyle,
    input: {
        backgroundColor: Colors.metalBlack,
        borderWidth: 1,
        color: "#f4f4f5",
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 4,
        fontSize: 16,
    } as TextStyle,
    passwordContainer: {
        position: "relative",
    } as ViewStyle,
    passwordInput: {
        paddingRight: 52,
    } as TextStyle,
    eyeIcon: {
        position: "absolute",
        right: 14,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        width: 32,
    } as ViewStyle,
    fieldError: {
        color: Colors.bloodRed,
        fontSize: 13,
        marginTop: 6,
        fontWeight: "400",
    } as TextStyle,
});

export default AuthFormField;