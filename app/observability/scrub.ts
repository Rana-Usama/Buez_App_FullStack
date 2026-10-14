import type { Breadcrumb, Event } from "@sentry/react-native";

const FILTERED = "[Filtered]";
const MAX_DEPTH = 6;

const SENSITIVE_KEY =
  /pass(word)?|token|secret|authorization|cookie|api[-_]?key|card|cvc|cvv|iban|email|phone|otp/i;

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

/** Drops query string and fragment — they can carry tokens, ids or emails. */
export const stripQuery = (url: string): string => url.split(/[?#]/)[0] ?? url;

export const redactText = (text: string): string => text.replace(EMAIL, FILTERED);

export const scrubData = (value: unknown, depth = 0): unknown => {
  if (value == null || depth > MAX_DEPTH) return value;
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map((item) => scrubData(item, depth + 1));
  if (typeof value !== "object") return value;

  const result: Record<string, unknown> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
    result[key] = SENSITIVE_KEY.test(key) ? FILTERED : scrubData(entry, depth + 1);
  });
  return result;
};

export const scrubEvent = <T extends Event>(event: T): T => {
  if (event.message) event.message = redactText(event.message);

  event.exception?.values?.forEach((exception) => {
    if (exception.value) exception.value = redactText(exception.value);
  });

  if (event.extra) event.extra = scrubData(event.extra) as Event["extra"];

  if (event.request) {
    if (event.request.url) event.request.url = stripQuery(event.request.url);
    delete event.request.query_string;
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
  }

  // Native-layer breadcrumbs are merged into the event after beforeBreadcrumb
  // runs, so they must be scrubbed here as well.
  if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);

  // Keep only the opaque Firebase UID — never email, name or IP.
  if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;

  event.spans?.forEach((span) => {
    if (span.description) span.description = stripQuery(span.description);
    if (span.data) {
      delete span.data["http.query"];
      delete span.data["http.fragment"];
      if (typeof span.data.url === "string") span.data.url = stripQuery(span.data.url);
    }
  });

  return event;
};

export const scrubBreadcrumb = (breadcrumb: Breadcrumb): Breadcrumb => {
  if (breadcrumb.message) breadcrumb.message = redactText(breadcrumb.message);

  if (breadcrumb.data) {
    const data = scrubData(breadcrumb.data) as Record<string, unknown>;
    if (typeof data.url === "string") data.url = stripQuery(data.url);
    // Native SDKs split the query out (e.g. Firestore gsessionid/SID).
    delete data["http.query"];
    delete data["http.fragment"];
    breadcrumb.data = data;
  }

  return breadcrumb;
};
