import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { readAsStringAsync } from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";

/** Supabase storage bucket name for avatars */
const AVATAR_BUCKET = "avatars";

/** Maximum file size in bytes (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Allowed image MIME types */
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** Image picker source options */
export type ImageSource = "camera" | "gallery";

/** Upload state interface */
interface UploadState {
    isUploading: boolean;
    uploadProgress: number;
    error: string | null;
}

/** Return type for the useAvatarUpload hook */
interface UseAvatarUploadReturn extends UploadState {
    pickAndUploadAvatar: (
        userId: string,
        source: ImageSource
    ) => Promise<string | null>;
    deleteAvatar: (userId: string, currentAvatarUrl: string | null) => Promise<boolean>;
    clearError: () => void;
}

/**
 * Extracts file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    };
    return mimeToExt[mimeType] ?? "jpg";
}

/**
 * Generates a unique file path for avatar storage
 */
function generateAvatarPath(userId: string, extension: string): string {
    const timestamp = Date.now();
    return `${userId}/${timestamp}.${extension}`;
}

/**
 * Validates the selected image
 */
function validateImage(
    asset: ImagePicker.ImagePickerAsset
): { valid: true } | { valid: false; error: string } {
    // Check file size if available
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: "La imagen es demasiado grande. Máximo 5MB.",
        };
    }

    // Check MIME type if available
    if (asset.mimeType && !ALLOWED_MIME_TYPES.includes(asset.mimeType as AllowedMimeType)) {
        return {
            valid: false,
            error: "Formato no soportado. Usa JPG, PNG o WebP.",
        };
    }

    return { valid: true };
}

/**
 * Custom hook for handling avatar upload functionality
 * Provides image picking from camera/gallery and Supabase storage integration
 */
