module.exports = function (api) {
  api.cache(true);

  const plugins = [];

  // Strip console.log/console.debug/console.info from production JS bundles.
  // console.error and console.warn are intentionally kept so real error
  // signals still surface on-device (and are ready to be picked up by crash
  // reporting like Sentry once that's wired up).
  if (process.env.NODE_ENV === "production") {
    plugins.push([
      "transform-remove-console",
      { exclude: ["error", "warn"] },
    ]);
  }

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
