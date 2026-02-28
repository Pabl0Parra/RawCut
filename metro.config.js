// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
    /[^/\\]+\.test\.[jt]sx?$/,
    /[^/\\]+\.spec\.[jt]sx?$/,
];

module.exports = config;