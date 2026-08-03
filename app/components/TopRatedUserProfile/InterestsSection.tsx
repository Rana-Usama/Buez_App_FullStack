import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { FontAwesome5 } from "@expo/vector-icons";
import Colors from "../../config/Colors";
const InterestPill = ({ item, isCustom, theme }: any) => {
  const CATEGORY_MAP: Record<string, { color: string; icon: string }> = {
    Cleaning: { color: Colors.teal, icon: "broom" },
    Moving: { color: Colors.red2, icon: "truck" },
    Gardening: { color: Colors.green3, icon: "seedling" },
    Gaming: { color: Colors.indigoLight2, icon: "gamepad" },
    Plumbing: { color: Colors.blue5, icon: "wrench" },
    Electrical: { color: Colors.orange2, icon: "bolt" },
    Carpentry: { color: Colors.orange3, icon: "hammer" },
    Painting: { color: Colors.pink, icon: "paint-brush" },
    Delivery: { color: Colors.teal4, icon: "shipping-fast" },
    Tutoring: { color: Colors.indigo2, icon: "chalkboard-teacher" },
    "Event Setup": { color: Colors.red3, icon: "calendar-alt" },
    Photography: { color: Colors.teal5, icon: "camera" },
    "Pet Care": { color: Colors.orange4, icon: "paw" },
    Other: { color: Colors.heading, icon: "ellipsis-h" },
  };
  // Falls back to an empty object for unknown keys; typed so the optional
  // lookups below (meta.color / meta.icon) remain valid.
  const meta: { color?: string; icon?: string } =
    CATEGORY_MAP[item.key] || {};
  const color =
    isCustom && theme.mode === "dark"
      ? Colors.blue10
      : isCustom && theme.mode === "light"
        ? Colors.blueDark2
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
            ? Colors.blue10
            : isCustom && theme.mode === "light"
              ? Colors.blueDark2
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
          theme.mode === "dark" ? Colors.whiteAlpha04 : Colors.white,
        borderColor:
          theme.mode === "dark"
            ? Colors.whiteAlpha10
            : Colors.slateAlpha08,
      }}
    >
      <View
        style={styles.view}
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
                ? Colors.whiteAlpha08
                : Colors.primary + "0D",
          }}
        >
          <FontAwesome5
            name="heart"
            size={RFPercentage(1.4)}
            color={theme.mode === "dark" ? Colors.white : Colors.primary}
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
      <View style={styles.view2}>
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

const styles = StyleSheet.create({
  view: {
          flexDirection: "row",
          alignItems: "center",
          gap: RFPercentage(0.9),
          marginBottom: RFPercentage(1.8),
        },
  view2: { flexDirection: "row", flexWrap: "wrap" },
});