export function useAvatarUpload(): UseAvatarUploadReturn {
    const [state, setState] = useState<UploadState>({
        isUploading: false,
        uploadProgress: 0,
        error: null,
    });

    const clearError = useCallback(() => {
        setState((prev) => ({ ...prev, error: null }));
    }, []);

    /**
     * Requests camera or media library permissions
     */
    const requestPermission = useCallback(
        async (source: ImageSource): Promise<boolean> => {
            if (source === "camera") {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== "granted") {
                    setState((prev) => ({
                        ...prev,
                        error: "Se necesita permiso para acceder a la cámara.",
                    }));
                    return false;
                }
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== "granted") {
                    setState((prev) => ({
                        ...prev,
                        error: "Se necesita permiso para acceder a la galería.",
                    }));
                    return false;
                }
            }
            return true;
        },
        []
    );

    /**
     * Launches image picker and uploads selected image to Supabase
     * Returns the public URL of the uploaded avatar or null on failure
     */
    const pickAndUploadAvatar = useCallback(
        async (userId: string, source: ImageSource): Promise<string | null> => {
            setState({ isUploading: false, uploadProgress: 0, error: null });

            // Request permissions
            const hasPermission = await requestPermission(source);
            if (!hasPermission) return null;

            try {
                // Launch picker
                const pickerOptions: ImagePicker.ImagePickerOptions = {
                    mediaTypes: "images",
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.8,
                };

                const result =
                    source === "camera"
                        ? await ImagePicker.launchCameraAsync(pickerOptions)
                        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

                if (result.canceled || !result.assets?.[0]) {
                    return null;
                }

                const asset = result.assets[0];

                // Validate image
                const validation = validateImage(asset);
                if (!validation.valid) {
                    setState((prev) => ({ ...prev, error: validation.error }));
                    return null;
                }

                setState((prev) => ({ ...prev, isUploading: true, uploadProgress: 0.1 }));

                // Read file as base64
                const base64 = await readAsStringAsync(asset.uri, {
                    encoding: "base64",
                });

                setState((prev) => ({ ...prev, uploadProgress: 0.3 }));

                // Prepare upload
                const mimeType = asset.mimeType ?? "image/jpeg";
                const extension = getExtensionFromMimeType(mimeType);
                const filePath = generateAvatarPath(userId, extension);

                setState((prev) => ({ ...prev, uploadProgress: 0.5 }));

                // Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from(AVATAR_BUCKET)
                    .upload(filePath, decode(base64), {
                        contentType: mimeType,
                        upsert: true,
                    });

                if (uploadError) {
                    console.error("Upload error:", uploadError);
                    setState({
                        isUploading: false,
                        uploadProgress: 0,
                        error: "Error al subir la imagen. Intenta de nuevo.",
                    });
                    return null;
                }

                setState((prev) => ({ ...prev, uploadProgress: 0.8 }));

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from(AVATAR_BUCKET)
                    .getPublicUrl(filePath);

                const publicUrl = urlData?.publicUrl;
                // Verify auth state before update
                const { data, error: authError } = await supabase.auth.getUser();
                const currentUser = data?.user;

                if (currentUser?.id !== userId) {
                    console.error("Auth mismatch: Cannot update profile for different user");
                    // We proceed anyway to see what DB says, but this is a red flag
                }

                // Update profile with new avatar URL
                const { data: updatedRows, error: updateError } = await supabase
                    .from("profiles")
                    .update({ avatar_url: publicUrl })
                    .eq("user_id", userId)
                    .select();

                if (updateError) {
                    console.error("Profile update error:", updateError);
                    setState({
                        isUploading: false,
                        uploadProgress: 0,
                        error: "Error al actualizar el perfil.",
                    });
                    return null;
                }

                const rowCount = updatedRows?.length ?? 0;

                if (rowCount === 0) {
                    console.error("WARNING: Profile update affected 0 rows. Possible RLS issue or user_id mismatch.");
                    setState({
                        isUploading: false,
                        uploadProgress: 0,
                        error: "No se pudo actualizar el perfil (0 cambios).",
                    });
                    return null;
                }

                // Success - update local state using the known publicUrl
                // (No need to redeclare updateData)

                // Update local profile state immediately
                const currentProfile = useAuthStore.getState().profile;
                if (currentProfile) {
                    useAuthStore.getState().setProfile({
                        ...currentProfile,
                        avatar_url: publicUrl
                    });
                }

                setState({ isUploading: false, uploadProgress: 1, error: null });
                return publicUrl;
            } catch (error) {
                console.error("Avatar upload error:", error);
                setState({
                    isUploading: false,
                    uploadProgress: 0,
                    error: "Error inesperado. Intenta de nuevo.",
                });
                return null;
            }
        },
        [requestPermission]
    );

    /**
     * Deletes the current avatar from storage and updates profile
     */
    const deleteAvatar = useCallback(
        async (userId: string, currentAvatarUrl: string | null): Promise<boolean> => {
            if (!currentAvatarUrl) return true;

            setState((prev) => ({ ...prev, isUploading: true, error: null }));

            try {
                // Extract file path from URL
                const urlParts = currentAvatarUrl.split(`${AVATAR_BUCKET}/`);
                if (urlParts.length > 1) {
                    const filePath = urlParts[1];
                    await supabase.storage.from(AVATAR_BUCKET).remove([filePath]);
                }

                // Update profile to remove avatar URL
                const { error: updateError } = await supabase
                    .from("profiles")
                    .update({ avatar_url: null })
                    .eq("user_id", userId);

                if (updateError) {
                    setState({
                        isUploading: false,
                        uploadProgress: 0,
                        error: "Error al eliminar el avatar.",
                    });
                    return false;
                }

                // Update local profile state immediately after deletion
                const currentProfile = useAuthStore.getState().profile;
                if (currentProfile) {
                    useAuthStore.getState().setProfile({
                        ...currentProfile,
                        avatar_url: null
                    });
                }

                setState({ isUploading: false, uploadProgress: 0, error: null });
                return true;
            } catch (error) {
                console.error("Delete avatar error:", error);
                setState({
                    isUploading: false,
                    uploadProgress: 0,
                    error: "Error al eliminar el avatar.",
                });
                return false;
            }
        },
        []
    );

    return {
        ...state,
        pickAndUploadAvatar,
        deleteAvatar,
        clearError,
    };
}

export default useAvatarUpload;