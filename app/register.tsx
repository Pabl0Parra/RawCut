import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerSchema, RegisterInput } from "../src/schemas/auth";
import { useAuthStore } from "../src/stores/authStore";
import { AuthLayout } from "../src/components/AuthLayout";
import { AuthFormField } from "../src/components/AuthFormField";

export default function RegisterScreen() {
    const { t } = useTranslation();
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

    const onSubmit = useCallback(
        async (data: RegisterInput): Promise<void> => {
            Keyboard.dismiss();
            clearError();

            try {
                await signUp(data.email, data.password, data.username);



            } catch (err) {
                console.error("[RegisterScreen] Sign up failed:", err);
            }
        },
        [signUp, clearError],
    );

    return (
        <AuthLayout
            title={t("auth.registerTitle")}
            subtitle={t("auth.registerSubtitle")}
            error={error}
            isLoading={isLoading}
            onSubmit={handleSubmit(onSubmit)}
            submitButtonText={t("auth.registerButton")}
            linkText={t("auth.alreadyAccount")}
            linkLabel={t("common.signIn")}
            linkHref="/login"
            showLogo={false}
        >
            <AuthFormField
                control={control}
                name="username"
                label={t("auth.username")}
                placeholder={t("auth.usernamePlaceholder")}
                error={errors.username?.message}
                maxLength={20}
            />

            <AuthFormField
                control={control}
                name="email"
                label={t("auth.email")}
                placeholder={t("auth.emailPlaceholder")}
                error={errors.email?.message}
                keyboardType="email-address"
            />

            <AuthFormField
                control={control}
                name="password"
                label={t("auth.password")}
                placeholder={t("auth.passwordMin")}
                error={errors.password?.message}
                secureTextEntry
            />

            <AuthFormField
                control={control}
                name="confirmPassword"
                label={t("auth.confirmPassword")}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                error={errors.confirmPassword?.message}
                secureTextEntry
            />
        </AuthLayout>
    );
}