import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
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
