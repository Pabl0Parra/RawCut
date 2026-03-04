import { z } from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .min(3, "auth.validation.usernameMin")
        .max(20, "auth.validation.usernameMax")
        .regex(
            /^\w+$/,
            "auth.validation.usernameRegex"
        ),
    email: z.string().email("auth.validation.emailInvalid"),
    password: z.string().min(8, "auth.validation.passwordMin"),
    confirmPassword: z.string().min(8, "auth.validation.confirmPasswordRequired"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "auth.validation.passwordsMatch",
    path: ["confirmPassword"],
});

export const loginSchema = z.object({
    identifier: z
        .string()
        .min(1, "auth.validation.identifierRequired"),
    password: z.string().min(1, "auth.validation.passwordRequired"),
});

export const commentSchema = z.object({
    text: z
        .string()
        .min(1, "auth.validation.commentRequired")
        .max(500, "auth.validation.commentMax"),
});

export const recommendationSchema = z.object({
    message: z
        .string()
        .max(200, "auth.validation.recommendationMax")
        .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type RecommendationInput = z.infer<typeof recommendationSchema>;
