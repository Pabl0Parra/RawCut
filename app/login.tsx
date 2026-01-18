import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";

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

    const onSubmit = async (data: LoginInput) => {
        clearError();
        const success = await signIn(data.identifier, data.password);
        if (success) {
            router.replace("/(tabs)");
        }
    };

    return (
        <AuthLayout
            title="CortoCrudo"
            subtitle="Tu guía de cine y series"
            error={error}
            isLoading={isLoading}
            onSubmit={handleSubmit(onSubmit)}
            submitButtonText="Iniciar Sesión"
            linkText="¿No tienes cuenta?"
            linkLabel="Regístrate"
            linkHref="/register"
            showLogo={true}
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
