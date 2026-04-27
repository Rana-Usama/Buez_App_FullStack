import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../config/Colors";
import { Icons } from "../../config/theme";
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
      style={{
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: RFPercentage(2),
      }}
    >
      <BlurView
        intensity={80}
        tint={theme.mode === "dark" ? "dark" : "light"}
        style={{ padding: RFPercentage(2), borderRadius: 20 }}
      >
        <LinearGradient
          colors={
            theme.mode === "dark"
              ? ["rgba(255,255,255,0.15)", "rgba(255,255,255,0.08)"]
              : [Colors.primary + "40", Colors.primary + "20"]
          }
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            zIndex: 1,
            backgroundColor: Colors.primary + "05",
          }}
        >
          <View style={{ marginRight: RFPercentage(1.5) }}>
            {postRequest?.user?.profileImage ? (
              <LinearGradient
                colors={[Colors.primary, "#4557B0"]}
                style={{
                  width: RFPercentage(6.5),
                  height: RFPercentage(6.5),
                  borderRadius: RFPercentage(100),
                  padding: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  source={{ uri: postRequest.user.profileImage }}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: RFPercentage(100),
                  }}
                />
              </LinearGradient>
            ) : (
              <AvatarInitials
                name={postRequest?.user?.userName}
                style={{
                  width: RFPercentage(6.5),
                  height: RFPercentage(6.5),
                  borderRadius: RFPercentage(100),
                }}
              />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: RFPercentage(1.8),
                fontFamily: "Poppins_600SemiBold",
                marginBottom: RFPercentage(0.3),
                color: theme.mode === "dark" ? Colors.white : theme.primary,
              }}
            >
              {postRequest?.user?.userName}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: RFPercentage(0.5),
              }}
            >
              <Ionicons
                name="time-outline"
                size={RFPercentage(1.3)}
                color={theme.mode === "dark" ? Colors.white : theme.darkGrey}
              />
              <Text
                style={{
                  fontSize: RFPercentage(1.2),
                  color: theme.mode === "dark" ? Colors.white : theme.darkGrey,
                  fontFamily: "Poppins_400Regular",
                  lineHeight: RFPercentage(1.5),
                }}
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
            style={{
              width: RFPercentage(4.5),
              height: RFPercentage(4.5),
              borderRadius: RFPercentage(2.25),
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: Colors.primary,
            }}
          />
        </View>
      </BlurView>
    </View>
  );
}
