import { z } from "zod";

// Registration schema
export const registerSchema = z.object({
    username: z
        .string()
        .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
        .max(20, "El nombre de usuario no puede tener más de 20 caracteres")
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "El nombre de usuario solo puede contener letras, números y guiones bajos"
        ),
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

// Login schema
export const loginSchema = z.object({
    identifier: z
        .string()
        .min(1, "Ingresa tu email o nombre de usuario"),
    password: z.string().min(1, "Ingresa tu contraseña"),
});

// Comment schema
export const commentSchema = z.object({
    text: z
        .string()
        .min(1, "El comentario no puede estar vacío")
        .max(500, "Máximo 500 caracteres"),
});

// Recommendation message schema
export const recommendationSchema = z.object({
    message: z
        .string()
        .max(200, "Máximo 200 caracteres")
        .optional(),
});

// Types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type RecommendationInput = z.infer<typeof recommendationSchema>;
