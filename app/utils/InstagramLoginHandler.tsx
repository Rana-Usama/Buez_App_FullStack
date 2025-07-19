import { getDoc, doc, setDoc } from "firebase/firestore";
import Toast from "react-native-toast-message";
import { differenceInDays } from "date-fns";
import { FIREBASE_DB, FIREBASE_AUTH } from "../../firebaseConfig";
import { saveCredentials } from "../services/Auth.service";
import { FacebookAuthProvider, signInWithCredential } from "firebase/auth";

export const handleInstagramLogin = async ({ igProfile, pageId, pageToken, email, pushToken, long_lived_token, navigation, t }) => {
  try {
    const facebookCredential = FacebookAuthProvider.credential(long_lived_token);
    const userCredential = await signInWithCredential(FIREBASE_AUTH, facebookCredential);
    const firebaseUser = userCredential.user;

    const uid = firebaseUser.uid;
    const userRef = doc(FIREBASE_DB, "users", uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      await setDoc(userRef, {
        userName: igProfile.username,
        email: firebaseUser.email || email || null,
        profileImage: igProfile.profile_picture_url,
        instagramId: igProfile.id,
        pageId,
        pageToken,
        token: pushToken || null,
        isSubscribed: false,
        isFreeTrial: false,
        createdAt: new Date().toISOString(),
      });
    }
    const password = igProfile.id;
    await saveCredentials(email, password);
    Toast.show({
      type: "success",
      text1: t("toast.login.one"),
      text2: t("toast.login.two"),
    });

    const userData = userSnapshot.exists() ? userSnapshot.data() : null;

    const now = new Date();
    const trialStart = userData?.freeTrialStartedAt?.seconds ? new Date(userData.freeTrialStartedAt.seconds * 1000) : null;
    const subStartDate = userData?.subscriptionStart ? new Date(userData.subscriptionStart) : null;
    const subEndDate = userData?.subscriptionEnd ? new Date(userData.subscriptionEnd) : null;

    const trialDays = trialStart ? differenceInDays(now, trialStart) : null;
    const isTrialValid = trialDays !== null && trialDays >= 0 && trialDays <= 14;
    const isWithinPaidPeriod = subStartDate && subEndDate && now >= subStartDate && now <= subEndDate;

    if (userData?.isSubscribed || isWithinPaidPeriod) {
      navigation.navigate("TabNavigator");
    } else if (isTrialValid) {
      navigation.navigate("TabNavigator");
    } else if (userData?.isFreeTrial && (trialDays < 0 || trialDays > 14)) {
      navigation.navigate("Subscription");
    } else {
      navigation.navigate("FreeTrial");
    }
    return { success: true };
  } catch (error) {
    console.log("Instagram Login Error:", error);
    Toast.show({
      type: "error",
      text1: t("toast.login.three"),
      text2: t("toast.login.four"),
    });

    return { success: false, error };
  }
};
