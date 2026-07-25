import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RFPercentage } from "react-native-responsive-fontsize";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import Colors from "../../config/Colors";
import { HomeGradients } from "../../config/Gradients";
import AvatarInitials from "../common/DefaultAvatars";

type Props = {
  userBasic: any;
  rank: any;
  translatedBio: string | null;
  applier?: any;
  canConfirm: boolean;
  isConfirmed: boolean;
  slotInfo: any;
  confirming: boolean;
  handleConfirmApplicant: () => void;
  handleStartChat: () => void;
  theme: any;
  t: any;
  user?: any;
  navigation?: any;
  stats?: any;
};

export default function ProfileHeader({
  userBasic,
  rank,
  translatedBio,
  applier,
  canConfirm,
  isConfirmed,
  slotInfo,
  confirming,
  handleConfirmApplicant,
  handleStartChat,
  theme,
  t,
  user,
  navigation,
  stats,
}: Props) {
  const isDark = theme.mode === "dark";

  // Same soft brand surface as the top-rated cards (home + list screens)
  const headerGradient = isDark
    ? HomeGradients.topRatedBrandDark
    : HomeGradients.topRatedBrand;

  const ui = {
    backBg: isDark ? "rgba(255,255,255,0.10)" : "rgba(17,24,39,0.06)",
    backIcon: isDark ? "#FFFFFF" : theme.heading,
    name: theme.heading,
    rankTint: rank.color,
    buttonBg: Colors.primary,
    buttonDisabledBg: "#9AA0B5",
  };

  const PrimaryButton = ({
    onPress,
    disabled,
    children,
    backgroundColor,
  }: any) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={{
        alignSelf: "center",
        width: "60%",
        height: RFPercentage(5.4),
        borderRadius: RFPercentage(1.8),
        backgroundColor: backgroundColor || ui.buttonBg,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: RFPercentage(0.8),
      }}
    >
      {children}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        paddingTop: RFPercentage(2),
        paddingBottom: RFPercentage(5),
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      }}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        style={{
          position: "absolute",
          top: RFPercentage(8),
          left: RFPercentage(3),
          zIndex: 10,
          width: RFPercentage(4.4),
          height: RFPercentage(4.4),
          borderRadius: RFPercentage(100),
          backgroundColor: ui.backBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AntDesign
          name="arrowleft"
          size={RFPercentage(2.4)}
          color={ui.backIcon}
        />
      </TouchableOpacity>

      <View
        style={{
          alignItems: "center",
          paddingHorizontal: RFPercentage(3),
          paddingTop: RFPercentage(8),
        }}
      >
        {/* Avatar with rank ring + badge */}
        <View style={{ position: "relative", marginBottom: RFPercentage(2) }}>
          <View
            style={{
              padding: RFPercentage(0.4),
              borderRadius: RFPercentage(100),
              borderWidth: 2,
              borderColor: rank.color,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.85)",
            }}
          >
            <View
              style={{
                width: RFPercentage(14),
                height: RFPercentage(14),
                overflow: "hidden",
                borderRadius: RFPercentage(7),
              }}
            >
              {userBasic?.profileImage ? (
                <Image
                  source={{ uri: userBasic.profileImage }}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <AvatarInitials
                  name={userBasic?.userName}
                  textStyle={{
                    fontSize: RFPercentage(4),
                    lineHeight: RFPercentage(6),
                  }}
                  textColor={isDark ? "#FFFFFF" : Colors.primary}
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.14)"
                      : Colors.primary + "15",
                  }}
                />
              )}
            </View>
          </View>
          <View
            style={{
              position: "absolute",
              right: RFPercentage(0.6),
              bottom: RFPercentage(0.6),
              width: RFPercentage(4),
              height: RFPercentage(4),
              borderRadius: RFPercentage(2),
              backgroundColor: rank.color,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 2,
              borderColor: isDark ? "#23273B" : "#FFFFFF",
            }}
          >
            <Ionicons
              name={rank.icon as any}
              size={RFPercentage(1.8)}
              color="#FFF"
            />
          </View>
        </View>

        <Text
          style={{
            fontSize: RFPercentage(2.4),
            fontFamily: "Poppins_700Bold",
            color: ui.name,
            marginBottom: RFPercentage(0.5),
          }}
        >
          {userBasic?.userName}
        </Text>

        {applier && isConfirmed && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#4CAF50" + "18",
              borderWidth: 1,
              borderColor: "#4CAF50" + "55",
              paddingHorizontal: RFPercentage(1.5),
              paddingVertical: RFPercentage(0.5),
              borderRadius: RFPercentage(100),
              marginBottom: RFPercentage(1),
            }}
          >
            <Ionicons
              name="checkmark-circle"
              size={RFPercentage(1.8)}
              color="#4CAF50"
            />
            <Text
              numberOfLines={1}
              style={{
                color: "#4CAF50",
                fontFamily: "Poppins_600SemiBold",
                fontSize: RFPercentage(1.3),
                marginLeft: RFPercentage(0.6),
              }}
            >
              {t("profile.confirmed")}
            </Text>
          </View>
        )}

        {/* Rank pill */}
        <View
          style={{
            flexDirection: "row",
            gap: RFPercentage(1),
            marginBottom: RFPercentage(1.2),
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: RFPercentage(0.6),
              paddingHorizontal: RFPercentage(1.5),
              paddingVertical: RFPercentage(0.6),
              borderRadius: RFPercentage(100),
              backgroundColor: ui.rankTint,
            }}
          >
            <Ionicons
              name={rank.icon as any}
              size={RFPercentage(1.5)}
              color={Colors.white}
            />
            <Text
              numberOfLines={1}
              style={{
                color: Colors.white,
                fontSize: RFPercentage(1.3),
                fontFamily: "Poppins_600SemiBold",
                lineHeight: RFPercentage(1.7),
              }}
            >
              {rank.label}
            </Text>
          </View>
        </View>

        <Text
          style={{
            textAlign: "center",
            fontSize: RFPercentage(1.4),
            color: theme.darkGrey,
            lineHeight: RFPercentage(2),
            marginBottom: RFPercentage(2),
            paddingHorizontal: RFPercentage(2),
            fontFamily: "Poppins_400Regular",
          }}
        >
          {translatedBio ??
            userBasic?.biography ??
            `${t("profileRank.txt23")} ${stats?.completedTasks} tasks with high efficiency.`}
        </Text>

        {applier && canConfirm ? (
          <View style={{ width: "100%", marginBottom: RFPercentage(2) }}>
            {!isConfirmed ? (
              <>
                <PrimaryButton
                  onPress={handleConfirmApplicant}
                  disabled={confirming || slotInfo.isFull}
                  backgroundColor={
                    slotInfo.isFull ? ui.buttonDisabledBg : ui.buttonBg
                  }
                >
                  {confirming ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text
                      numberOfLines={1}
                      style={{
                        color: "#FFF",
                        fontSize: RFPercentage(1.6),
                        fontFamily: "Poppins_600SemiBold",
                      }}
                    >
                      {slotInfo.isFull
                        ? t("offerDetail.full")
                        : t("profile.confirmApplicant") || t("offerDetail.cnf")}
                    </Text>
                  )}
                </PrimaryButton>
                <Text
                  style={{
                    textAlign: "center",
                    color: theme.darkGrey,
                    fontSize: RFPercentage(1.3),
                    fontFamily: "Poppins_400Regular",
                    marginTop: RFPercentage(1),
                  }}
                >{`${slotInfo.filled}/${slotInfo.total} ${t("offerDetail.slt")} • ${slotInfo.remaining} ${t("offerDetail.lft")}`}</Text>
              </>
            ) : (
              <PrimaryButton onPress={handleStartChat}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={RFPercentage(2)}
                  color="#FFF"
                />
                <Text
                  numberOfLines={1}
                  style={{
                    color: "#FFF",
                    fontSize: RFPercentage(1.6),
                    fontFamily: "Poppins_600SemiBold",
                  }}
                >
                  {t("details.txt9")}
                </Text>
              </PrimaryButton>
            )}
          </View>
        ) : (
          <PrimaryButton onPress={handleStartChat}>
            <Ionicons
              name="chatbubble-ellipses"
              size={RFPercentage(2)}
              color="#FFF"
            />
            <Text
              numberOfLines={1}
              style={{
                color: "#FFF",
                fontSize: RFPercentage(1.6),
                fontFamily: "Poppins_600SemiBold",
              }}
            >
              {t("details.txt9")}
            </Text>
          </PrimaryButton>
        )}
      </View>
    </LinearGradient>
  );
}
