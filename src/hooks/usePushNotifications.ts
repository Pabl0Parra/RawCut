import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    // Check if we are running in Expo Go
    if (Constants.appOwnership === 'expo') {
        console.warn('Push Notifications are not supported in Expo Go (SDK 53+). Please use a Development Build.');
        return null;
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }
        try {
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            if (!projectId) {
                console.log('Project ID not found');
            }
            token = (
                await Notifications.getExpoPushTokenAsync({
                    projectId,
                })
            ).data;
        } catch (e) {
            console.error(e);
            return null;
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const notificationListener = useRef<Notifications.Subscription>(null);
    const responseListener = useRef<Notifications.Subscription>(null);
    const { user, profile } = useAuthStore();

    useEffect(() => {
        registerForPushNotificationsAsync().then((token) => {
            if (token) setExpoPushToken(token);
        });

        notificationListener.current = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
            console.log('User tapped notification', response);
            // Optionally, we could handle routing to the recommendation tab here
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    // Save the token to Supabase whenever it changes or the user logs in
    useEffect(() => {
        if (expoPushToken && user?.id && profile && profile.expo_push_token !== expoPushToken) {
            const saveToken = async () => {
                const { error } = await supabase
                    .from('profiles')
                    .update({ expo_push_token: expoPushToken })
                    .eq('user_id', user.id);

                if (error) {
                    console.error('Error saving push token to Supabase:', error);
                } else {
                    console.log('Successfully saved push token to Supabase profiles.');
                }
            };

            saveToken();
        }
    }, [expoPushToken, user?.id, profile]);

    return {
        expoPushToken,
        notification,
    };
}
