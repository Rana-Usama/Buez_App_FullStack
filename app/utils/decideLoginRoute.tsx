import { differenceInDays } from "date-fns";

export const decideUserRoute = (userData) => {
  const now = new Date();

  if (!userData) return "OnBoarding";

  const {
    isSubscribed,
    isFreeTrial,
    subscriptionStart,
    subscriptionEnd,
    freeTrialStartedAt,
  } = userData;

  // 1️⃣ No sub + no trial
  if (!isSubscribed && !isFreeTrial) {
    return "FreeTrial";
  }

  // 2️⃣ Active subscription
  const subStartDate = subscriptionStart ? new Date(subscriptionStart) : null;
  const subEndDate = subscriptionEnd ? new Date(subscriptionEnd) : null;
  const isWithinPaidPeriod =
    subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

  if (isSubscribed && isWithinPaidPeriod) {
    return "TabNavigator";
  }

  // 3️⃣ Active trial (within 14 days)
  if (isFreeTrial && freeTrialStartedAt?.seconds) {
    const trialStart = new Date(freeTrialStartedAt.seconds * 1000);
    const trialDays = differenceInDays(now, trialStart);
    const isTrialValid = trialDays >= 0 && trialDays <= 14;

    if (isTrialValid) return "TabNavigator";
    else return "Subscription"; // trial expired
  }

  // 4️⃣ Fallback
  return "OnBoarding";
};
