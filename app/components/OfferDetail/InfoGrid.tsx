import React from "react";
import { View, Text } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "../../config/Colors";

type Props = {
  postRequest: any;
  theme: any;
  getConvertedCompensation: (item: any) => string | null;
  t: any;
};

export default function InfoGrid({
  postRequest,
  theme,
  getConvertedCompensation,
  t,
}: Props) {
  console.log("Post Request in InfoGrid:", postRequest?.createdAt);
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: RFPercentage(1.5),
        marginBottom: RFPercentage(2),
      }}
    >
      <View
        style={{
          flex: 1,
          minWidth: 160,
          borderRadius: 16,
          padding: RFPercentage(1.5),
          backgroundColor:
            theme.mode === "dark" ? Colors.lightGrey + "10" : "#E3F2FD",
        }}
      >
        <View
          style={{
            width: RFPercentage(4),
            height: RFPercentage(4),
            borderRadius: RFPercentage(2),
            justifyContent: "center",
            alignItems: "center",
            marginBottom: RFPercentage(1),
          }}
        >
          <Ionicons
            name="location"
            size={RFPercentage(2.2)}
            color={Colors.primary}
          />
        </View>
        <Text
          style={{
            fontSize: RFPercentage(1.6),
            color: theme.darkGrey,
            fontFamily: "Poppins_600SemiBold",
          }}
        >
          {t("details.txt4")}
        </Text>
        <Text
          style={{
            marginTop: RFPercentage(0.5),
            fontSize: RFPercentage(1.5),
            color: theme.heading,
            fontFamily: "Poppins_400Regular",
          }}
          numberOfLines={2}
        >
          {postRequest?.address?.name || t("details.txt16")}
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          minWidth: 160,
          borderRadius: 16,
          padding: RFPercentage(1.5),
          backgroundColor:
            theme.mode === "dark" ? Colors.lightGrey + "10" : "#E8F5E9",
        }}
      >
        <View
          style={{
            width: RFPercentage(4),
            height: RFPercentage(4),
            borderRadius: RFPercentage(2),
            justifyContent: "center",
            alignItems: "center",
            marginBottom: RFPercentage(1),
          }}
        >
          <Ionicons
            name={
              postRequest?.compensationType === "Monitarely" ? "cash" : "gift"
            }
            size={RFPercentage(2.2)}
            color={
              postRequest?.compensationType === "Monitarely"
                ? "#4CAF50"
                : "#FF9800"
            }
          />
        </View>
        <Text
          style={{
            fontSize: RFPercentage(1.6),
            color: theme.darkGrey,
            fontFamily: "Poppins_600SemiBold",
          }}
        >
          {t("home.txt10")}
        </Text>
        <Text
          style={{
            marginTop: RFPercentage(0.5),
            fontSize: RFPercentage(1.4),
            color: Colors.primary,
            fontFamily: "Poppins_400Regular",
          }}
          numberOfLines={2}
        >
          {postRequest?.compensationType === "Monitarely"
            ? getConvertedCompensation(postRequest)
            : postRequest?.otherCompensation || t("details.txt17")}
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          minWidth: 160,
          borderRadius: 16,
          padding: RFPercentage(1.5),
          backgroundColor:
            theme.mode === "dark" ? Colors.lightGrey + "10" : "#efefefff",
        }}
      >
        <View
          style={{
            width: RFPercentage(4),
            height: RFPercentage(4),
            borderRadius: RFPercentage(2),
            justifyContent: "center",
            alignItems: "center",
            marginBottom: RFPercentage(1),
          }}
        >
          <Ionicons name="create" size={RFPercentage(2.2)} color="#9C27B0" />
        </View>
        <Text
          style={{
            fontSize: RFPercentage(1.6),
            color: theme.darkGrey,
            fontFamily: "Poppins_600SemiBold",
          }}
        >
          {t("myRequests.txt4") || "Posted"}
        </Text>
        <Text
          style={{
            marginTop: RFPercentage(0.5),
            fontSize: RFPercentage(1.4),
            color: theme.heading,
            fontFamily: "Poppins_400Regular",
          }}
        >
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
  );
}
