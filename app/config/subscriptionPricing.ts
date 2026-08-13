/**
 * Single source of truth for subscription display pricing.
 *
 * Used by SubscriptionV2, Subscription, UpgradePlan and CancelSubscription so
 * every screen shows identical numbers. Keep these values in sync with the
 * Stripe price objects (Buez-Server/stripe-config.js):
 *
 *  - Monthly base: $7.90 / €7.90 / CHF 7.90 per month.
 *  - Intro offer: a Stripe coupon takes 4.00 (billing currency) off the first
 *    3 monthly cycles → $3.90/month, then the base price ($7.90) automatically
 *    from cycle 4. INTRO_DISCOUNT mirrors that coupon for display only.
 *  - Yearly: $79 / €79 / CHF 79 per year.
 *
 * ── TWO YEARLY-SAVINGS BASELINES: THIS IS DELIBERATE ──────────────────────
 *
 * The yearly plan is advertised against two different monthly baselines,
 * because "what you'd pay instead" genuinely differs by audience. Do not
 * "fix" the inconsistency by pointing both screens at one helper — pick the
 * helper that matches who is looking at the screen.
 *
 *  getYearlySavings()        → baseline standardMonthly × 12 = $94.80
 *                              → "Save 17%", "You save $15.80 per year"
 *    Used by pre-purchase screens (SubscriptionV2, Subscription). The viewer
 *    has not consumed the intro offer yet; over any steady-state year the
 *    monthly plan costs them the full $94.80, so that is the honest
 *    comparison and the honest struck-through price.
 *
 *  getForwardYearMonthlyCost() → baseline scales with the promo cycles the
 *                                subscriber has LEFT (see table below)
 *    Used by UpgradePlan, which is only reachable by an existing monthly
 *    subscriber. Their real alternative to upgrading is the next 12 months on
 *    monthly, which still includes whatever promotional cycles remain — so
 *    the baseline (and therefore the saving) moves as the promo is consumed:
 *
 *        cycle | promo left | next 12 months | savings | badge
 *          1   |     3      |     $82.80     |  $3.80  |  5%
 *          2   |     2      |     $86.80     |  $7.80  |  9%
 *          3   |     1      |     $90.80     | $11.80  | 13%
 *          4+  |     0      |     $94.80     | $15.80  | 17%
 *
 *    Note the endpoint: once the promo is used up the baseline IS
 *    standardMonthly × 12, so a post-promo subscriber sees exactly the same
 *    17% / $15.80 / $94.80 that SubscriptionV2 shows. These are not two
 *    unrelated numbers — they are the two ends of one formula.
 *
 * Consequence to keep in mind: a user who signs up and later opens
 * UpgradePlan sees "Save 17%" become "Save 5%", then climb back to 17% as
 * their promo runs out. That is expected, not a bug. If product ever wants one
 * fixed number everywhere, that is a deliberate product decision about which
 * claim to make — not a refactor.
 *
 * getFirstYearMonthlyCost() is the cycle-1 case of the forward baseline, kept
 * as the fallback for when subscriptionStart is unknown.
 */

export type PlanCurrency = "USD" | "EUR" | "CHF";

export type PlanId = "monthly" | "yearly";

export const SUBSCRIPTION_PRICES: Record<
  PlanId,
  Record<PlanCurrency, number>
> = {
  monthly: { USD: 7.9, EUR: 7.9, CHF: 7.9 },
  yearly: { USD: 79, EUR: 79, CHF: 79 },
};

/**
 * Amount the intro coupon takes off each of the first INTRO_MONTHS cycles.
 * 7.90 - 4.00 = 3.90 → the promotional price new users are billed.
 */
export const INTRO_DISCOUNT = 4.0;

/** Number of discounted monthly billing cycles. */
export const INTRO_MONTHS = 3;

/** Tolerance for float comparisons on currency amounts (half a cent). */
const AMOUNT_EPSILON = 0.005;

/** Keeps derived amounts free of float noise (7.9 - 4 = 3.9000000000000004). */
const roundToCents = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * 100) / 100;

/** Base amount for a plan in the given currency (falls back to USD). */
export const getPlanAmount = (planId: PlanId, currency: string): number =>
  SUBSCRIPTION_PRICES[planId]?.[currency as PlanCurrency] ??
  SUBSCRIPTION_PRICES[planId].USD;

/** Discounted monthly amount for the first INTRO_MONTHS cycles. */
export const getIntroMonthlyAmount = (currency: string): number =>
  roundToCents(Math.max(getPlanAmount("monthly", currency) - INTRO_DISCOUNT, 0));

