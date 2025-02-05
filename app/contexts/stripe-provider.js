import { StripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";
import * as Linking from "expo-linking";

const merchantId = Constants.expoConfig?.plugins?.find(
  (p) => p[0] === '@stripe/stripe-react-native'
)?.[1]?.merchantIdentifier;

if (!merchantId) {
  throw new Error('Stripe merchant ID is not set in expo config');
}

export function ExpoStripeProvider(props) {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier={merchantId}
      urlScheme={Linking.createURL('/')?.split(':')[0]}
      {...props}
    />
  )
}

export default ExpoStripeProvider;