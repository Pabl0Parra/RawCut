import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "../src/schemas/auth";
import { useAuthStore } from "../src/stores/authStore";
import { Colors } from "../src/constants/Colors";

export default function RegisterScreen() {
    const { signUp, isLoading, error, clearError } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: RegisterInput) => {
        clearError();
        const success = await signUp(data.email, data.password, data.username);
        if (success) {
            router.replace("/(tabs)");
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.contentContainer}>
                        {/* Logo/Title */}
                        <View style={styles.logoContainer}>
                            <Text
                                style={[styles.logoText, { fontFamily: "BebasNeue_400Regular" }]}
                            >
                                RawCut
                            </Text>
                            <Text style={styles.logoSubtitle}>
                                Crea tu cuenta
                            </Text>
                        </View>

                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Username Field */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Nombre de Usuario
                            </Text>
                            <Controller
                                control={control}
                                name="username"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="usuario_123"
                                        placeholderTextColor="#71717a"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        maxLength={20}
                                    />
                                )}
                            />
                            {errors.username && (
                                <Text style={styles.fieldError}>
                                    {errors.username.message}
                                </Text>
                            )}
                        </View>

                        {/* Email Field */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Email
                            </Text>
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="tu@email.com"
                                        placeholderTextColor="#71717a"
                                        value={value}
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        autoCorrect={false}
                                    />
                                )}
                            />
                            {errors.email && (
                                <Text style={styles.fieldError}>
                                    {errors.email.message}
                                </Text>
                            )}
                        </View>

                        {/* Password Field */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Contraseña
                            </Text>
                            <View style={styles.passwordContainer}>
                                <Controller
                                    control={control}
                                    name="password"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            style={[styles.input, styles.passwordInput]}
                                            placeholder="Mínimo 8 caracteres"
                                            placeholderTextColor="#71717a"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            secureTextEntry={!showPassword}
                                            autoCapitalize="none"
                                        />
                                    )}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Text style={styles.eyeIconText}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
                                </TouchableOpacity>
                            </View>
                            {errors.password && (
                                <Text style={styles.fieldError}>
                                    {errors.password.message}
                                </Text>
                            )}
                        </View>

                        {/* Confirm Password Field */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Confirmar Contraseña
                            </Text>
                            <View style={styles.passwordContainer}>
                                <Controller
                                    control={control}
                                    name="confirmPassword"
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <TextInput
                                            style={[styles.input, styles.passwordInput]}
                                            placeholder="Repite tu contraseña"
                                            placeholderTextColor="#71717a"
                                            value={value}
                                            onChangeText={onChange}
                                            onBlur={onBlur}
                                            secureTextEntry={!showConfirmPassword}
                                            autoCapitalize="none"
                                        />
                                    )}
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Text style={styles.eyeIconText}>
                                        {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {errors.confirmPassword && (
                                <Text style={styles.fieldError}>
                                    {errors.confirmPassword.message}
                                </Text>
                            )}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                isLoading && styles.buttonDisabled,
                            ]}
                            onPress={handleSubmit(onSubmit)}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#0a0a0a" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    Crear Cuenta
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                            <Link href="/login" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.loginLink}>Inicia Sesión</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.metalBlack,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: "center",
        paddingVertical: 32,
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 32,
    },
    logoText: {
        color: Colors.bloodRed,
        fontSize: 48,
        lineHeight: 52,
    },
    logoSubtitle: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginTop: 8,
    },
    errorContainer: {
        backgroundColor: "rgba(220, 38, 38, 0.2)",
        borderColor: Colors.bloodRed,
        borderWidth: 1,
        borderRadius: 4,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: Colors.bloodRed,
        textAlign: "center",
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: Colors.metalBlack,
        borderColor: Colors.metalSilver,
        borderWidth: 1,
        color: "#f4f4f5",
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 4,
    },
    passwordContainer: {
        position: "relative",
    },
    passwordInput: {
        paddingRight: 48,
    },
    eyeIcon: {
        position: "absolute",
        right: 16,
        top: 16,
    },
    eyeIconText: {
        fontSize: 20,
    },
    fieldError: {
        color: Colors.bloodRed,
        fontSize: 14,
        marginTop: 4,
    },
    button: {
        backgroundColor: Colors.bloodRed,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 4,
        marginTop: 24,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: Colors.metalBlack,
        fontWeight: "bold",
        textAlign: "center",
        textTransform: "uppercase",
        fontSize: 18,
    },
    loginContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 24,
    },
    loginText: {
        color: Colors.metalSilver,
    },
    loginLink: {
        color: Colors.bloodRed,
        fontWeight: "bold",
    },
});
