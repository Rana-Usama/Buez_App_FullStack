import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { RFPercentage } from "react-native-responsive-fontsize";
import { doc, onSnapshot } from "firebase/firestore";
import { FIREBASE_DB } from "../../firebaseConfig";
import { createNewChat } from "../services/Chat.service";
import { useAppTheme } from "../contexts/themeContext";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { cachedTranslate } from "../utils/cachedTranslations";
import MemberRow from "../components/group/MemberRow";

interface Member {
  userId: string;
  userName: string;
  profileImage?: string;
  token?: string;
  role: "owner" | "worker";
  joinedAt?: string;
}

interface GroupData {
  groupId: string;
  taskId: string;
  taskType: string;
  description: string;
  customTaskTitle?: string;
  taskOwnerId: string;
  members: Member[];
  createdAt?: any;
  lastMessage?: {
    text: string;
    senderName: string;
  };
}

const GroupDetails = ({ navigation, route }: any) => {
  const { theme } = useAppTheme();
  const { groupChatId, currentUserId, currentUserName } = route.params;
  const { t } = useTranslation();
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chattingWith, setChattingWith] = useState<string | null>(null);

  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedDescription, setTranslatedDescription] = useState("");
  const [translatedLastMessage, setTranslatedLastMessage] = useState("");

  // Header animation
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const iconScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Real-time group listener
  useEffect(() => {
    if (!groupChatId) return;
    const ref = doc(FIREBASE_DB, "groupChats", groupChatId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setGroupData({ groupId: snap.id, ...snap.data() } as GroupData);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [groupChatId]);

  // ── Translate dynamic text whenever groupData changes ─────────────────
  useEffect(() => {
    if (!groupData) return;

    // Translate group title
    const rawTitle =
      groupData.taskType === "Other"
        ? groupData.customTaskTitle || ""
        : groupData.taskType || "";

    if (rawTitle) {
      cachedTranslate(rawTitle).then((translated) =>
        setTranslatedTitle(translated || t("taskApplicants.group")),
      );
    } else {
      setTranslatedTitle(t("taskApplicants.group"));
    }

    // Translate description
    if (groupData.description) {
      cachedTranslate(groupData.description).then((translated) =>
        setTranslatedDescription(translated || groupData.description),
      );
    } else {
      setTranslatedDescription("");
    }

    // Translate last message text
    if (groupData.lastMessage?.text) {
      cachedTranslate(groupData.lastMessage.text).then((translated) =>
        setTranslatedLastMessage(translated || groupData.lastMessage.text),
      );
    } else {
      setTranslatedLastMessage("");
    }
  }, [groupData]);

  console.log("Group data updated:", translatedLastMessage);

  const groupTitle =
    groupData?.taskType === "Other"
      ? groupData?.customTaskTitle || t("taskApplicants.group")
      : groupData?.taskType || t("taskApplicants.group");

  const description = groupData?.description || "";

  const owners = groupData?.members?.filter((m) => m.role === "owner") || [];
  const workers = groupData?.members?.filter((m) => m.role === "worker") || [];

  // memoize owners/workers for stable references (helps FlatList and memoised items)
  const ownersMemo = React.useMemo(
    () => owners,
    [owners.length, JSON.stringify(owners.map((o) => o.userId))],
  );
  const workersMemo = React.useMemo(
    () => workers,
    [workers.length, JSON.stringify(workers.map((w) => w.userId))],
  );

  // ── Start 1:1 chat with a member ────────────────────────────────────────
  const handleMemberChat = async (member: Member) => {
    if (chattingWith) return;
    setChattingWith(member.userId);
    try {
      const chatId = await createNewChat(currentUserId, member.userId);
      navigation.navigate("Chat", {
        chatId,
        senderId: currentUserId,
        senderName: currentUserName,
        receiver: {
          userId: member.userId,
          userName: member.userName,
          profileImage: member.profileImage || "",
          token: member.token || "",
        },
      });
    } catch (e) {
      console.error("Error starting chat:", e);
    } finally {
      setChattingWith(null);
    }
  };

  // stable callback passed to MemberRow (avoid re-creating on each render)
  const handleMemberChatCb = React.useCallback(
    (m: Member) => handleMemberChat(m),
    [currentUserId, currentUserName, chattingWith],
  );

  console.log("workersMemo...........", workersMemo);
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.white }]}>
        <ActivityIndicator size="large" color={theme.mode === "dark" ? Colors.darkGrey : Colors.primary} />
        <Text style={[styles.loadingText, { color: theme.mode === "dark" ? Colors.darkGrey : Colors.primary }]}>
          Loading group info...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <LinearGradient
          colors={
            theme.mode === "dark"
              ? Colors.heroGradientDark
              : Colors.heroGradientLight
          }
          style={styles.heroGradient}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>

          {/* Group icon */}
          <Animated.View
            style={[styles.heroIconWrap, { transform: [{ scale: iconScale }] }]}
          >
            <LinearGradient
              colors={
                theme.mode === "dark"
                  ? Colors.heroIconGradientDark
                  : Colors.heroIconGradientLight
              }
              style={styles.heroIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="people" size={RFPercentage(5)} color="#FFF" />
            </LinearGradient>

            {/* Member count bubble */}
            <View style={styles.memberCountBubble}>
              <Text style={styles.memberCountText}>
                {groupData?.members?.length || 0}
              </Text>
            </View>
          </Animated.View>

          {/* Title & subtitle */}
          <Animated.View
            style={{
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
              alignItems: "center",
            }}
          >
            <View style={styles.heroCategoryRow}>
              <View style={styles.heroCategoryBadge}>
                <MaterialCommunityIcons
                  name="tag-outline"
                  size={RFPercentage(1.5)}
                  color={Colors.categoryBadgeText}
                />
                <Text style={styles.heroCategoryText}>{translatedTitle}</Text>
              </View>
            </View>
            <Text style={styles.heroTitle} numberOfLines={1}>
              Broadcast : {translatedTitle || t("taskApplicants.group")}
            </Text>

            {description && (
              <Text
                numberOfLines={2}
                style={[
                  styles.lastMsgText,
                  {
                    textAlign: "center",
                    color:
                      theme.mode === "dark"
                        ? Colors.lastMsgTextColor
                        : Colors.primary,
                    fontFamily: "Poppins_500Medium",
                    maxWidth: "90%",
                  },
                ]}
              >
                {translatedDescription}
              </Text>
            )}

            {translatedLastMessage ? (
              <View style={styles.lastMsgWrap}>
                <Feather
                  name="message-circle"
                  size={RFPercentage(2)}
                  color={Colors.lastMsgTextColor}
                />
                <Text style={styles.lastMsgText} numberOfLines={1}>
                  {groupData?.lastMessage?.senderName}: {translatedLastMessage}
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Stats row */}
          <Animated.View style={[styles.heroStats, { opacity: headerFade }]}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>
                {groupData?.members?.length || 0}
              </Text>
              <Text style={styles.heroStatLabel}>
                {" "}
                {t("taskApplicants.member")}
              </Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{workers.length}</Text>
              <Text style={styles.heroStatLabel}>
                {" "}
                {t("taskApplicants.helper")}
              </Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatValue}>{owners.length}</Text>
              <Text style={styles.heroStatLabel}>
                {t("taskApplicants.owner")}
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── Members Sections ────────────────────────────────────────── */}
        <View style={styles.sectionsWrap}>
          {/* Owner section */}
          {owners.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={[Colors.gold, Colors.orange]}
                  style={styles.sectionIconWrap}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={RFPercentage(1.8)}
                    color="#FFF"
                  />
                </LinearGradient>
                <Text style={[styles.sectionTitle, { color: theme.heading }]}>
                  {t("taskApplicants.task")}
                </Text>
                <View
                  style={[
                    styles.sectionCount,
                    { backgroundColor: Colors.gold20 },
                  ]}
                >
                  <Text
                    style={[styles.sectionCountText, { color: Colors.orange }]}
                  >
                    {owners.length}
                  </Text>
                </View>
              </View>

              <FlatList
                data={ownersMemo}
                keyExtractor={(it) => it.userId}
                renderItem={({ item, index }) => (
                  <MemberRow
                    member={item}
                    index={index}
                    currentUserId={currentUserId}
                    onChat={handleMemberChatCb}
                    theme={theme}
                  />
                )}
                scrollEnabled={false}
                removeClippedSubviews
                initialNumToRender={8}
                windowSize={5}
              />
            </View>
          )}

          {/* Divider */}
          {owners.length > 0 && workers.length > 0 && (
            <View
              style={[
                styles.sectionDivider,
                {
                  backgroundColor:
                    theme.mode === "dark"
                      ? Colors.infoFooterBorderDark
                      : Colors.infoFooterBorderLight,
                },
              ]}
            />
          )}

          {/* Workers section */}
          {workers?.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.sectionIconWrap,
                    { backgroundColor: Colors.primary },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="hammer-wrench"
                    size={RFPercentage(1.8)}
                    color="#FFF"
                  />
                </View>
                <Text style={[styles.sectionTitle, { color: theme.heading }]}>
                  {t("taskApplicants.helper")}
                </Text>
                <View
                  style={[
                    styles.sectionCount,
                    {
                      backgroundColor:
                        theme.mode === "dark"
                          ? Colors.primary + "40"
                          : Colors.primary + "20",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.sectionCountText,
                      {
                        color:
                          theme.mode === "dark" ? Colors.white : Colors.primary,
                      },
                    ]}
                  >
                    {workers?.length}
                  </Text>
                </View>
              </View>

              <FlatList
                data={workersMemo}
                keyExtractor={(it) => it.userId}
                renderItem={({ item, index }) => (
                  <MemberRow
                    member={item}
                    index={owners.length + index}
                    currentUserId={currentUserId}
                    onChat={handleMemberChatCb}
                    theme={theme}
                  />
                )}
                scrollEnabled={false}
                removeClippedSubviews
                initialNumToRender={8}
                windowSize={5}
              />
            </View>
          )}
        </View>

        {/* ── Info Footer ─────────────────────────────────────────────── */}
        <View
          style={[
            styles.infoFooter,
            {
              backgroundColor:
                theme.mode === "dark"
                  ? Colors.infoFooterBgDark
                  : Colors.infoFooterBgLight,
              borderColor:
                theme.mode === "dark"
                  ? Colors.infoFooterBorderDark
                  : Colors.infoFooterBorderLight,
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={RFPercentage(2)}
            color={theme.darkGrey}
          />
          <Text style={[styles.infoFooterText, { color: theme.darkGrey }]}>
            {t("taskApplicants.exp")}
          </Text>
        </View>
      </ScrollView>

      {/* Loading overlay when starting a chat */}
      {chattingWith && (
        <View style={styles.chatLoadingOverlay}>
          <View
            style={[styles.chatLoadingCard, { backgroundColor: theme.white }]}
          >
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={[styles.chatLoadingText, { color: theme.heading }]}>
              Opening chat...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { paddingBottom: RFPercentage(6) },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: RFPercentage(1.5),
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.5),
  },

  // ── Hero ────────────────────────────────────────────────────────────────
  heroGradient: {
    paddingTop: Platform.OS === "android" ? RFPercentage(8) : RFPercentage(10),
    paddingBottom: RFPercentage(4),
    paddingHorizontal: RFPercentage(3),
    alignItems: "center",
    borderBottomLeftRadius: RFPercentage(3),
    borderBottomRightRadius: RFPercentage(3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    // height:RFPercentage(45)
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "android" ? RFPercentage(6) : RFPercentage(7),
    left: RFPercentage(3),
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(100),
    backgroundColor: Colors.backBtnBg,
    justifyContent: "center",
    alignItems: "center",
  },
  heroIconWrap: {
    position: "relative",
    marginBottom: RFPercentage(2.5),
  },
  heroIconGradient: {
    width: RFPercentage(13),
    height: RFPercentage(13),
    borderRadius: RFPercentage(100),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  memberCountBubble: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.memberBubble,
    borderRadius: RFPercentage(100),
    width: RFPercentage(3.5),
    height: RFPercentage(3.5),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  memberCountText: {
    color: Colors.primary,
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_700Bold",
  },
  heroTitle: {
    color: Colors.heroTitleColor,
    fontSize: RFPercentage(2.3),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginBottom: RFPercentage(1),
    paddingHorizontal: RFPercentage(2),
  },
  heroCategoryRow: {
    flexDirection: "row",
    marginBottom: RFPercentage(1.2),
  },
  heroCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.5),
    backgroundColor: Colors.categoryBadgeBg,
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(2),
  },
  heroCategoryText: {
    color: Colors.categoryBadgeText,
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
  },
  lastMsgWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(0.6),
    marginBottom: RFPercentage(2),
    maxWidth: "80%",
    marginTop: RFPercentage(1),
  },
  lastMsgText: {
    color: Colors.lastMsgTextColor,
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: Colors.heroStatsBg,
    borderRadius: RFPercentage(2),
    paddingVertical: RFPercentage(1.8),
    paddingHorizontal: RFPercentage(3),
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },
  heroStatItem: { alignItems: "center" },
  heroStatValue: {
    color: Colors.heroTitleColor,
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_700Bold",
  },
  heroStatLabel: {
    color: Colors.heroStatsLabel,
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
  },
  heroStatDivider: {
    width: 1,
    height: RFPercentage(3.5),
    backgroundColor: Colors.heroStatsDivider,
  },

  // ── Sections ────────────────────────────────────────────────────────────
  sectionsWrap: {
    paddingHorizontal: RFPercentage(2.5),
    paddingTop: RFPercentage(3),
  },
  section: {
    marginBottom: RFPercentage(1),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1),
    marginBottom: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(0.5),
  },
  sectionIconWrap: {
    width: RFPercentage(3.8),
    height: RFPercentage(3.8),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    // flex: 1,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
  },
  sectionCount: {
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.3),
    borderRadius: RFPercentage(1),
  },
  sectionCountText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_700Bold",
  },
  sectionDivider: {
    height: 1,
    marginHorizontal: RFPercentage(0.5),
    marginVertical: RFPercentage(2),
    borderRadius: 1,
  },

  // ── Member Row ──────────────────────────────────────────────────────────
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
  memberInfo: {
    flex: 1,
    gap: RFPercentage(0.4),
  },
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

  // ── Footer ──────────────────────────────────────────────────────────────
  infoFooter: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: RFPercentage(1),
    marginHorizontal: RFPercentage(2.5),
    marginTop: RFPercentage(2),
    padding: RFPercentage(2),
    borderRadius: RFPercentage(2),
    borderWidth: 1,
  },
  infoFooterText: {
    flex: 1,
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
  },

  // ── Chat loading overlay ─────────────────────────────────────────────────
  chatLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.chatLoadingBgOverlay,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  chatLoadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1.5),
    paddingVertical: RFPercentage(2),
    paddingHorizontal: RFPercentage(3),
    borderRadius: RFPercentage(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  chatLoadingText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
  },
});

export default GroupDetails;
