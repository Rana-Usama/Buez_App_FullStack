import { useEffect } from "react";
import { useNavigationState } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { differenceInDays } from "date-fns";
import { useUser } from "../contexts/user.context";

type RootStackParamList = {
  Home: undefined;
  Subscription: undefined;
  // add other routes here if needed
};

interface SubscriptionListenerProps {
  navigation: StackNavigationProp<RootStackParamList>;
  userId: string | null | undefined;
}

const SubscriptionListener: React.FC<SubscriptionListenerProps> = ({ navigation, userId }) => {
  const { userData, loading } = useUser();

  const currentRouteName = useNavigationState((state) => state?.routes[state.index]?.name);

  useEffect(() => {
    if (!userId || loading || !userData) return;

    const isSubscribed = userData?.isSubscribed ?? false;
    const trialStartTimestamp = userData?.trialStartDate?.seconds;
    const trialStartDate = trialStartTimestamp ? new Date(trialStartTimestamp * 1000) : null;
    const isFreeTrial = userData?.isFreeTrial ?? false;

    if (trialStartDate) {
      const trialAge = differenceInDays(new Date(), trialStartDate);
      console.log("Trial Age:", trialAge);

      if (isSubscribed && trialAge > 14) {
        if (currentRouteName !== "Home") {
          navigation.replace("Home");
        }
        return;
      }

      if (isFreeTrial && trialAge <= 14) {
        if (currentRouteName !== "Home") {
          navigation.replace("Home");
        }
        return;
      }

      if (!isFreeTrial && trialAge <= 14) {
        if (currentRouteName !== "FreeTrial" && currentRouteName !== "SubscriptionV2") {
          navigation.replace("FreeTrial");
        }
      } else {
        if (currentRouteName !== "Home") {
          navigation.replace("Home");
        }
      }
    } else {
      if (currentRouteName !== "Subscription") {
        navigation.replace("Subscription");
      }
    }
  }, [userId, navigation, userData, loading, currentRouteName]);

  return null;
};

export default SubscriptionListener;
