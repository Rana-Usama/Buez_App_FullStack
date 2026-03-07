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
import { useDeepLinking } from "../../job-sharing/useDeepLinking";
import Colors from "../../config/Colors";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
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
  noPadding = false, // default: has padding (used in 1-on-1 Chat via GiftedChat bubble)
}) => {
  const { userData, loading: userLoading } = useUser();
  const [resolvingUrl, setResolvingUrl] = useState<string | null>(null);
  const db = getFirestore();

  const { handleDeepLink } = useDeepLinking({
    userData,
    userLoading,
    onJobLink: (jobId) => {
      navigate("OfferDetail", { jobId });
    },
  });

  // ── Resolve short code → jobId via Firestore ───────────────────────────────
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

  // ── URL press handler ──────────────────────────────────────────────────────
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
        if (jobId) {
          handleDeepLink(`buez://job/${jobId}`);
        } else {
          Linking.openURL(url);
        }
      } finally {
        setResolvingUrl(null);
      }
    },
    [handleDeepLink],
  );

  // ── Split text into plain + URL parts ─────────────────────────────────────
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
          URL_REGEX.lastIndex = 0;
          const isUrl = URL_REGEX.test(part);
          URL_REGEX.lastIndex = 0;

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
                {isLoading ? "Opening..." : part}
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
