import React from "react";
import { View, Text } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { FontAwesome5 } from "@expo/vector-icons";
import Colors from "../../config/Colors";
const InterestPill = ({ item, isCustom, theme }: any) => {
  const CATEGORY_MAP: Record<string, { color: string; icon: string }> = {
    Cleaning: { color: "#4ECDC4", icon: "broom" },
    Moving: { color: "#FF6B6B", icon: "truck" },
    Gardening: { color: "#95E06C", icon: "seedling" },
    Gaming: { color: "#A78BFA", icon: "gamepad" },
    Plumbing: { color: "#60A5FA", icon: "wrench" },
    Electrical: { color: "#FBBF24", icon: "bolt" },
    Carpentry: { color: "#F97316", icon: "hammer" },
    Painting: { color: "#EC4899", icon: "paint-brush" },
    Delivery: { color: "#14B8A6", icon: "shipping-fast" },
    Tutoring: { color: "#8B5CF6", icon: "chalkboard-teacher" },
    "Event Setup": { color: "#F43F5E", icon: "calendar-alt" },
    Photography: { color: "#06B6D4", icon: "camera" },
    "Pet Care": { color: "#D97706", icon: "paw" },
    Other: { color: "#6B7280", icon: "ellipsis-h" },
  };
  const meta = CATEGORY_MAP[item.key] || {};
  const color =
    isCustom && theme.mode === "dark"
      ? "#5e617dff"
      : isCustom && theme.mode === "light"
        ? "#1b1f45ff"
        : meta.color || "#3a6dedff";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: RFPercentage(10),
        paddingVertical: RFPercentage(0.5),
        paddingLeft: RFPercentage(0.55),
        paddingRight: RFPercentage(1.2),
        gap: RFPercentage(0.55),
        borderColor:
          isCustom && theme.mode === "dark"
            ? "#5e617dff"
            : isCustom && theme.mode === "light"
              ? "#1b1f45ff"
              : color + "40",
        backgroundColor: color + "10",
        marginRight: RFPercentage(1),
        marginBottom: RFPercentage(0.8),
      }}
    >
      <View
        style={{
          width: RFPercentage(2.7),
          height: RFPercentage(2.7),
          borderRadius: RFPercentage(5),
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: color + "20",
        }}
      >
        <FontAwesome5
          name={meta.icon || "tag"}
          size={RFPercentage(1.2)}
          color={color}
          solid
        />
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontSize: RFPercentage(1.4),
          fontFamily: "Poppins_500Medium",
          color,
        }}
      >
        {item.label}
      </Text>
    </View>
  );
};

export default function InterestsSection({
  translatedInterests,
  userInterests,
  theme,
}: any) {
  if (!translatedInterests) return null;
  const total =
    (userInterests?.selectedCategories?.length || 0) +
    (userInterests?.customInterests?.length || 0);
  return (
    <View
      style={{
        marginHorizontal: RFPercentage(3),
        marginTop: RFPercentage(3),
        borderRadius: 16,
        padding: RFPercentage(2.2),
        borderWidth: 1,
        backgroundColor:
          theme.mode === "dark" ? "rgba(255,255,255,0.04)" : "#FFFFFF",
        borderColor:
          theme.mode === "dark"
            ? "rgba(255,255,255,0.10)"
            : "rgba(17,24,39,0.08)",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: RFPercentage(0.9),
          marginBottom: RFPercentage(1.8),
        }}
      >
        <View
          style={{
            width: RFPercentage(3.4),
            height: RFPercentage(3.4),
            borderRadius: RFPercentage(1),
            justifyContent: "center",
            alignItems: "center",
            backgroundColor:
              theme.mode === "dark"
                ? "rgba(255,255,255,0.08)"
                : Colors.primary + "0D",
          }}
        >
          <FontAwesome5
            name="heart"
            size={RFPercentage(1.4)}
            color={theme.mode === "dark" ? "#FFFFFF" : Colors.primary}
            solid
          />
        </View>
        <Text
          style={{
            fontSize: RFPercentage(1.8),
            fontFamily: "Poppins_600SemiBold",
            flex: 1,
            color: theme.heading,
          }}
        >
          Interests
        </Text>
       
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {translatedInterests.selectedCategories?.map((it: any) => (
          <InterestPill key={it.key} item={it} theme={theme} />
        ))}
        {translatedInterests.customInterests?.map((it: any) => (
          <InterestPill key={it.key} item={it} isCustom theme={theme} />
        ))}
      </View>
    </View>
  );
}
