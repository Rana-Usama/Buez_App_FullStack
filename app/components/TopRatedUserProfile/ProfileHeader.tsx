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
import { Icons } from "../../config/theme";
import { navigationRef } from "../../utils/navigationRef";

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
}: Props) {
  return (
    <LinearGradient
      colors={
        theme.mode === "dark"
          ? ["#1f2238", "#3a2850"]
          : ["#a5a5bd48", "#6183a9c7"]
      }
      style={{
        paddingTop: RFPercentage(2),
        paddingBottom: RFPercentage(4),
        borderBottomLeftRadius: RFPercentage(2),
        borderBottomRightRadius: RFPercentage(2),
      }}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
        style={{
          position: "absolute",
          top: RFPercentage(8),
          left: RFPercentage(3),
          backgroundColor: theme.mode === "dark" ? "#2c1545ff" : "#706e7b52",
          padding: RFPercentage(1.1),
          borderRadius: RFPercentage(100),
        }}
      >
        <AntDesign
          name="arrowleft"
          size={RFPercentage(2.5)}
          color={theme.pureWhite}
        />
      </TouchableOpacity>
      <View
        style={{
          alignItems: "center",
          paddingHorizontal: RFPercentage(3),
          paddingTop: RFPercentage(8),
        }}
      >
        <View style={{ position: "relative", marginBottom: RFPercentage(2) }}>
          <LinearGradient
            colors={rank.gradient}
            style={{
              padding: RFPercentage(0.5),
              borderRadius: RFPercentage(100),
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
              <Image
                source={
                  userBasic?.profileImage
                    ? { uri: userBasic.profileImage }
                    : Icons.dp
                }
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          </LinearGradient>
          <View
            style={{
              position: "absolute",
              right: RFPercentage(1),
              bottom: RFPercentage(1),
            }}
          >
            <LinearGradient
              colors={rank.gradient}
              style={{
                width: RFPercentage(4),
                height: RFPercentage(4),
                borderRadius: RFPercentage(2),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name={rank.icon as any}
                size={RFPercentage(1.8)}
                color="#FFF"
              />
            </LinearGradient>
          </View>
        </View>

        <Text
          style={{
            fontSize: RFPercentage(2.4),
            fontFamily: "Poppins_700Bold",
            color: theme.pureWhite,
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
              backgroundColor: "#4CAF50" + "20",
              paddingHorizontal: RFPercentage(1.5),
              paddingVertical: RFPercentage(0.6),
              borderRadius: RFPercentage(2),
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

        <View
          style={{
            flexDirection: "row",
            gap: RFPercentage(1),
            marginBottom: RFPercentage(1),
          }}
        >
          <LinearGradient
            colors={rank.gradient}
            style={{
              paddingHorizontal: RFPercentage(1.5),
              paddingVertical: RFPercentage(0.6),
              borderRadius: RFPercentage(2),
            }}
          >
            <Text
            numberOfLines={1}
              style={{
                color: "#FFF",
                fontSize: RFPercentage(1.2),
                fontFamily: "Poppins_600SemiBold",
              }}
            >
              {rank.label}
            </Text>
          </LinearGradient>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name="trending-up"
              size={RFPercentage(1.5)}
              color="#4CAF50"
            />
            <Text
            numberOfLines={1}
              style={{ marginLeft: RFPercentage(0.5), color: theme.darkGrey }}
            >
              {/* success rate displayed by parent if needed */}
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
            `${t("profileRank.txt23")} ${0} tasks with high efficiency.`}
        </Text>

        {applier && canConfirm ? (
          <View style={{ width: "100%", marginBottom: RFPercentage(2) }}>
            {!isConfirmed ? (
              <>
                <TouchableOpacity
                  onPress={handleConfirmApplicant}
                  disabled={confirming || slotInfo.isFull}
                  style={{
                    alignSelf: "center",
                    width: "50%",
                    borderRadius: RFPercentage(3),
                    overflow: "hidden",
                  }}
                >
                  <LinearGradient
                    colors={
                      slotInfo.isFull
                        ? ["#CCCCCC", "#999999"]
                        : [Colors.primary, "#314495"]
                    }
                    style={{
                      paddingVertical: RFPercentage(1.5),
                      alignItems: "center",
                      paddingHorizontal:RFPercentage(2)
                    }}
                  >
                    {confirming ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text
                      numberOfLines={1}
                        style={{
                          color: "#FFF",
                          fontSize: RFPercentage(1.6),
                          fontFamily: "Poppins_700Bold",
                        }}
                      >
                        {slotInfo.isFull
                          ? t("offerDetail.full")
                          : t("profile.confirmApplicant") ||
                            t("offerDetail.cnf")}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                <Text
                  style={{
                    textAlign: "center",
                    color: theme.darkGrey,
                    marginTop: RFPercentage(1),
                  }}
                >{`${slotInfo.filled}/${slotInfo.total} ${t("offerDetail.slt")} • ${slotInfo.remaining} ${t("offerDetail.lft")}`}</Text>
              </>
            ) : ( <TouchableOpacity
            onPress={handleStartChat}
            style={{
              width: "50%",
              alignSelf: "center",
              borderRadius: RFPercentage(3),
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={
                theme.mode === "dark"
                  ? ["#2c1545ff", "#482074ff"]
                  : [Colors.primary, "#4c669f"]
              }
              style={{
                paddingVertical: RFPercentage(1.8),
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: RFPercentage(1),
              }}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={RFPercentage(2.2)}
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
            </LinearGradient>
          </TouchableOpacity>)}
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleStartChat}
            style={{
              width: "50%",
              alignSelf: "center",
              borderRadius: RFPercentage(3),
              overflow: "hidden",
            }}
          >
            <LinearGradient
              colors={
                theme.mode === "dark"
                  ? ["#2c1545ff", "#482074ff"]
                  : [Colors.primary, "#4c669f"]
              }
              style={{
                paddingVertical: RFPercentage(1.8),
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: RFPercentage(1),
              }}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={RFPercentage(2.2)}
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
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}
