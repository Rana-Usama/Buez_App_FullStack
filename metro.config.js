// Learn more: https://docs.expo.dev/guides/customizing-metro
//
// getSentryExpoConfig extends Expo's default Metro config (the one this project
// previously used implicitly) and adds Sentry's debug IDs to bundles and
// source maps, so stack traces resolve to the original TypeScript.
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

module.exports = config;
