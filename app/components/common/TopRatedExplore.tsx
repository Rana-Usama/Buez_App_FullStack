import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors";
import { HomeGradients } from "../../config/Gradients";

interface TopRatedExploreProps {
  t: (key: string) => string;
  navigation: any;
  theme: any;
}

const TopRatedExplore: React.FC<TopRatedExploreProps> = ({
  t,
  navigation,
  theme,
}) => {
  const isDark = theme.mode === "dark";

  const gradient = isDark
    ? HomeGradients.topRatedBrandDark
    : HomeGradients.topRatedBrand;

  const textColor = isDark ? "#FFFFFF" : Colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate("TopRatedUsers")}
      style={[
        styles.container,
        {
          borderColor: isDark
            ? "rgba(255,255,255,0.12)"
            : Colors.primary + "26",
        },
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.content}
      >
        <View
          style={[
            styles.iconChip,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.10)"
                : "rgba(255,255,255,0.75)",
            },
          ]}
        >
          <Ionicons
            name="people"
            size={RFPercentage(2.2)}
            color={textColor}
          />
        </View>

        <Text style={[styles.text, { color: textColor }]} numberOfLines={1}>
          {t("profileRank.txt45")}
        </Text>

        <View style={styles.arrowChip}>
          <FontAwesome6
            name="arrow-right"
            size={RFPercentage(1.7)}
            color="#FFFFFF"
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: RFPercentage(2),
    width: "90%",
    alignSelf: "center",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.4),
    paddingHorizontal: RFPercentage(1.6),
    gap: RFPercentage(1.2),
  },
  iconChip: {
    width: RFPercentage(4.4),
    height: RFPercentage(4.4),
    borderRadius: RFPercentage(1.4),
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.7),
  },
  arrowChip: {
    width: RFPercentage(3.8),
    height: RFPercentage(3.8),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
  },
});

export default React.memo(TopRatedExplore);
