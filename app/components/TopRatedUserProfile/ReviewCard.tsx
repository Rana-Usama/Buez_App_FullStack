import React from "react";
import { View, Text, Image } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons } from "@expo/vector-icons";
import { Icons } from "../../config/theme";
import Colors from "../../config/Colors";
import AvatarInitials from "../common/DefaultAvatars";

export default function ReviewCard({ item, translated, theme }: any) {
  return (
    <View
      style={{
        padding: RFPercentage(2),
        borderRadius: RFPercentage(2),
        marginBottom: RFPercentage(1.5),
        borderWidth: 1,
        width: "90%",
        alignSelf: "center",
        borderColor:
          theme.mode === "dark"
            ? "rgba(35, 35, 51, 1)"
            : "rgba(239, 239, 242, 1)",
        backgroundColor:
          theme.mode === "dark"
            ? "rgba(10, 10, 18, 1)"
            : "rgba(239, 239, 246, 1)",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: RFPercentage(1),
        }}
      >
        {item?.reviewer?.profileImage ? (
          <Image
            source={{ uri: item.reviewer.profileImage }}
            style={{
              width: RFPercentage(5),
              height: RFPercentage(5),
              borderRadius: RFPercentage(1.5),
              marginRight: RFPercentage(1),
            }}
          />
        ) : (
          <AvatarInitials
            name={item?.reviewer?.userName}
            textStyle={{ fontSize: RFPercentage(2) }}
            style={{
              width: RFPercentage(5),
              height: RFPercentage(5),
              borderRadius: RFPercentage(1.5),
              marginRight: RFPercentage(1),
            }}
          />
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: RFPercentage(1.4),
              fontFamily: "Poppins_600SemiBold",
              color: theme.heading,
            }}
          >
            {item?.reviewer?.userName}
          </Text>
          <View style={{ flexDirection: "row", marginTop: RFPercentage(0.5) }}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name="star"
                size={RFPercentage(1.4)}
                color={i < item?.rating ? "#FFD700" : "#DDD"}
              />
            ))}
          </View>
        </View>
        <Text style={{ color: Colors.primary, fontSize: 12 }}>
          {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
        </Text>
      </View>
      <Text style={{ color: theme.darkGrey }}>
        {translated ?? item?.reviewText}
      </Text>
    </View>
  );
}
