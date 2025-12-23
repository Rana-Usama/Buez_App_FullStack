import { differenceInDays } from "date-fns";

export const decideUserRoute = (userData) => {
  const now = new Date();

  console.log("decideUserRoute..............", userData);
  if (!userData) return "OnBoarding";

  const {
    isSubscribed,
    isFreeTrial,
    subscriptionStart,
    subscriptionEnd,
    freeTrialStartedAt,
  } = userData;

  // Helper function to parse Firestore timestamps
  const parseFirestoreTimestamp = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    if (typeof timestamp === "string") return new Date(timestamp);
    return null;
  };

  // 1️⃣ No sub + no trial (handle null as false)
  if (!isSubscribed && !isFreeTrial) {
    return "FreeTrial";
  }

  // 2️⃣ Active subscription
  const subStartDate = parseFirestoreTimestamp(subscriptionStart);
  const subEndDate = parseFirestoreTimestamp(subscriptionEnd);

  const isWithinPaidPeriod =
    subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

  if (isSubscribed && isWithinPaidPeriod) {
    console.log("✅ Valid subscription, going to TabNavigator");
    console.log("Subscription start:", subStartDate);
    console.log("Subscription end:", subEndDate);
    console.log("Current date:", now);
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

  // 4️⃣ Fallback - if subscribed but not within paid period
  if (isSubscribed && !isWithinPaidPeriod) {
    console.log("⚠️ Subscription exists but not within paid period");
    console.log("Subscription start:", subStartDate);
    console.log("Subscription end:", subEndDate);
    console.log("Current date:", now);
    console.log("Is within paid period:", isWithinPaidPeriod);
    return "Subscription"; // Show subscription screen to renew
  }

  // 5️⃣ Fallback
  console.log("❌ No conditions met, defaulting to OnBoarding");
  return "OnBoarding";
};
