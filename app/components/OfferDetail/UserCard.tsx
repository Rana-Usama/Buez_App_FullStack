import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../config/Colors";
import { ShareButton } from "../../job-sharing/ShareButton";
import AvatarInitials from "../common/DefaultAvatars";
import { getAvatarColors } from "../../config/avatarColors";

type Props = {
  postRequest: any;
  theme: any;
  t: any;
  translatedOffer: any;
  onBack: () => void;
  onOpenViewer: () => void;
  activeIndex: number;
};

export default function UserCard({
  postRequest,
  theme,
  t,
  translatedOffer,
  onBack,
  onOpenViewer,
  activeIndex,
}: Props) {
  const isDark = theme.mode === "dark";

  const firstLetter = postRequest?.user?.userName.trim()?.[0];
  const [, groupTextColor] = getAvatarColors(firstLetter, isDark);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
          borderColor: isDark
            ? "rgba(255,255,255,0.10)"
            : "rgba(17,24,39,0.08)",
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          {postRequest?.user?.profileImage ? (
            <LinearGradient
              colors={[Colors.primary, "#4557B0"]}
              style={styles.avatarRing}
            >
              <Image
                source={{ uri: postRequest.user.profileImage }}
                style={styles.avatar}
              />
            </LinearGradient>
          ) : (
            <AvatarInitials
              name={postRequest?.user?.userName}
              style={styles.avatarPlain}
            />
          )}
        </View>

        <View style={styles.info}>
          <Text
            style={[
              styles.name,
              { color: isDark ? Colors.white : theme.primary },
            ]}
            numberOfLines={1}
          >
            {postRequest?.user?.userName}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons
              name="time-outline"
              size={RFPercentage(1.4)}
              color={theme.darkGrey}
            />
            <Text
              style={[styles.meta, { color: theme.darkGrey }]}
              numberOfLines={1}
            >
              {t("myRequests.txt4")} •{" "}
              {postRequest?.createdAt
                ? new Date(postRequest.createdAt.seconds * 1000)
                    .toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })
                    .replace(",", "")
                : ""}
            </Text>
          </View>
        </View>

        <ShareButton
          jobId={postRequest?.id}
          color="white"
          jobTitle={
            postRequest?.taskType === "Other"
              ? postRequest?.customTaskTitle || postRequest?.taskType
              : postRequest?.taskType
          }
          jobDescription={postRequest?.description}
          companyName="Buez"
          style={styles.shareBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(1.6),
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    marginRight: RFPercentage(1.5),
  },
  avatarRing: {
    width: RFPercentage(6.5),
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(100),
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: RFPercentage(100),
  },
  avatarPlain: {
    width: RFPercentage(6.5),
    height: RFPercentage(6.5),
    borderRadius: RFPercentage(100),
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.3),
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.5),
  },
  meta: {
    flex: 1,
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(1.6),
  },
  shareBtn: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(2.25),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
    marginLeft: RFPercentage(1),
  },
});
