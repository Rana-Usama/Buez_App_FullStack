import { getAuth } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import Toast from "react-native-toast-message";
import { saveSubscription } from "./User.service";
import { FIREBASE_DB } from "../../firebaseConfig";

const db = FIREBASE_DB;

/**
 * Update the user's subscription status in Firestore
 */
export const updateSubscriptionStatus = async (start, end, planType) => {
  const userId = getAuth()?.currentUser?.uid;
  if (!userId) return;

  const userRef = doc(db, "users", userId);

  try {
    // Paid Subscription User.
    // Only write the period dates when the backend actually returned them —
    // writing null would fail the isWithinPaidPeriod gate and lock out a user
    // who just paid. The webhook fills them in either way.
    await updateDoc(userRef, {
      isSubscribed: true,
      ...(start ? { subscriptionStart: start } : {}),
      ...(end ? { subscriptionEnd: end } : {}),
      planType: planType,
      isCancelled: false,
    });
  } catch (error) {
    console.log("Failed to update subscription status:", error);
  }
};

/**
 * Fetch Stripe setup intent from backend
 */
export const fetchSetupIntent = async (email, userId) => {
  try {
    const response = await fetch(
      "https://buez-server-khaki.vercel.app/api/payment-sheet",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId }),
      }
    );
    const { setupIntentClientSecret, customerId } = await response.json();
    if (!setupIntentClientSecret || !customerId) {
      throw new Error("Missing client secret or customer ID");
    }
    return { setupIntentClientSecret, customerId };
  } catch (error) {
    console.error("Error fetching setup intent:", error);
    return null;
  }
};

/**
 * Handle payment sheet and subscription
 */
export const handlePaymentSheet = async ({
  initPaymentSheet,
  presentPaymentSheet,
  selectedPlan,
  userCurrency,
  email,
  userId,
  t,
}) => {
  const setupData = await fetchSetupIntent(email, userId);
  if (!setupData) return { success: false };

  const { setupIntentClientSecret, customerId } = setupData;

  const { error: initError } = await initPaymentSheet({
    setupIntentClientSecret,
    merchantDisplayName: "BUEZ",
    returnURL: "buez://payment-complete",
  });
  if (initError) return { success: false, error: initError };

  const { error: paymentError } = await presentPaymentSheet();
  if (paymentError) {
    Toast.show({
      type: "info",
      text1: t("toast.subscriptionV2.one"),
      text2: t("toast.subscriptionV2.two"),
    });
    return { success: false };
  }

  const setupIntentId = setupIntentClientSecret.split("_secret")[0];
  let endpoint = "";
  if (selectedPlan === "monthly") {
    endpoint =
      "https://buez-server-khaki.vercel.app/api/withoutTrial-subscription";
  } else if (selectedPlan === "yearly") {
    endpoint = "https://buez-server-khaki.vercel.app/api/yearly-subscription";
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId,
      setupIntentId,
      userId,
      planType: selectedPlan,
      currency: userCurrency,
    }),
  });

  const result = await res.json();
  if (result.success) {
    await updateSubscriptionStatus(
      result.currentPeriodStart,
      result.currentPeriodEnd,
      selectedPlan
    );
    await saveSubscription(userId, result.subscriptionId);
    Toast.show({
      type: "success",
      text1: t("toast.subscription.one"),
      text2:
        selectedPlan === "monthly"
          ? t("toast.subscription.two")
          : t("toast.subscription.three"),
    });
  }

  return result;
};
