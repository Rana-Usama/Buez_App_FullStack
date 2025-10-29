import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { differenceInDays } from "date-fns";
import { useUser } from "../contexts/user.context";

const SubscriptionListener = ({ userId }) => {
  const { userData, loading } = useUser();
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (loading || !userData) return;

    const isSubscribed = userData?.isSubscribed ?? false;
    const trialStartTimestamp = userData?.freeTrialStartedAt?.seconds;
    const isFreeTrial = userData?.isFreeTrial ?? false;

    const trialStartDate = trialStartTimestamp
      ? new Date(trialStartTimestamp * 1000)
      : null;

    if (trialStartDate) {
      const trialAge = differenceInDays(new Date(), trialStartDate);
      if (isFreeTrial && trialAge >= 0 && trialAge <= 14) {
        navigation.navigate("Home");
      } else if (
        (isFreeTrial && trialAge < 0) ||
        (trialAge > 14 && !isSubscribed)
      ) {
        navigation.navigate("Subscription");
      } else {
        navigation.navigate("FreeTrial");
      }
    } else if (isSubscribed) {
      navigation.navigate("Home");
    } else if (
      !isSubscribed &&
      userData?.freeTrialStartedAt <= userData?.freeTrialEndAt
    ) {
      navigation.navigate("Home");
    } else {
      navigation.navigate("FreeTrial");
    }
  }, [userData, loading, navigation]);

  return null;
};

export default SubscriptionListener;