/**
 * What a year would cost paying the regular monthly price every month
 * (no yearly discount applied) — i.e. the "original price" shown struck
 * through next to the yearly plan on the PRE-PURCHASE screens.
 *
 * Pairs with getYearlySavings(). See the "two yearly-savings baselines" note
 * at the top of this file before reusing it on a post-purchase screen.
 */
export const getRegularYearlyEquivalent = (currency: string): number =>
  getPlanAmount("monthly", currency) * 12;

/**
 * What the FIRST year on the monthly plan costs: INTRO_MONTHS cycles at the
 * promotional price, then the standard price for the remaining cycles.
 *
 * This is the cycle-1 case of getForwardYearMonthlyCost(), which is what
 * UpgradePlan actually uses. Kept as the fallback for when subscriptionStart
 * is unknown, and for anywhere that genuinely means "a new user's first year".
 */
export const getFirstYearMonthlyCost = (currency: string): number => {
  const standard = getPlanAmount("monthly", currency);
  const intro = getIntroMonthlyAmount(currency);
  return roundToCents(
    intro * INTRO_MONTHS + standard * Math.max(12 - INTRO_MONTHS, 0),
  );
};

/**
 * Savings from choosing the yearly plan over paying the regular monthly price
 * for 12 months, as an absolute amount and a percentage.
 *
 * The PRE-PURCHASE baseline — used by SubscriptionV2 / Subscription and by
 * CancelSubscription's yearly savings badge. UpgradePlan deliberately uses
 * getFirstYearMonthlyCost() instead; see the "two yearly-savings baselines"
 * note at the top of this file.
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

/**
 * Normalises the several shapes a subscription date can arrive in: a
 * Firestore Timestamp ({ seconds }), an ISO string, an epoch number or an
 * already-parsed Date. Returns null when the value is missing/unparseable.
 */
export const parseSubscriptionDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      try {
        const converted = value.toDate();
        return isNaN(converted.getTime()) ? null : converted;
      } catch {
        return null;
      }
    }
    if (typeof value.seconds === "number") {
      return new Date(value.seconds * 1000);
    }
    return null;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

/** Adds whole months to a date, clamping the day for shorter months. */
const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date.getTime());
  const day = result.getDate();
  result.setMonth(result.getMonth() + months);
  // e.g. Jan 31 + 1 month must not roll over into March.
  if (result.getDate() < day) result.setDate(0);
  return result;
};

/**
 * When the promotional pricing stops applying — i.e. the start of the first
 * cycle billed at the standard price. Null when the start date is unknown.
 */
export const getIntroPeriodEnd = (subscriptionStart: any): Date | null => {
  const start = parseSubscriptionDate(subscriptionStart);
  return start ? addMonths(start, INTRO_MONTHS) : null;
};

/** True when `at` still falls inside the INTRO_MONTHS promotional window. */
export const isWithinIntroPeriod = (
  subscriptionStart: any,
  at: Date = new Date(),
): boolean => {
  const introEnd = getIntroPeriodEnd(subscriptionStart);
  return introEnd ? at.getTime() < introEnd.getTime() : false;
};

/**
 * How many promotional cycles the subscriber has NOT yet consumed, counted the
 * same way Stripe advances a billing anchor (month-end clamped via addMonths,
 * so a Jan 31 start bills Feb 28 as cycle 2).
 *
 * Returns null when subscriptionStart is unknown — callers should fall back to
 * the first-year figures rather than assuming a stage.
 */
export const getRemainingIntroCycles = (
  subscriptionStart: any,
  at: Date = new Date(),
): number | null => {
  const start = parseSubscriptionDate(subscriptionStart);
  if (!start) return null;

  let elapsed = 0;
  while (
    elapsed < INTRO_MONTHS &&
    addMonths(start, elapsed + 1).getTime() <= at.getTime()
  ) {
    elapsed++;
  }
  return Math.max(INTRO_MONTHS - elapsed, 0);
};

/**
 * Cost of the NEXT 12 months on the monthly plan for this specific subscriber:
 * their remaining promotional cycles at the intro price, the rest at the
 * standard price. This is the honest "what you'd pay instead" figure for an
 * upgrade prompt, because it moves as the promo is consumed.
 *
 * Endpoints (see the note at the top of this file):
 *  - 3 promo cycles left (brand new)  → getFirstYearMonthlyCost()  = $82.80
 *  - 0 promo cycles left (post-promo) → getRegularYearlyEquivalent() = $94.80
 *
 * Falls back to getFirstYearMonthlyCost() when subscriptionStart is unknown.
 */
