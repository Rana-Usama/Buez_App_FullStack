/**
 * Runtime console guard.
 *
 * Second line of defence behind the `transform-remove-console` Babel plugin
 * (see babel.config.js). Babel strips console calls from production bundles at
 * build time, but that only works when the bundler runs with
 * NODE_ENV/BABEL_ENV=production. Custom Xcode / Gradle bundle steps, stale
 * Metro caches and third-party code that logs through an aliased reference can
 * all slip past it.
 *
 * `__DEV__` is injected by Metro and is `false` in every release bundle, so
 * this check is exact and costs nothing at runtime.
 *
 * `console.error` and `console.warn` are deliberately preserved: they are real
 * signals and are what crash/error reporting (Sentry) hooks into.
 *
 * Must be imported before any application code — see index.js.
 */

const SILENCED_METHODS = [
  "log",
  "info",
  "debug",
  "trace",
  "table",
  "dir",
  "dirxml",
  "group",
  "groupCollapsed",
  "groupEnd",
  "time",
  "timeEnd",
  "timeLog",
  "count",
  "countReset",
  "assert",
  "profile",
  "profileEnd",
] as const;

const noop = (): void => {};

if (!__DEV__) {
  const target = console as unknown as Record<string, unknown>;

  SILENCED_METHODS.forEach((method) => {
    if (typeof target[method] === "function") {
      target[method] = noop;
    }
  });
}

export {};
