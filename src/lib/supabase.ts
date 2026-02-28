import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// SecureStore has a 2 048-byte per-key limit.
// This adapter splits large values into ≤1 900-byte chunks so the full
// Supabase session JSON (which can exceed that limit) is stored safely.
const CHUNK_SIZE = 1900;

const LargeSecureStore = {
    async getItem(key: string): Promise<string | null> {
        const countStr = await SecureStore.getItemAsync(`${key}.chunks`);
        if (countStr === null) {
            // Fallback: value may have been written without chunking
            return SecureStore.getItemAsync(key);
        }
        const count = parseInt(countStr, 10);
        const chunks = await Promise.all(
            Array.from({ length: count }, (_, i) =>
                SecureStore.getItemAsync(`${key}.${i}`)
            )
        );
        if (chunks.some((c) => c === null)) return null;
        return chunks.join("");
    },

    async setItem(key: string, value: string): Promise<void> {
        const chunks: string[] = [];
        for (let i = 0; i < value.length; i += CHUNK_SIZE) {
            chunks.push(value.slice(i, i + CHUNK_SIZE));
        }
        await SecureStore.setItemAsync(`${key}.chunks`, String(chunks.length));
        await Promise.all(
            chunks.map((chunk, i) =>
                SecureStore.setItemAsync(`${key}.${i}`, chunk)
            )
        );
    },

    async removeItem(key: string): Promise<void> {
        const countStr = await SecureStore.getItemAsync(`${key}.chunks`);
        if (countStr === null) {
            await SecureStore.deleteItemAsync(key).catch(() => {});
            return;
        }
        const count = parseInt(countStr, 10);
        await Promise.all([
            SecureStore.deleteItemAsync(`${key}.chunks`),
            ...Array.from({ length: count }, (_, i) =>
                SecureStore.deleteItemAsync(`${key}.${i}`)
            ),
        ]);
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: LargeSecureStore,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

export interface Profile {
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    points: number;
    created_at: string;
    expo_push_token?: string | null;
}

export interface UserContent {
    id: string;
    user_id: string;
    tmdb_id: number;
    media_type: "movie" | "tv";
    list_type: "favorite" | "watchlist";
    created_at: string;
}

export interface Recommendation {
    id: string;
    sender_id: string;
    receiver_id: string;
    tmdb_id: number;
    media_type: "movie" | "tv";
    message: string | null;
    is_read: boolean;
    created_at: string;
    sender_deleted: boolean;
    receiver_deleted: boolean;
}

export interface RecommendationComment {
    id: string;
    recommendation_id: string;
    user_id: string;
    text: string;
    is_read: boolean;
    created_at: string;
}

export interface Rating {
    id: string;
    recommendation_id: string;
    rating: number;
    created_at: string;
}

export interface ContentVote {
    id: string;
    user_id: string;
    tmdb_id: number;
    media_type: "movie" | "tv";
    vote: number;
    created_at: string;
}

export interface Follow {
    id: string;
    follower_id: string;
    following_id: string;
    status: "pending" | "accepted";
    created_at: string;
}
