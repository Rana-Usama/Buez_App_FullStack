/**
 * Single source of truth for subscription display pricing.
 *
 * Used by SubscriptionV2, UpgradePlan and CancelSubscription so every screen
 * shows identical numbers. Keep these values in sync with the Stripe price
 * objects (Buez-Server/stripe-config.js):
 *
 *  - Monthly base: $7.90 / €7.40 / CHF 6.90 per month.
 *  - Intro offer: a Stripe coupon takes 4.50 (billing currency) off the
 *    first 3 monthly cycles → $3.40/month, then the base price automatically
 *    from cycle 4. INTRO_DISCOUNT mirrors that coupon for display only.
 *  - Yearly: $79 / €74 / CHF 69 per year.
 */

export type PlanCurrency = "USD" | "EUR" | "CHF";

export const SUBSCRIPTION_PRICES: Record<
  "monthly" | "yearly",
  Record<PlanCurrency, number>
> = {
  monthly: { USD: 7.9, EUR: 7.9, CHF: 7.9 },
  yearly: { USD: 79, EUR: 79, CHF: 79 },
};

/** Amount the intro coupon takes off each of the first 3 monthly cycles. */
export const INTRO_DISCOUNT = 4.5;

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

/**
 * What a year would cost paying the regular monthly price every month
 * (no yearly discount applied) — i.e. the "original price" shown struck
 * through next to the yearly plan.
 */
export const getRegularYearlyEquivalent = (currency: string): number =>
  getPlanAmount("monthly", currency) * 12;

/**
 * Savings from choosing the yearly plan over paying monthly for 12 months,
 * both as an absolute amount (in the given currency) and as a percentage.
 * Single source of truth for every screen that advertises the yearly
 * discount (SubscriptionV2, UpgradePlan, CancelSubscription, ...) — change
 * SUBSCRIPTION_PRICES and this recalculates everywhere automatically.
 */
export const getYearlySavings = (
  currency: string,
): { amount: number; percentage: number } => {
  const regularYearly = getRegularYearlyEquivalent(currency);
  const yearlyPrice = getPlanAmount("yearly", currency);
  const amount = Math.max(regularYearly - yearlyPrice, 0);
  const percentage = regularYearly > 0 ? (amount / regularYearly) * 100 : 0;
  return { amount, percentage };
};
