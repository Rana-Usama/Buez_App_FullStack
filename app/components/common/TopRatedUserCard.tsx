import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { HomeGradients } from "../../config/Gradients";
import { TopRatedUser } from "../../types/home.types";
import { Icons } from "../../config/theme";
import AvatarInitials from "./DefaultAvatars";
import Colors from "../../config/Colors";

interface TopRatedUserCardProps {
  user: TopRatedUser;
  onPress: () => void;
  darkMode: boolean;
  t: (key: string) => string;
}

const TopRatedUserCard: React.FC<TopRatedUserCardProps> = ({
  user,
  onPress,
  darkMode,
  t,
}) => {
  const getCardGradient = () =>
    darkMode ? HomeGradients.topRatedBrandDark : HomeGradients.topRatedBrand;
  const getRankAccent = () => {
    switch (user.category) {
      case "Top Rated":
        return {
          name: "trophy",
          color: "#bfa824ff",
          bgColor: "rgba(255, 215, 0, 0.1)",
        };
      case "Rising Talent":
        return {
          name: "trending-up",
          color: "#79b7b0ff",
          bgColor: "#71a58231",
        };
      case "Beginner":
        return { name: "leaf", color: "#9b6fc1ff", bgColor: "#d3c2e23a" };
      default:
        return { name: "person", color: "#4557B0" };
    }
  };

  const rankAccent = getRankAccent();

  const getCategoryIcon = () => (
    <Ionicons
      name={rankAccent.name as any}
      size={RFPercentage(1.8)}
      color={rankAccent.color}
    />
  );

  const getCategoryText = () => {
    switch (user.category) {
      case "Top Rated":
        return t("profileRank.txt5");
      case "Rising Talent":
        return t("profileRank.txt4");
      case "Beginner":
        return t("profileRank.txt3");
      default:
        return user.category;
    }
  };

  const cardGradient = getCardGradient();

  // Theme-driven foreground palette so content stays legible on the
  // light (light mode) vs muted-slate (dark mode) card surfaces.
  const c = darkMode
    ? {
        title: "#FFFFFF",
        handle: "rgba(255,255,255,0.7)",
        badgeTint: "dark" as const,
        badgeText: "#FFFFFF",
        avatarBg: "rgba(255,255,255,0.16)",
        avatarText: "#FFFFFF",
        avatarBorder: "rgba(255,255,255,0.45)",
        buttonTint: "light" as const,
        buttonBg: Colors.white,
        buttonBorder: "rgba(255,255,255,0.18)",
        buttonText: "#FFFFFF",
        meshLight: "rgba(255,255,255,0.06)",
        meshDark: "rgba(0,0,0,0.18)",
        shadow: "#0A0F26",
        border: "rgba(255, 255, 255, 0.14)",
      }
    : {
        title: "#61667dff",
        handle: "#64748B",
        badgeTint: "light" as const,
        badgeText: "#253275",
        avatarBg: "rgba(37,50,117,0.10)",
        avatarText: "#253275",
        avatarBorder: "rgba(37,50,117,0.25)",
        buttonTint: "light" as const,
        buttonBg: Colors.primary,
        buttonBorder: "rgba(37,50,117,0.16)",
        buttonText: "#253275",
        meshLight: "rgba(255,255,255,0.35)",
        meshDark: "rgba(37,50,117,0.06)",
        shadow: "rgba(255, 255, 255, 0.98)",
        border: "rgba(255, 255, 255, 0.14)",
      };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.cardWrapper,
        { shadowColor: c.shadow, borderColor: c.border },
      ]}
    >
      <LinearGradient
        colors={cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topRatedCard}
      >
        {/* Mesh Overlay 1 */}
        <LinearGradient
          colors={[c.meshLight, "transparent"]}
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ rotate: "45deg" }], top: -50 },
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Mesh Overlay 2 */}
        <LinearGradient
          colors={["transparent", c.meshDark]}
          style={StyleSheet.absoluteFill}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.cardContent}>
          {/* Category Badge */}
          <View
            style={[
              styles.categoryBadgeContainer,
              { backgroundColor: rankAccent?.bgColor },
            ]}
          >
            <View style={styles.badgeInner}>
              {getCategoryIcon()}
              <Text style={[styles.categoryText, { color: rankAccent.color }]}>
                {getCategoryText()}
              </Text>
            </View>
          </View>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {user.profileImage ? (
              <View style={styles.avatarShadow}>
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.avatar}
                />
              </View>
            ) : (
              <AvatarInitials
                name={user.name}
                bgColor={c.avatarBg}
                textColor={c.avatarText}
                style={[
                  styles.avatar,
                  {
                    borderWidth: RFPercentage(0.4),
                    borderColor: c.avatarBorder,
                  },
                ]}
              />
            )}
          </View>

          {/* Name & Handle */}
          <View style={styles.nameContainer}>
            <Text
              style={[styles.userName, { color: c.title }]}
              numberOfLines={1}
            >
              {user.name || "User"}
            </Text>
            <Text style={[styles.userHandle, { color: c.handle }]}>
              @{user.name?.split(" ")[0]?.toLowerCase() || "user"}
            </Text>
          </View>

          {/* View Profile Button */}
          <TouchableOpacity
            style={[
              styles.buttonBlur,
              {
                backgroundColor: c.buttonBg + "20",
                borderColor: c.buttonBorder,
              },
            ]}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.viewProfileText, { color: c.buttonText }]}
              numberOfLines={1}
            >
              {t("profileRank.txt8")}
            </Text>
            <Ionicons
              name="chevron-forward-circle"
              size={18}
              color={c.buttonText}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: RFPercentage(22),
    marginRight: 15,
    borderRadius: 15,
    // overflow: "hidden",

    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    // alignSelf: "flex-start",

    borderWidth: RFPercentage(0.1),
  },
  topRatedCard: {
    height: RFPercentage(30),
    padding: 15,
    borderRadius: 15,
    position: "relative",
    overflow: "hidden",
  },
  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  categoryBadgeContainer: {
    alignSelf: "flex-start",
    borderRadius: 100,
    overflow: "hidden",
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.4),
    alignItems: "center",
    justifyContent: "center",
  },
  blurBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: RFPercentage(1.8),
  },
  avatarWrapper: {
    // marginVertical: 10,
  },
  avatarShadow: {
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatar: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
  },
  nameContainer: {
    alignItems: "center",
    // backgroundColor:"red"
  },
  userName: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    color: "#FFF",
  },
  userHandle: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.8)",
    textTransform: "lowercase",
  },
  viewProfileButton: {
    width: "100%",
    overflow: "hidden",
    marginTop: 10,
  },
  buttonBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: RFPercentage(2.5),
    height: RFPercentage(4),
    borderRadius: RFPercentage(0.7),
  },
  viewProfileText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
    color: "#FFF",
  },
});

export default React.memo(TopRatedUserCard);
