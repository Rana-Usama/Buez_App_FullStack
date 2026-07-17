import { resolveFounderRoute } from "../services/Founder.service";

export const decideUserRoute = async (userData) => {
  const now = new Date();

  console.log("decideUserRoute..............", userData);
  if (!userData) return "OnBoarding";

  const { isSubscribed, subscriptionStart, subscriptionEnd } = userData;

  // Helper function to parse Firestore timestamps
  const parseFirestoreTimestamp = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    if (typeof timestamp === "string") return new Date(timestamp);
    return null;
  };

  const subStartDate = parseFirestoreTimestamp(subscriptionStart);
  const subEndDate = parseFirestoreTimestamp(subscriptionEnd);

  const isWithinPaidPeriod =
    subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

  // 1️⃣ Active subscription
  if (isSubscribed && isWithinPaidPeriod) {
    console.log("✅ Valid subscription, going to TabNavigator");
    return "TabNavigator";
  }

  // 2️⃣ Founder Phase routing: intro shown once; if this device already
  // claimed a founder spot for another account → standard plans.
  return await resolveFounderRoute(null, userData);
};
