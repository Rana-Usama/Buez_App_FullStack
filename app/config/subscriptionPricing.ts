/**
 * Single source of truth for subscription display pricing.
 *
 * Used by SubscriptionV2, UpgradePlan and CancelSubscription so every screen
 * shows identical numbers. Keep these values in sync with the Stripe price
 * objects (Buez-Server/stripe-config.js):
 *
 *  - Monthly base: $7.90 / €7.40 / CHF 6.90 per month.
 *  - Intro offer: a Stripe coupon takes 4.00 (billing currency) off the
 *    first 3 monthly cycles → $3.90/month, then the base price automatically
 *    from cycle 4. INTRO_DISCOUNT mirrors that coupon for display only.
 *  - Yearly: $79 / €74 / CHF 69 per year.
 */

export type PlanCurrency = "USD" | "EUR" | "CHF";

export const SUBSCRIPTION_PRICES: Record<
  "monthly" | "yearly",
  Record<PlanCurrency, number>
> = {
  monthly: { USD: 7.9, EUR: 7.4, CHF: 6.9 },
  yearly: { USD: 79, EUR: 74, CHF: 69 },
};

/** Amount the intro coupon takes off each of the first 3 monthly cycles. */
export const INTRO_DISCOUNT = 4.0;

/** Number of discounted monthly billing cycles. */
export const INTRO_MONTHS = 3;

/** Base amount for a plan in the given currency (falls back to USD). */
export const getPlanAmount = (
  planId: "monthly" | "yearly",
  currency: string,
): number =>
  SUBSCRIPTION_PRICES[planId]?.[currency as PlanCurrency] ??
  SUBSCRIPTION_PRICES[planId].USD;

/** Discounted monthly amount for the first INTRO_MONTHS cycles. */
export const getIntroMonthlyAmount = (currency: string): number =>
  Math.max(getPlanAmount("monthly", currency) - INTRO_DISCOUNT, 0);
