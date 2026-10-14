import * as Sentry from "@sentry/react-native";

export type AppEvent =
  | "signup_success"
  | "login_success"
  | "logout"
  | "account_deleted"
  | "task_posted"
  | "task_reposted"
  | "task_edited"
  | "subscription_started"
  | "subscription_upgraded"
  | "subscription_cancelled";

/** Non-identifying details only (plan type, login method…). No ids, emails or free text. */
export type AppEventData = Record<string, string | number | boolean>;

export const trackEvent = (name: AppEvent, data?: AppEventData): void => {
  Sentry.addBreadcrumb({
    category: "app.event",
    type: "info",
    level: "info",
    message: name,
    data,
  });
};
