import { useEffect } from 'react';
import { useNavigationState } from '@react-navigation/native';
import { differenceInDays } from 'date-fns';
import { useUser } from '../contexts/user.context';

const SubscriptionListener = ({ navigation, userId }) => {
  const { userData, loading } = useUser();

  // Get current active route name
  const currentRouteName = useNavigationState(
    (state) => state?.routes[state.index]?.name
  );

  useEffect(() => {
    if (!userId || loading || !userData) return;

    const isSubscribed = userData?.isSubscribed ?? false;
    const trialStartTimestamp = userData?.trialStartDate?.seconds;
    const trialStartDate = trialStartTimestamp
      ? new Date(trialStartTimestamp * 1000)
      : null;

    // If user has an active subscription, go to Home
    if (isSubscribed) {
      if (currentRouteName !== 'Home') {
        navigation.replace('Home');
      }
      return;
    }

    // User is not subscribed, check trial
    if (trialStartDate) {
      const trialAge = differenceInDays(new Date(), trialStartDate);
      console.log('Trial Age:', trialAge);

      // Trial active (<= 15 days) → allow access to Home
      if (trialAge <= 15) {
        if (currentRouteName !== 'Home') {
          navigation.replace('Home');
        }
      } else {
        // Trial expired → force subscription screen
        if (currentRouteName !== 'Subscription') {
          navigation.replace('Subscription');
        }
      }
    } else {
      // No trialStartDate means no trial → force subscription screen
      if (currentRouteName !== 'Subscription') {
        navigation.replace('Subscription');
      }
    }
  }, [userId, navigation, userData, loading, currentRouteName]);

  return null; // This component does not render UI
};

export default SubscriptionListener;
