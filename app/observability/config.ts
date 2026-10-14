const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? "";

const sentryEnabledInDev = process.env.EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV === "true";

export type AppEnvironment = "development" | "production";

export const observabilityConfig = {
  environment: (__DEV__ ? "development" : "production") as AppEnvironment,
  sentry: {
    dsn: sentryDsn,
    enabled: sentryDsn.length > 0 && (!__DEV__ || sentryEnabledInDev),
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    tracePropagationTargets: [/^https:\/\/buez-server-khaki\.vercel\.app/],
  },
} as const;
