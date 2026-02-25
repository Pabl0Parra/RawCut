import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Keyboard } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, LoginInput } from "../src/schemas/auth";
import { useAuthStore } from "../src/stores/authStore";
import { AuthLayout } from "../src/components/AuthLayout";
import { AuthFormField } from "../src/components/AuthFormField";

export default function LoginScreen() {
    const { t } = useTranslation();
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



            } catch (err) {



                console.error("[LoginScreen] Sign in failed:", err);
            }
        },
        [signIn, clearError],
    );

    return (
        <AuthLayout
            title={t("auth.loginTitle")}
            subtitle={t("auth.loginSubtitle")}
            error={error}
            isLoading={isLoading}
            onSubmit={handleSubmit(onSubmit)}
            submitButtonText={t("auth.loginTitle")}
            linkText={t("auth.noAccount")}
            linkLabel={t("common.signUp")}
            linkHref="/register"
            showLogo
        >
            <AuthFormField
                control={control}
                name="identifier"
                label={t("auth.identifier")}
                placeholder={t("auth.identifierPlaceholder")}
                error={errors.identifier?.message}
                keyboardType="email-address"
            />

            <AuthFormField
                control={control}
                name="password"
                label={t("auth.password")}
                placeholder={t("auth.passwordPlaceholder")}
                error={errors.password?.message}
                secureTextEntry
            />
        </AuthLayout>
    );
}