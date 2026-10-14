import * as Sentry from "@sentry/react-native";
import type { ComponentType } from "react";
import { setErrorReporter, type LogContext } from "../utils/logger";
import { observabilityConfig } from "./config";
import { scrubBreadcrumb, scrubEvent } from "./scrub";

let initialized = false;

const DISABLED_DEFAULT_INTEGRATIONS = new Set(["ExpoUpdatesListener"]);

export const isSentryEnabled = (): boolean => observabilityConfig.sentry.enabled;

export const initSentry = (): void => {
  if (initialized) return;
  initialized = true;

  const { sentry, environment } = observabilityConfig;
  if (!sentry.enabled) return;

  Sentry.init({
    dsn: sentry.dsn,
    environment,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    enableAutoSessionTracking: true,
    enableNetworkBreadcrumbs: false,
    integrations: (defaults) =>
      defaults.filter((integration) => !DISABLED_DEFAULT_INTEGRATIONS.has(integration.name)),
    tracesSampleRate: sentry.tracesSampleRate,
    tracePropagationTargets: [...sentry.tracePropagationTargets],

    beforeSend: (event) => scrubEvent(event),
    beforeSendTransaction: (event) => scrubEvent(event),
    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
  });

  // Every existing `logger.error(...)` call now reaches Sentry.
  setErrorReporter((error, context) => {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  });
};

/** Reports a handled error with optional context. No-op when Sentry is off. */
export const captureError = (error: unknown, context?: LogContext): void => {
  if (!initialized || !isSentryEnabled()) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
};

/** Wraps the root component (touch breadcrumbs + app start performance). */
export const wrapRootComponent = <P extends Record<string, unknown>>(
  RootComponent: ComponentType<P>,
): ComponentType<P> =>
  Sentry.wrap(RootComponent, {
    touchEventBoundaryProps: {
      extractTextFromChildren: false,
    },
  });
