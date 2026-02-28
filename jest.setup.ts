import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Expo's import.meta registry to prevent winter runtime crash
jest.mock('expo/src/winter/installGlobal', () => ({
    installGlobal: jest.fn(),
}), { virtual: true });

jest.mock('expo-router', () => {
    const React = require('react');
    return {
        useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
        useLocalSearchParams: () => ({}),
        useGlobalSearchParams: () => ({}),
        Link: ({ children, ...props }: any) => React.createElement('TouchableOpacity', props, children),
        Tabs: ({ children }: any) => children,
        Stack: ({ children }: any) => children,
        router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
        useFocusEffect: (cb: any) => cb(),
    };
});

jest.mock('react-native-reanimated', () => {
    const Reanimated = require('react-native-reanimated/mock');
    Reanimated.default.call = () => {};
    return Reanimated;
});

jest.mock('expo-font', () => ({
    useFonts: () => [true, null],
    loadAsync: jest.fn(),
    isLoaded: jest.fn(() => true),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (str: string) => str,
        i18n: {
            changeLanguage: () => new Promise(() => {}),
        },
    }),
    Trans: ({ children }: any) => children,
}));

if (typeof window !== 'object') {
    (global as any).window = global;
    (global as any).window.navigator = {};
}

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        auth: {
            signIn: jest.fn(),
            signInWithPassword: jest.fn(),
            signUp: jest.fn(),
            signOut: jest.fn(),
            onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
            getSession: jest.fn(() => ({ data: { session: null } })),
            getUser: jest.fn(() => ({ data: { user: null } })),
        },
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            neq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockReturnThis(),
        })),
        rpc: jest.fn(),
    })),
}));

jest.mock('expo-image', () => {
    const React = require('react');
    return {
        Image: (props: any) => React.createElement('Image', props),
    };
});

jest.mock('expo/src/async-require/messageSocket.native', () => ({}), { virtual: true });

jest.mock('react-native-gesture-handler', () => {
    const React = require('react');
    const View = require('react-native').View;
    return {
        Swipeable: ({ children }: any) => React.createElement(View, null, children),
        DrawerLayout: ({ children }: any) => React.createElement(View, null, children),
        GestureHandlerRootView: ({ children }: any) => React.createElement(View, null, children),
        GestureDetector: ({ children }: any) => React.createElement(View, null, children),
        Gesture: {
            Pan: () => ({
                onUpdate: jest.fn().mockReturnThis(),
                onEnd: jest.fn().mockReturnThis(),
                runOnJS: jest.fn().mockReturnThis(),
                activeOffsetX: jest.fn().mockReturnThis(),
                failOffsetY: jest.fn().mockReturnThis(),
            }),
            Tap: () => ({ onEnd: jest.fn().mockReturnThis() }),
            Simultaneous: jest.fn(),
        },
        State: {},
        PanGestureHandler: ({ children }: any) => React.createElement(View, null, children),
        TapGestureHandler: ({ children }: any) => React.createElement(View, null, children),
        ScrollView: require('react-native').ScrollView,
        FlatList: require('react-native').FlatList,
    };
});

jest.mock('@expo/vector-icons', () => {
    const React = require('react');
    return {
        Ionicons: (props: any) => React.createElement('Text', props, props.name),
        FontAwesome: (props: any) => React.createElement('Text', props, props.name),
        MaterialIcons: (props: any) => React.createElement('Text', props, props.name),
    };
});