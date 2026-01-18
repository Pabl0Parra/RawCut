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
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "../src/schemas/auth";
import { useAuthStore } from "../src/stores/authStore";
import { Colors } from "../src/constants/Colors";

export default function LoginScreen() {
    const { signIn, isLoading, error, clearError } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            identifier: "",
            password: "",
        },
    });

    const onSubmit = async (data: LoginInput) => {
        clearError();
        const success = await signIn(data.identifier, data.password);
        if (success) {
            router.replace("/(tabs)");
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Logo/Title - Static Header */}
            <View style={styles.logoContainer}>
                <Text
                    style={[styles.logoText, { fontFamily: "BebasNeue_400Regular" }]}
                >
                    CortoCrudo
                </Text>
                <Image
                    source={require("../assets/corto-crudo-logo.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
                <Text style={styles.logoSubtitle}>
                    Tu guía de cine y series
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.contentContainer}>
                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Email/Username Field */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Email o Usuario
                            </Text>
                            <Controller
                                control={control}
                                name="identifier"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="tu@email.com o usuario"
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
                            {errors.identifier && (
                                <Text style={styles.fieldError}>
                                    {errors.identifier.message}
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
                                            placeholder="••••••••"
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
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={24}
                                        color={Colors.metalSilver}
                                    />
                                </TouchableOpacity>
                            </View>
                            {errors.password && (
                                <Text style={styles.fieldError}>
                                    {errors.password.message}
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
                                    Iniciar Sesión
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Register Link */}
                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                            <Link href="/register" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.registerLink}>Regístrate</Text>
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
        justifyContent: "center",
    },
    contentContainer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        width: "100%",
    },
    logoContainer: {
        alignItems: "center",
        marginTop: 24,
        marginBottom: 12,
        flexShrink: 0,
        gap: 4,
    },
    logoText: {
        color: Colors.bloodRed,
        fontSize: 48,
        lineHeight: 52,
        marginBottom: 8,
    },
    logoImage: {
        width: 200,
        height: 200,
        marginBottom: 8,
    },
    logoSubtitle: {
        color: Colors.metalSilver,
        fontSize: 14,
        marginTop: 0,
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
        marginBottom: 16, // used for first input
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
        color: "#f4f4f5", // zinc-100 equivalent
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
        marginTop: 24, // simplified margin handling
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
    registerContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 24,
    },
    registerText: {
        color: Colors.metalSilver,
    },
    registerLink: {
        color: Colors.bloodRed,
        fontWeight: "bold",
    },
});
