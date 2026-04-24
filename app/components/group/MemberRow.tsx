import React, { memo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../../config/Colors";
import { useNavigation } from "@react-navigation/native";
import AvatarInitials from "../common/DefaultAvatars";

type Member = {
  userId: string;
  userName: string;
  profileImage?: string;
  token?: string;
  role: "owner" | "worker";
  joinedAt?: string;
};

type Props = {
  member: Member;
  index: number;
  currentUserId: string;
  onChat: (member: Member) => void;
  theme: any;
};

const MemberRow = ({ member, index, currentUserId, onChat, theme }: Props) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const navigation = useNavigation<any>();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOwner = member.role === "owner";
  const isSelf = member.userId === currentUserId;

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <View
        style={[
          styles.memberRow,
          {
            backgroundColor:
              theme.mode === "dark"
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.025)",
            borderColor:
              theme.mode === "dark"
                ? "rgba(255,255,255,0.07)"
                : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        <TouchableOpacity
          disabled={isSelf}
          onPress={() => {
            navigation.navigate("TopRatedUserProfile", {
              user: member,
              applier: false,
              postRequest: {},
            });
          }}
          activeOpacity={0.6}
          style={styles.memberAvatarWrap}
        >
          {member.profileImage ? (
            <Image
              source={{ uri: member.profileImage }}
              style={styles.memberAvatar}
            />
          ) : (
            <AvatarInitials
              name={member.userName}
              style={styles.memberAvatar}
            />
          )}

          <View style={styles.onlineDot} />
        </TouchableOpacity>

        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text
              style={[styles.memberName, { color: theme.heading }]}
              numberOfLines={1}
            >
              {member.userName}
              {isSelf && (
                <Text
                  style={{
                    color: theme.darkGrey,
                    fontFamily: "Poppins_400Regular",
                  }}
                >
                  {" "}
                  - you
                </Text>
              )}
            </Text>

            {isOwner ? (
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                style={styles.ownerBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={RFPercentage(1.3)}
                  color="#FFF"
                />
                <Text style={styles.ownerBadgeText}>Owner</Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.workerBadge,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.primary + "30"
                        : Colors.primary + "15",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="hammer-wrench"
                  size={RFPercentage(1.3)}
                  color={
                    theme.mode === "dark" ? Colors.darkGrey : Colors.primary
                  }
                />
                <Text
                  style={[
                    styles.workerBadgeText,
                    {
                      color:
                        theme.mode === "dark"
                          ? Colors.darkGrey
                          : Colors.primary,
                    },
                  ]}
                >
                  Helper
                </Text>
              </View>
            )}
          </View>

          {member.joinedAt && (
            <Text style={[styles.memberJoinedAt, { color: theme.darkGrey }]}>
              Joined{" "}
              {new Date(member.joinedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
            </Text>
          )}
        </View>

        {!isSelf && (
          <TouchableOpacity
            style={[
              styles.memberChatBtn,
              {
                backgroundColor:
                  theme.mode === "dark"
                    ? Colors.primary + "30"
                    : Colors.primary + "12",
              },
            ]}
            onPress={() => onChat(member)}
            activeOpacity={0.75}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={RFPercentage(2.2)}
              color={theme.mode === "dark" ? Colors.white : Colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.4),
    paddingHorizontal: RFPercentage(1.8),
    borderRadius: RFPercentage(2),
    borderWidth: 1,
    marginBottom: RFPercentage(1.1),
    gap: RFPercentage(1.2),
  },
  memberAvatarWrap: { position: "relative" },
  memberAvatar: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
  },
  memberAvatarFallback: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarInitial: {
    color: "#FFF",
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_700Bold",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: RFPercentage(1.3),
    height: RFPercentage(1.3),
    borderRadius: RFPercentage(100),
    backgroundColor: "#4CAF50",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  memberInfo: { flex: 1, gap: RFPercentage(0.4) },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.8),
    flexWrap: "wrap",
  },
  memberName: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
    flexShrink: 1,
  },
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.4),
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.25),
    borderRadius: RFPercentage(1),
  },
  ownerBadgeText: {
    color: "#FFF",
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_600SemiBold",
  },
  workerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.4),
    paddingHorizontal: RFPercentage(1),
    paddingVertical: RFPercentage(0.25),
    borderRadius: RFPercentage(1),
  },
  workerBadgeText: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_600SemiBold",
  },
  memberJoinedAt: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
  },
  memberChatBtn: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(1.5),
    justifyContent: "center",
    alignItems: "center",
  },
});

export default memo(MemberRow);
