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
  const getCardGradient = () => {
    const dark = darkMode;
    switch (user.category) {
      case "Top Rated":
        return dark ? HomeGradients.topRatedDark : HomeGradients.topRated;
      case "Rising Talent":
        return dark
          ? HomeGradients.risingTalentDark
          : HomeGradients.risingTalent;
      case "Beginner":
        return dark ? HomeGradients.beginnerDark : HomeGradients.beginner;
      default:
        return dark ? HomeGradients.defaultCardDark : HomeGradients.defaultCard;
    }
  };

  const getCategoryIcon = () => {
    const icons = {
      "Top Rated": { name: "trophy", color: "#FFD700" },
      "Rising Talent": { name: "trending-up", color: "#FF9800" },
      Beginner: { name: "leaf", color: "#4CAF50" },
    };
    const icon = icons[user.category] || { name: "person", color: "#FFF" };
    return (
      <Ionicons
        name={icon.name as any}
        size={RFPercentage(1.8)}
        color={icon.color}
      />
    );
  };

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

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.cardWrapper, { shadowColor: cardGradient[2] }]}
    >
      <LinearGradient
        colors={cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topRatedCard}
      >
        {/* Mesh Overlay 1 */}
        <LinearGradient
          colors={["rgba(255,255,255,0.4)", "transparent"]}
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ rotate: "45deg" }], top: -50 },
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Mesh Overlay 2 */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.15)"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.cardContent}>
          {/* Category Badge */}
          <View style={styles.categoryBadgeContainer}>
            <BlurView intensity={40} tint="dark" style={styles.blurBadge}>
              <View style={styles.badgeInner}>
                {getCategoryIcon()}
                <Text style={styles.categoryText}>{getCategoryText()}</Text>
              </View>
            </BlurView>
          </View>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarShadow}>
              <Image
                source={
                  user.profileImage ? { uri: user.profileImage } : Icons.dp
                }
                style={styles.avatar}
              />
            </View>
          </View>

          {/* Name & Handle */}
          <View style={styles.nameContainer}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name || "User"}
            </Text>
            <Text style={styles.userHandle}>
              @{user.name?.split(" ")[0]?.toLowerCase() || "user"}
            </Text>
          </View>

          {/* View Profile Button */}
          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <BlurView intensity={60} tint="light" style={styles.buttonBlur}>
              <Text style={styles.viewProfileText}>
                {t("profileRank.txt8")}
              </Text>
              <Ionicons name="chevron-forward-circle" size={18} color="#FFF" />
            </BlurView>
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

    // borderWidth: RFPercentage(0.1),
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
    borderRadius: 12,
    overflow: "hidden",
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
  },
  avatarWrapper: {
    marginVertical: 10,
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
  },
  userName: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_700Bold",
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
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 10,
  },
  buttonBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  viewProfileText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
    color: "#FFF",
  },
});

export default React.memo(TopRatedUserCard);
