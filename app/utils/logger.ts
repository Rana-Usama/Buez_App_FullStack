/**
 * Application logger.
 *
 * Use this instead of `console.*` in new code:
 *   - debug/log/info  -> development only, fully absent in release
 *   - warn/error      -> always emitted, and forwarded to the error reporter
 *
 * The reporter is intentionally pluggable so Sentry (or any other crash
 * reporting SDK) can be attached once at app start without every call site
 * knowing about it:
 *
 *   import * as Sentry from "@sentry/react-native";
 *   setErrorReporter((error, context) => Sentry.captureException(error, { extra: context }));
 */

export type LogContext = Record<string, unknown>;

export type ErrorReporter = (error: unknown, context?: LogContext) => void;

let errorReporter: ErrorReporter | null = null;

export const setErrorReporter = (reporter: ErrorReporter | null): void => {
  errorReporter = reporter;
};

const report = (error: unknown, extra: unknown[]): void => {
  if (!errorReporter) return;

  try {
    errorReporter(error, extra.length ? { extra } : undefined);
  } catch {
    // Never let telemetry break the calling flow.
  }
};

const prefix = (scope?: string): string[] => (scope ? [`[${scope}]`] : []);

const createScopedLogger = (scope?: string) => ({
  debug: (...args: unknown[]): void => {
    if (__DEV__) console.debug(...prefix(scope), ...args);
  },

  log: (...args: unknown[]): void => {
    if (__DEV__) console.log(...prefix(scope), ...args);
  },

  info: (...args: unknown[]): void => {
    if (__DEV__) console.info(...prefix(scope), ...args);
  },

  warn: (...args: unknown[]): void => {
    console.warn(...prefix(scope), ...args);
  },

  /**
   * Always logged (dev and release) and forwarded to the error reporter.
   * Pass the Error/unknown first, then any context values.
   */
  error: (error: unknown, ...context: unknown[]): void => {
    console.error(...prefix(scope), error, ...context);
    report(error, context);
  },
});

/**
 * Scoped logger, e.g. `const log = createLogger("Auth.service")`.
 * Output is prefixed with the scope, which makes service-layer logs greppable.
 */
export const createLogger = (scope: string) => createScopedLogger(scope);

/** Default unscoped logger. */
export const logger = createScopedLogger();

export default logger;
