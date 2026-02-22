import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { readAsStringAsync } from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";

const AVATAR_BUCKET = "avatars";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export type ImageSource = "camera" | "gallery";

interface UploadState {
    isUploading: boolean;
    uploadProgress: number;
    error: string | null;
}

interface UseAvatarUploadReturn extends UploadState {
    pickAndUploadAvatar: (
        userId: string,
        source: ImageSource
    ) => Promise<string | null>;
    deleteAvatar: (userId: string, currentAvatarUrl: string | null) => Promise<boolean>;
    clearError: () => void;
}

function getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    };
    return mimeToExt[mimeType] ?? "jpg";
}

function generateAvatarPath(userId: string, extension: string): string {
    const timestamp = Date.now();
    return `${userId}/${timestamp}.${extension}`;
}

function validateImage(
    asset: ImagePicker.ImagePickerAsset
): { valid: true } | { valid: false; error: string } {
    
    if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: "La imagen es demasiado grande. Máximo 5MB.",
        };
    }

    
    if (asset.mimeType && !ALLOWED_MIME_TYPES.includes(asset.mimeType as AllowedMimeType)) {
        return {
            valid: false,
            error: "Formato no soportado. Usa JPG, PNG o WebP.",
        };
    }

    return { valid: true };
}

export function useAvatarUpload(): UseAvatarUploadReturn {
    const [state, setState] = useState<UploadState>({
        isUploading: false,
        uploadProgress: 0,
        error: null,
    });

    const clearError = useCallback(() => {
        setState((prev) => ({ ...prev, error: null }));
    }, []);

    
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

    
    const pickAndUploadAvatar = useCallback(
        async (userId: string, source: ImageSource): Promise<string | null> => {
            setState({ isUploading: false, uploadProgress: 0, error: null });

            
            const hasPermission = await requestPermission(source);
            if (!hasPermission) return null;

            try {
                
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

                
                const validation = validateImage(asset);
                if (!validation.valid) {
                    setState((prev) => ({ ...prev, error: validation.error }));
                    return null;
                }

                setState((prev) => ({ ...prev, isUploading: true, uploadProgress: 0.1 }));

                
                const base64 = await readAsStringAsync(asset.uri, {
                    encoding: "base64",
                });

                setState((prev) => ({ ...prev, uploadProgress: 0.3 }));

                
                const mimeType = asset.mimeType ?? "image/jpeg";
                const extension = getExtensionFromMimeType(mimeType);
                const filePath = generateAvatarPath(userId, extension);

                setState((prev) => ({ ...prev, uploadProgress: 0.5 }));

                
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

                
                const { data: urlData } = supabase.storage
                    .from(AVATAR_BUCKET)
                    .getPublicUrl(filePath);

                const publicUrl = urlData?.publicUrl;
                
                const { data } = await supabase.auth.getUser();
                const currentUser = data?.user;

                if (currentUser?.id !== userId) {
                    console.error("Auth mismatch: Cannot update profile for different user");
                    
                }

                
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

    
    const deleteAvatar = useCallback(
        async (userId: string, currentAvatarUrl: string | null): Promise<boolean> => {
            if (!currentAvatarUrl) return true;

            setState((prev) => ({ ...prev, isUploading: true, error: null }));

            try {
                
                const urlParts = currentAvatarUrl.split(`${AVATAR_BUCKET}/`);
                if (urlParts.length > 1) {
                    const filePath = urlParts[1];
                    await supabase.storage.from(AVATAR_BUCKET).remove([filePath]);
                }

                
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