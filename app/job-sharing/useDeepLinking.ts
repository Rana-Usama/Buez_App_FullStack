import { useEffect } from "react";
import { Linking } from "react-native";

type DeepLinkHandler = (jobId: string) => void;

export const useDeepLinking = (onJobLink?: DeepLinkHandler) => {
  useEffect(() => {
    // Handle deep link when app is opened from closed state
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          handleDeepLink(initialUrl);
        }
      } catch (error) {
        console.error("Error getting initial URL:", error);
      }
    };

    // Handle deep link when app is already open
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    console.log("📱 Deep link received:", url);

    // Handle custom scheme: buez://job/123
    const customSchemeMatch = url.match(/buez:\/\/job\/([a-zA-Z0-9]+)/);

    // Handle universal links: https://buez.app/job/123
    const universalLinkMatch = url.match(/https?:\/\/.*\/job\/([a-zA-Z0-9]+)/);

    const jobId = customSchemeMatch?.[1] || universalLinkMatch?.[1];

    if (jobId) {
      console.log("✅ Navigating to job:", jobId);

      if (jobId) {
        onJobLink?.(jobId);
      } else {
        // navigation.navigate("OfferDetail", { postRequest: task });
      }
    } else {
      console.warn("⚠️ Invalid deep link format:", url);
    }
  };

  return { handleDeepLink };
};
