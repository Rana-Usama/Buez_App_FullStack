import React, { useCallback, useState } from "react";
import { Text, View, Linking } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { navigate } from "../../router/navigationRef";
import { useUser } from "../../contexts/user.context";
import Colors from "../../config/Colors";
// ─── Removed useDeepLinking from here ────────────────────────────────────────
// useDeepLinking registers Linking listeners + a flush useEffect that fires
// whenever userData changes. Mounting it inside a chat message component means
// it runs once per message bubble — causing auto-navigation to OfferDetail
// every time userData loads while chat is open.
//
// For in-app link taps we don't need any of that machinery. We already have
// userData here, so we can resolve the jobId and navigate directly.

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const URL_TEST_REGEX = /https?:\/\/[^\s]+/;
const BUEZ_SHORT_LINK_REGEX = /https?:\/\/buez-server[^\s]*/;

interface ClickableMessageTextProps {
  currentMessage: any;
  currentUserId: string;
  theme: any;
  textStyle?: object;
  linkStyle?: object;
  noPadding?: boolean;
}

const ClickableMessageText: React.FC<ClickableMessageTextProps> = ({
  currentMessage,
  currentUserId,
  theme,
  textStyle,
  linkStyle,
  noPadding = false,
}) => {
  const { userData } = useUser();
  const [resolvingUrl, setResolvingUrl] = useState<string | null>(null);
  const db = getFirestore();

  // ── Resolve short code → jobId via Firestore ──────────────────────────────
  const resolveShortCodeToJobId = async (
    shortCode: string,
  ): Promise<string | null> => {
    try {
      const q = query(
        collection(db, "shortLinks"),
        where("shortCode", "==", shortCode),
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return data.jobId || data.postId || data.id || null;
      }
      return null;
    } catch (error) {
      console.error("[ClickableMessageText] Firestore resolve error:", error);
      return null;
    }
  };

  // ── URL press handler ─────────────────────────────────────────────────────
  const handleUrlPress = useCallback(
    async (url: string) => {
      const isBuezLink = BUEZ_SHORT_LINK_REGEX.test(url);

      if (!isBuezLink) {
        Linking.openURL(url);
        return;
      }

      // Extract short code from end of URL: /FIocimfM → FIocimfM
      const shortCode = url.match(/\/([a-zA-Z0-9]+)\s*$/)?.[1];

      if (!shortCode) {
        console.warn("[ClickableMessageText] Could not extract short code:", url);
        Linking.openURL(url);
        return;
      }

      setResolvingUrl(url);

      try {
        const jobId = await resolveShortCodeToJobId(shortCode);

        if (!jobId) {
          Linking.openURL(url);
          return;
        }

        // ── Navigate directly — user is already in the app and authenticated.
        //    No need for the full deep link resolution flow (subscription checks
        //    etc.) since they already passed those to get into the app.
        navigate("OfferDetail", { jobId });
      } finally {
        setResolvingUrl(null);
      }
    },
    [userData],
  );

  // ── Split text into plain + URL parts ────────────────────────────────────
  const text: string = currentMessage?.text || "";
  const isOwn = currentMessage?.user?._id === currentUserId;
  const parts = text.split(URL_REGEX);

  return (
    <View
      style={
        noPadding
          ? undefined
          : {
              paddingHorizontal: RFPercentage(1.5),
              paddingVertical: RFPercentage(0.5),
            }
      }
    >
      <Text
        style={[
          {
            color: isOwn ? Colors.white : theme.black,
            fontFamily: "Poppins_400Regular",
            fontSize: RFPercentage(1.8),
            lineHeight: RFPercentage(2.7),
            flexWrap: "wrap",
          },
          textStyle,
        ]}
      >
        {parts.map((part, index) => {
          const isUrl = URL_TEST_REGEX.test(part);

          if (isUrl) {
            const isLoading = resolvingUrl === part;
            return (
              <Text
                key={index}
                style={[
                  {
                    color: isOwn ? "rgba(255,255,255,0.85)" : theme.primary,
                    textDecorationLine: "underline",
                    fontFamily: "Poppins_400Regular",
                    fontSize: RFPercentage(1.8),
                    opacity: isLoading ? 0.5 : 1,
                  },
                  linkStyle,
                ]}
                onPress={() => !isLoading && handleUrlPress(part)}
              >
                {isLoading ? "..." : part}
              </Text>
            );
          }

          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    </View>
  );
};

export default ClickableMessageText;
