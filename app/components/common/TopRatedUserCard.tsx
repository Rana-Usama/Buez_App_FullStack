import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageSourcePropType,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { HomeGradients } from "../../config/Gradients";
import { TopRatedUser } from "../../types/home.types";
import { Icons } from "../../config/theme";
import AvatarInitials from "./DefaultAvatars";
import FounderBadgeById from "./FounderBadgeById";
import Colors from "../../config/Colors";
import { useAppTheme } from "../../contexts/themeContext";

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
          color: Colors.yellow,
          bgColor: Colors.yellowAlpha10,
        };
      case "Rising Talent":
        return {
          name: "rocket",
          color: Colors.teal2,
          bgColor: "#71a58231",
        };
      case "Beginner":
        return { name: "leaf", color: Colors.indigo, bgColor: Colors.indigoLight };
      default:
        return { name: "person", color: Colors.success2 };
    }
  };

  const rankAccent = getRankAccent();

  const getCategoryIcon = () => (
    <Ionicons
      name={rankAccent.name as any}
      size={RFPercentage(1.8)}
      color={darkMode ? rankAccent.color : Colors.white}
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
        title: Colors.white,
        handle: Colors.heroStatsLabel,
        badgeTint: "dark" as const,
        badgeText: Colors.white,
        avatarBg: Colors.whiteAlpha16,
        avatarText: Colors.white,
        avatarBorder: Colors.whiteAlpha45,
        buttonTint: "light" as const,
        buttonBg: Colors.white,
        buttonBorder: Colors.whiteAlpha18,
        buttonText: Colors.white,
        meshLight: Colors.sectionBgDark,
        meshDark: "rgba(0,0,0,0.18)",
        shadow: "#0A0F26",
        border: Colors.whiteAlpha14,
      }
    : {
        title: "#61667dff",
        handle: Colors.desc,
        badgeTint: "light" as const,
        badgeText: Colors.primary,
        avatarBg: Colors.primaryAlpha10,
        avatarText: Colors.primary,
        avatarBorder: "rgba(37,50,117,0.25)",
        buttonTint: "light" as const,
        buttonBg: Colors.primary,
        buttonBorder: "rgba(37,50,117,0.16)",
        buttonText: Colors.primary,
        meshLight: "rgba(255,255,255,0.35)",
        meshDark: Colors.primaryAlpha06,
        shadow: Colors.whiteAlpha98,
        border: Colors.whiteAlpha14,
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
            styles.linearGradient,
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
              { backgroundColor: darkMode ?  rankAccent?.bgColor : rankAccent.color },
            ]}
          >
            <View style={styles.badgeInner}>
              {getCategoryIcon()}
              <Text style={[styles.categoryText, { color: darkMode ? rankAccent.color  : Colors.white}]}>
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
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
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

            {/* Founder Badge — `user` already carries isFounder (the Top Rated
                service reads full `users` docs), so this needs no extra read. */}
            <FounderBadgeById
              user={user}
              userId={(user as any)?.userId}
              size={RFPercentage(3.2)}
              style={styles.founderBadge}
            />
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
    color: Colors.white,
    textShadowColor: Colors.blackAlpha10,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: RFPercentage(1.8),
  },
  avatarWrapper: {
    // marginVertical: 10,
  },
  founderBadge: {
    position: "absolute",
    right: -RFPercentage(0.6),
    bottom: -RFPercentage(0.2),
  },
  avatarShadow: {
    padding: 3,
    backgroundColor: Colors.white3,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.whiteAlpha50,
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
    color: Colors.white,
  },
  userHandle: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    color: Colors.lastMsgTextColor,
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
    color: Colors.white,
  },
  linearGradient: { transform: [{ rotate: "45deg" }], top: -50 },
});

export default React.memo(TopRatedUserCard);
