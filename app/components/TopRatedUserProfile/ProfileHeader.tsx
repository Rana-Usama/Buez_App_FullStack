import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RFPercentage } from "react-native-responsive-fontsize";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import Colors from "../../config/Colors";
import { HomeGradients } from "../../config/Gradients";
import AvatarInitials from "../common/DefaultAvatars";
import FounderBadgeById from "../common/FounderBadgeById";

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
    backBg: isDark ? Colors.whiteAlpha10 : Colors.slateAlpha06,
    backIcon: isDark ? Colors.white : theme.heading,
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
      style={styles.linearGradient}
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
        style={styles.view}
      >
        {/* Avatar with rank ring + badge */}
        <View style={styles.view2}>
          <View
            style={{
              padding: RFPercentage(0.4),
              borderRadius: RFPercentage(100),
              borderWidth: 2,
              borderColor: rank.color,
              backgroundColor: isDark
                ? Colors.sectionBgDark
                : Colors.categoryBadgeText,
            }}
          >
            <View
              style={styles.view3}
            >
              {userBasic?.profileImage ? (
                <Image
                  source={{ uri: userBasic.profileImage }}
                  style={styles.image}
                />
              ) : (
                <AvatarInitials
                  name={userBasic?.userName}
                  textStyle={styles.avatarInitialsText}
                  textColor={isDark ? Colors.white : Colors.primary}
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: isDark
                      ? Colors.whiteAlpha14
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
              borderColor: isDark ? Colors.blueDark4 : Colors.white,
            }}
          >
            <Ionicons
              name={rank.icon as any}
              size={RFPercentage(1.8)}
              color={Colors.white}
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

       <View style={styles.view4}>
        <FounderBadgeById user={userBasic} variant="pill" />
        </View>

        {applier && isConfirmed && (
          <View
            style={styles.view5}
          >
            <Ionicons
              name="checkmark-circle"
              size={RFPercentage(1.8)}
              color={Colors.green}
            />
            <Text
              numberOfLines={1}
              style={styles.text}
            >
              {t("profile.confirmed")}
            </Text>
          </View>
        )}

        {/* Rank pill */}
        <View
          style={styles.view6}
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
              style={styles.text2}
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
          <View style={styles.view7}>
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
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text
                      numberOfLines={1}
                      style={styles.text3}
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
                  color={Colors.white}
                />
                <Text
                  numberOfLines={1}
                  style={styles.text3}
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
              color={Colors.white}
            />
            <Text
              numberOfLines={1}
              style={styles.text3}
            >
              {t("details.txt9")}
            </Text>
          </PrimaryButton>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
        paddingTop: RFPercentage(2),
        paddingBottom: RFPercentage(5),
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
      },
  view: {
          alignItems: "center",
          paddingHorizontal: RFPercentage(3),
          paddingTop: RFPercentage(8),
        },
  view2: { position: "relative", marginBottom: RFPercentage(2) },
  view3: {
                width: RFPercentage(14),
                height: RFPercentage(14),
                overflow: "hidden",
                borderRadius: RFPercentage(7),
              },
  image: { width: "100%", height: "100%" },
  avatarInitialsText: {
                    fontSize: RFPercentage(4),
                    lineHeight: RFPercentage(6),
                  },
  view4: {position:"absolute", right:RFPercentage(3), top:RFPercentage(5)},
  view5: {
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: Colors.green + "18",
              borderWidth: 1,
              borderColor: Colors.green + "55",
              paddingHorizontal: RFPercentage(1.5),
              paddingVertical: RFPercentage(0.5),
              borderRadius: RFPercentage(100),
              marginBottom: RFPercentage(1),
            },
  text: {
                color: Colors.green,
                fontFamily: "Poppins_600SemiBold",
                fontSize: RFPercentage(1.3),
                marginLeft: RFPercentage(0.6),
              },
  view6: {
            flexDirection: "row",
            gap: RFPercentage(1),
            marginBottom: RFPercentage(1.2),
          },
  text2: {
                color: Colors.white,
                fontSize: RFPercentage(1.3),
                fontFamily: "Poppins_600SemiBold",
                lineHeight: RFPercentage(1.7),
              },
  view7: { width: "100%", marginBottom: RFPercentage(2) },
  text3: {
                        color: Colors.white,
                        fontSize: RFPercentage(1.6),
                        fontFamily: "Poppins_600SemiBold",
                      },
});
