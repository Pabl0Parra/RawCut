module.exports = {
    preset: "jest-expo",
    testEnvironment: "node",
    setupFilesAfterEnv: [
        "@testing-library/jest-native/extend-expect",
        "./jest.setup.ts"
    ],
    transformIgnorePatterns: [
        "node_modules/(?!(" +
        "react-native|" +
        "@react-native(-community)?/.*|" +
        "expo/.*|" +
        "expo-.*|" +
        "@expo/.*|" +
        "@expo-google-fonts/.*|" +
        "react-navigation|" +
        "@react-navigation/.*|" +
        "@unimodules/.*|" +
        "unimodules|" +
        "sentry-expo|" +
        "native-base|" +
        "react-native-svg|" +
        "react-native-reanimated|" +
        "react-native-gesture-handler|" +
        "zustand" +
        "))"
    ],
    moduleNameMapper: {
        "^expo/src/winter/(.*)$": "<rootDir>/__mocks__/expo-winter.js",
        "^expo/src/(.*)$": "<rootDir>/__mocks__/expo-winter.js",
        "^.*src/components/AuthLayout$": "<rootDir>/__mocks__/AuthLayout.tsx",
    },
    collectCoverage: true,
    collectCoverageFrom: [
        "src/**/*.{js,jsx,ts,tsx}",
        "app/**/*.{js,jsx,ts,tsx}",
        "!**/coverage/**",
        "!**/node_modules/**",
        "!**/babel.config.js",
        "!**/jest.setup.js"
    ],
};