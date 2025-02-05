import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { differenceInDays } from 'date-fns';
import { useUser } from '../contexts/user.context';
import { useNavigationState } from "@react-navigation/native";

const SubscriptionListener = ({navigation, userId }) => {
  const { userData, loading, error, isAuthenticated } = useUser();
	const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const subscription = userData?.subscription;
  const currentRouteName = useNavigationState((state) => {
    return state?.routes[state.index]?.name;
  });
  
  console.log("Current Screen:", currentRouteName);
  console.log('SubscriptionListener', subscription);
	useEffect(() => {
		if (!userId) return;
		if (subscription) {
			setSubscriptionStatus(subscription);
			const subscriptionDate = new Date(subscription.subscriptionDate.seconds * 1000);
      const subscriptionAge = differenceInDays(new Date(), subscriptionDate);
      console.log('subscriptionAge',subscriptionAge);
      if (subscriptionAge > 30) {
        if (currentRouteName && currentRouteName !== "Subscription" )
				navigation.replace("Subscription"); // Force re-subscription
			} else {
        navigation.replace('Home'); // Allow access
			}
    } else {
      if (currentRouteName && currentRouteName !== "Subscription" )
      navigation.replace("Subscription");   
    }
	}, [userId, navigation, userData, subscription]);

	return null; // This component only listens for updates
};

export default SubscriptionListener;
