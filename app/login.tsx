import { useCallback } from "react";
import { Keyboard } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, LoginInput } from "../src/schemas/auth";
import { useAuthStore } from "../src/stores/authStore";
import { AuthLayout } from "../src/components/AuthLayout";
import { AuthFormField } from "../src/components/AuthFormField";

export default function LoginScreen() {
    const { signIn, isLoading, error, clearError } = useAuthStore();

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

    const onSubmit = useCallback(
        async (data: LoginInput): Promise<void> => {
            Keyboard.dismiss();
            clearError();

            try {
                await signIn(data.identifier, data.password);
                // Navigation is handled by _layout.tsx's auth routing effect
                // when the user state changes in the store. Do NOT call
                // router.replace() here — it would race with the layout.
            } catch (err) {
                // signIn should handle its own error state internally,
                // but we catch here to prevent unhandled promise rejections
                // from react-hook-form's handleSubmit.
                console.error("[LoginScreen] Sign in failed:", err);
            }
        },
        [signIn, clearError],
    );

    return (
        <AuthLayout
            title="Iniciar Sesión"
            subtitle="Tu guía de cine y series"
            error={error}
            isLoading={isLoading}
            onSubmit={handleSubmit(onSubmit)}
            submitButtonText="Iniciar Sesión"
            linkText="¿No tienes cuenta?"
            linkLabel="Regístrate"
            linkHref="/register"
            showLogo
        >
            <AuthFormField
                control={control}
                name="identifier"
                label="Email o Usuario"
                placeholder="tu@email.com o usuario"
                error={errors.identifier?.message}
                keyboardType="email-address"
            />

            <AuthFormField
                control={control}
                name="password"
                label="Contraseña"
                placeholder="••••••••"
                error={errors.password?.message}
                secureTextEntry
            />
        </AuthLayout>
    );
}