import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";

import { registerSchema, RegisterInput } from "../src/schemas/auth";
import { useAuthStore } from "../src/stores/authStore";
import { AuthLayout } from "../src/components/AuthLayout";
import { AuthFormField } from "../src/components/AuthFormField";

export default function RegisterScreen() {
    const { signUp, isLoading, error, clearError } = useAuthStore();

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
        <AuthLayout
            title="CortoCrudo"
            subtitle="Crea tu cuenta"
            error={error}
            isLoading={isLoading}
            onSubmit={handleSubmit(onSubmit)}
            submitButtonText="Crear Cuenta"
            linkText="¿Ya tienes cuenta?"
            linkLabel="Inicia Sesión"
            linkHref="/login"
            showLogo={false}
        >
            <AuthFormField
                control={control}
                name="username"
                label="Nombre de Usuario"
                placeholder="usuario_123"
                error={errors.username?.message}
                maxLength={20}
            />

            <AuthFormField
                control={control}
                name="email"
                label="Email"
                placeholder="tu@email.com"
                error={errors.email?.message}
                keyboardType="email-address"
            />

            <AuthFormField
                control={control}
                name="password"
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                error={errors.password?.message}
                secureTextEntry
            />

            <AuthFormField
                control={control}
                name="confirmPassword"
                label="Confirmar Contraseña"
                placeholder="Repite tu contraseña"
                error={errors.confirmPassword?.message}
                secureTextEntry
            />
        </AuthLayout>
    );
}
