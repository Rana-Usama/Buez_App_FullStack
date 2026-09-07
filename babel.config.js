module.exports = function (api) {
  // Bust Babel's config cache whenever the build env changes, so a cached
  // development config can never be reused for a production bundle (and
  // vice-versa). `api.cache(true)` would freeze whichever env was seen first.
  const resolveEnv = () =>
    process.env.BABEL_ENV || process.env.NODE_ENV || "development";
  api.cache.using(resolveEnv);

  const isProduction = resolveEnv() === "production";

  const plugins = [];

  // Strip console.log/info/debug/trace/table/group/time from production JS
  // bundles at build time. console.error and console.warn are intentionally
  // kept so real error signals still surface on-device (and are ready to be
  // picked up by crash reporting like Sentry once that's wired up).
  //
  // This is the build-time layer. `app/utils/consoleGuard.ts` is the runtime
  // layer that guarantees the same result even if a bundle slips through
  // without NODE_ENV set (e.g. a custom Xcode/Gradle bundle step).
  if (isProduction) {
    plugins.push(["transform-remove-console", { exclude: ["error", "warn"] }]);
  }

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
