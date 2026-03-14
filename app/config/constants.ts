export const NOTIFICATION_ENDPOINTS = {
  SEND: "https://buez-server-khaki.vercel.app/api/send-notification",
};

export const NOTIFICATION_TYPES = {
  CONFIRMATION: "bulk_request_confirmation",
  REMOVAL: "confirmation_removed",
};

export const TABS = {
  APPLIED: "applied",
  CONFIRMED: "confirmed",
} as const;

export const MODAL_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
} as const;

export const FIRESTORE_COLLECTIONS = {
  TASK_REQUESTS: "taskRequests",
} as const;