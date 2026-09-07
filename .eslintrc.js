// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
  rules: {
    // Use `logger` from app/utils/logger instead of raw console calls.
    // warn/error stay allowed: they survive release builds by design.
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: ['app/utils/logger.ts', 'app/utils/consoleGuard.ts'],
      rules: { 'no-console': 'off' },
    },
  ],
};