export const getForwardYearMonthlyCost = (
  currency: string,
  subscriptionStart: any,
  at: Date = new Date(),
): number => {
  const remaining = getRemainingIntroCycles(subscriptionStart, at);
  if (remaining === null) return getFirstYearMonthlyCost(currency);

  const introCycles = Math.min(Math.max(remaining, 0), 12);
  const intro = getIntroMonthlyAmount(currency);
  const standard = getPlanAmount("monthly", currency);
  return roundToCents(intro * introCycles + standard * (12 - introCycles));
};

/**
 * Savings from switching this subscriber to yearly, measured against their own
 * next 12 months on monthly (getForwardYearMonthlyCost). The POST-PURCHASE
 * counterpart to getYearlySavings() — see the note at the top of this file.
 *
 * `monthlyBaseline` is returned alongside so the caller can render it as the
 * struck-through "original" price without recomputing it.
 */
export const getForwardYearlySavings = (
  currency: string,
  subscriptionStart: any,
  at: Date = new Date(),
): { monthlyBaseline: number; amount: number; percentage: number } => {
  const monthlyBaseline = getForwardYearMonthlyCost(
    currency,
    subscriptionStart,
    at,
  );
  const yearlyPrice = getPlanAmount("yearly", currency);
  const amount = roundToCents(Math.max(monthlyBaseline - yearlyPrice, 0));
  const percentage =
    monthlyBaseline > 0 ? (amount / monthlyBaseline) * 100 : 0;
  return { monthlyBaseline, amount, percentage };
};

export type MonthlyPricingInput = {
  /** userData.planType / userData.subscription.planInterval */
  planType?: string | null;
  /** userData.subscriptionStart (Firestore Timestamp / ISO string / epoch) */
  subscriptionStart?: any;
  /** userData.subscription.amountPaid — what Stripe actually billed. */
  amountPaid?: any;
  /** userData.subscription.currency — the billing currency, if known. */
  amountCurrency?: string | null;
  /** Locale-derived currency, used when the billing currency is unknown. */
  fallbackCurrency: string;
};

export type MonthlyPricingInfo = {
  /** The user is inside the promotional window (monthly plans only). */
  isIntroPricing: boolean;
  /** What the user is billed right now. */
  currentAmount: number;
  /** Currency for currentAmount. */
  currentCurrency: string;
  /** What the plan renews at once the promo ends. */
  standardAmount: number;
  /** Currency for standardAmount. */
  standardCurrency: string;
  /** Promotional amount for a brand-new subscriber. */
  introAmount: number;
  /** Number of promotional cycles. */
  introMonths: number;
  /** When the promo ends, when the start date is known. */
  introEndsAt: Date | null;
};

/**
 * Resolves which subscription stage the user is in, so screens can show the
 * price actually being charged instead of always the standard one.
 *
 * Resolution order:
 *  1. `amountPaid` from the Stripe webhook — the most authoritative signal.
 *  2. `subscriptionStart` + INTRO_MONTHS — used when the webhook hasn't
 *     written an amount yet (older subscriptions, offline writes), which is
 *     why intro users no longer fall back to the standard price.
 *
 * Yearly plans are never on the monthly intro offer, so they short-circuit to
 * the standard monthly figures with isIntroPricing = false.
 */
export const resolveMonthlyPricing = ({
  planType,
  subscriptionStart,
  amountPaid,
  amountCurrency,
  fallbackCurrency,
}: MonthlyPricingInput): MonthlyPricingInfo => {
  const standardAmount = getPlanAmount("monthly", fallbackCurrency);
  const introAmount = getIntroMonthlyAmount(fallbackCurrency);
  const introEndsAt = getIntroPeriodEnd(subscriptionStart);

  const base: MonthlyPricingInfo = {
    isIntroPricing: false,
    currentAmount: standardAmount,
    currentCurrency: fallbackCurrency,
    standardAmount,
    standardCurrency: fallbackCurrency,
    introAmount,
    introMonths: INTRO_MONTHS,
    introEndsAt,
  };

  if (planType === "yearly") return base;

  const billedAmount =
    typeof amountPaid === "number" && amountPaid > 0 ? amountPaid : null;
  const billedCurrency = (amountCurrency || fallbackCurrency).toUpperCase();

  if (billedAmount !== null) {
    return {
      ...base,
      isIntroPricing: billedAmount < standardAmount - AMOUNT_EPSILON,
      currentAmount: billedAmount,
      currentCurrency: billedCurrency,
    };
  }

  const isIntroPricing = isWithinIntroPeriod(subscriptionStart);
  return {
    ...base,
    isIntroPricing,
    currentAmount: isIntroPricing ? introAmount : standardAmount,
  };
};
