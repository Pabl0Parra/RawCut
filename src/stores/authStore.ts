import { create } from "zustand";
import { supabase, Profile } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    signIn: (identifier: string, password: string) => Promise<boolean>;
    signUp: (email: string, password: string, username: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    setSession: (session: Session | null) => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    profile: null,
    isLoading: false,
    error: null,

    signIn: async (identifier: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            // Check if identifier is email or username
            const isEmail = identifier.includes("@");
            let email = identifier;

            if (!isEmail) {
                // Look up email by username
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("user_id")
                    .eq("username", identifier)
                    .single();

                if (profileError || !profileData) {
                    set({ isLoading: false, error: "Usuario no encontrado" });
                    return false;
                }

                // Get user email from auth.users (we need to get it from the profile or sign in differently)
                // For now, we'll require the email to contain @
                // In production, you'd use a Supabase function or different approach
                const { data: userData } = await supabase.auth.admin.getUserById(profileData.user_id);
                if (userData?.user?.email) {
                    email = userData.user.email;
                } else {
                    set({ isLoading: false, error: "Error al buscar el usuario" });
                    return false;
                }
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                set({ isLoading: false, error: "Credenciales inválidas" });
                return false;
            }

            set({
                user: data.user,
                session: data.session,
                isLoading: false,
                error: null,
            });

            // Fetch profile
            await get().fetchProfile();
            return true;
        } catch (err) {
            set({ isLoading: false, error: "Error de conexión" });
            return false;
        }
    },

    signUp: async (email: string, password: string, username: string) => {
        set({ isLoading: true, error: null });

        try {
            // Check if username is available
            const { data: existingUser, error: checkError } = await supabase
                .from("profiles")
                .select("username")
                .eq("username", username)
                .single();

            if (existingUser) {
                set({ isLoading: false, error: "Usuario ya existe" });
                return false;
            }

            // Sign up
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                    },
                },
            });

            if (error) {
                if (error.message.includes("already registered")) {
                    set({ isLoading: false, error: "Este email ya está registrado" });
                } else {
                    set({ isLoading: false, error: "Error al registrar usuario" });
                }
                return false;
            }

            // Create profile
            if (data.user) {
                const { error: profileError } = await supabase.from("profiles").insert({
                    user_id: data.user.id,
                    username,
                    points: 0,
                });

                if (profileError) {
                    console.error("Error creating profile:", profileError);
                }
            }

            set({
                user: data.user,
                session: data.session,
                isLoading: false,
                error: null,
            });

            await get().fetchProfile();
            return true;
        } catch (err) {
            set({ isLoading: false, error: "Error de conexión" });
            return false;
        }
    },

    signOut: async () => {
        set({ isLoading: true });
        await supabase.auth.signOut();
        set({
            user: null,
            session: null,
            profile: null,
            isLoading: false,
            error: null,
        });
    },

    fetchProfile: async () => {
        const { user } = get();
        if (!user) return;

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (data) {
            set({ profile: data });
        }
    },

    setSession: (session: Session | null) => {
        set({
            session,
            user: session?.user || null,
        });
    },

    clearError: () => set({ error: null }),
}));
