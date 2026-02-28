import { create } from "zustand";
import { supabase, Profile } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    error: string | null;

    
    signIn: (identifier: string, password: string) => Promise<boolean>;
    signUp: (email: string, password: string, username: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    updateUsername: (newUsername: string) => Promise<boolean>;
    deleteAccount: () => Promise<boolean>;
    setSession: (session: Session | null) => void;
    setProfile: (profile: Profile | null) => void;
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
            
            const isEmail = identifier.includes("@");
            let email = identifier;

            if (!isEmail) {
                
                const { data: rpcData, error: rpcError } = await supabase.rpc(
                    "get_email_by_username",
                    { p_username: identifier }
                );

                if (rpcError || !rpcData || rpcData.length === 0) {
                    set({ isLoading: false, error: "Usuario no encontrado" });
                    return false;
                }

                email = rpcData[0].email;
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

            
            await get().fetchProfile();
            return true;
        } catch (err) {
            console.error("Error al iniciar sesión:", err);
            set({ isLoading: false, error: "Error de conexión" });
            return false;
        }
    },

    signUp: async (email: string, password: string, username: string) => {
        set({ isLoading: true, error: null });

        try {
            
            const { data: existingUser } = await supabase
                .from("profiles")
                .select("username")
                .eq("username", username)
                .maybeSingle();

            if (existingUser) {
                set({ isLoading: false, error: "Usuario ya existe" });
                return false;
            }

            
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        display_name: username,
                        full_name: username,
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

            
            

            set({
                user: data.user,
                session: data.session,
                isLoading: false,
                error: null,
            });

            await get().fetchProfile();
            return true;
        } catch (err) {
            console.error("Error al registrar usuario:", err);
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
        
        
        
        const { useContentStore } = require("./contentStore");
        
        const { useRecommendationStore } = require("./recommendationStore");
        useContentStore.getState().clearContent();
        useRecommendationStore.getState().clearRecommendations();
        const { useSocialStore } = require('./socialStore');
        useSocialStore.getState().clearSocial();
    },

    fetchProfile: async () => {
        const { user } = get();
        if (!user) return;

        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) {
            console.error("Store: Error fetching profile:", error);
        }

        if (data) {
            set({ profile: data });
        } else {
            
            
            const metadata = user.user_metadata || {};

            const fallbackUsername = metadata.username ||
                (metadata.full_name || metadata.display_name)?.slice(0, 20) ||
                `user_${user.id.substring(0, 8)}`;

            const fallbackDisplayName = metadata.full_name ||
                metadata.display_name ||
                metadata.username ||
                null;

            const { data: rpcData, error: recoveryError } = await supabase.rpc(
                "recover_user_profile",
                {
                    p_user_id: user.id,
                    p_username: fallbackUsername,
                    p_display_name: fallbackDisplayName,
                }
            );

            if (recoveryError) {
                console.error("[authStore] Failed to recover profile via RPC:", recoveryError.message);
                return;
            }

            
            const recoveredProfile = Array.isArray(rpcData) ? rpcData[0] : rpcData;

            if (recoveredProfile) {
                set({ profile: recoveredProfile });
            } else {
                console.error("[authStore] Profile recovery RPC returned no data.");
            }
        }
    },

    setSession: (session: Session | null) => {
        set({
            session,
            user: session?.user || null,
        });
    },
    setProfile: (profile: Profile | null) => {
        set({ profile });
    },

    updateUsername: async (newUsername: string) => {
        set({ isLoading: true, error: null });
        const { user, profile } = get();

        if (!user || !profile) {
            set({ isLoading: false, error: "No hay sesión activa" });
            return false;
        }

        try {
            
            const { data: existingUser } = await supabase
                .from("profiles")
                .select("username")
                .eq("username", newUsername)
                .neq("user_id", user.id)
                .maybeSingle();

            if (existingUser) {
                set({ isLoading: false, error: "Este nombre de usuario ya está en uso" });
                return false;
            }

            
            const { data: updatedRows, error } = await supabase
                .from("profiles")
                .update({ username: newUsername })
                .eq("user_id", user.id)
                .select();

            if (error) {
                set({ isLoading: false, error: "Error al actualizar nombre de usuario" });
                return false;
            }

            if (!updatedRows || updatedRows.length === 0) {
                console.error("Store: Username update affected 0 rows. Possible RLS issue.");
                set({ isLoading: false, error: "No se pudo actualizar. Permiso denegado." });
                return false;
            }

            
            set({
                profile: { ...profile, username: newUsername },
                isLoading: false,
                error: null,
            });

            return true;
        } catch (err) {
            console.error("Error al actualizar nombre de usuario:", err);
            set({ isLoading: false, error: "Error de conexión" });
            return false;
        }
    },

    deleteAccount: async () => {
        set({ isLoading: true, error: null });
        const { user } = get();

        if (!user) {
            set({ isLoading: false, error: "No hay sesión activa" });
            return false;
        }

        try {
            
            const { error: rpcError } = await supabase.rpc('delete_user_account');

            if (rpcError) {
                console.error("Store: Error calling delete_user_account RPC:", rpcError);
                set({ isLoading: false, error: "Error al eliminar la cuenta en el servidor" });
                return false;
            }

            
            set({
                user: null,
                session: null,
                profile: null,
                isLoading: false,
                error: null,
            });

            return true;
        } catch (err) {
            console.error("Error al eliminar cuenta:", err);
            set({ isLoading: false, error: "Error de conexión" });
            return false;
        }
    },

    clearError: () => set({ error: null }),
}));
