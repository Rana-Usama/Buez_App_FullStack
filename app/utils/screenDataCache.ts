// Lightweight in-memory cache that survives screen unmounts within an app
// session. Used so screens can render their last-fetched data instantly on
// re-entry and refresh in the background, instead of showing a loader and an
// empty state every time the user navigates back to them.
//
// This is intentionally simple (module-level object). It is cleared only when
// the JS context is torn down (app restart / reload), which is the desired
// behavior — fresh start on cold launch, warm cache while the app is alive.

const cache: Record<string, unknown> = {};

export function getCachedData<T>(key: string): T | undefined {
  return cache[key] as T | undefined;
}

export function setCachedData<T>(key: string, value: T): void {
  cache[key] = value;
}

export function clearCachedData(key: string): void {
  delete cache[key];
}
