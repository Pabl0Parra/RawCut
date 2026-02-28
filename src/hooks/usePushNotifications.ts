import { useState } from 'react';

export function usePushNotifications() {
    const [expoPushToken] = useState<string | null>(null);
    const [notification] = useState<any | null>(null);

    return {
        expoPushToken,
        notification,
    };
}
