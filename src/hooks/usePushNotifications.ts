import { useState } from 'react';

/**
 * Dummy hook to maintain compatibility after removing expo-notifications and expo-device 
 * for Expo Go compatibility.
 */
export function usePushNotifications() {
    const [expoPushToken] = useState<string | null>(null);
    const [notification] = useState<any | null>(null);

    return {
        expoPushToken,
        notification,
    };
}
