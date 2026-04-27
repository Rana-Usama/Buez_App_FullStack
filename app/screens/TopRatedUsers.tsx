import {
  StyleSheet,
  Platform,
  View,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useAppTheme } from "../contexts/themeContext";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useTranslation } from "react-i18next";
import InputField from "../components/common/AuthInputField";
import { fetchUsersWithTaskStats } from "../services/Review.service";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { Ionicons, Feather, AntDesign } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { selectLocation } from "../redux/Actions";
import CustomNav from "../components/common/CustomNav";
import { LinearGradient } from "expo-linear-gradient";
import { TopRatedUserGradients } from "../config/Gradients";
import AvatarInitials from "../components/common/DefaultAvatars";

type ApiUser = {
  userId: string;
  name: string;
  profileImage?: string;
  memberSince?: string;
  activeCount?: number;
  completedCount?: number;
  category?: string;
  distance?: number;
};

const TopRatedUsers = ({ navigation }: any) => {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const selectedLocation = useSelector((state: any) => state.location);

  const [searchQuery, setSearchQuery] = useState("");
  const [inputField, SetInputField] = useState([
    { placeholder: `${t("profileRank.txt11")}`, value: "" },
  ]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [useCustomLocation, setUseCustomLocation] = useState(false);

  // --- Logic (Kept Original) ---
  const handleChange = (text, i) => {
    const tmp = [...inputField];
    tmp[i].value = text;
    SetInputField(tmp);
    setSearchQuery(text);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const customLocation =
          useCustomLocation && selectedLocation?.latitude2
            ? {
                latitude: selectedLocation.latitude2,
                longitude: selectedLocation.longitude2,
              }
            : null;

        const apiUsers = (await fetchUsersWithTaskStats(
          customLocation,
        )) as ApiUser[];

        const mappedUsers = apiUsers.map((user, index) => ({
          id: user.userId || `user-${index}`,
          userName: user.name || "Unknown User",
          profileImage: user.profileImage || null,
          memberSince: user.memberSince,
          activeTasks: user.activeCount || 0,
          completedTasks: user.completedCount || 0,
          successRate: calculateSuccessRate(user),
          type: mapCategoryToType(user.category),
          rating: 4.5 + user.completedCount * 0.01,
          distance: user.distance || null,
          originalData: user,
        }));

        setUsers(mappedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [useCustomLocation, selectedLocation]);

  const calculateSuccessRate = (user) => {
    const totalTasks = (user.activeCount || 0) + (user.completedCount || 0);
    if (totalTasks === 0) return 0;

    if (user.reviews?.length > 0) {
      const platformAverageRating = 4.0;
      const platformWeight = 5;
      const userTotalRating = user.reviews?.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      const userReviewCount = user.reviews?.length;
      const bayesianRating =
        (userTotalRating + platformAverageRating * platformWeight) /
        (userReviewCount + platformWeight);
      return Math.min(100, Math.round((bayesianRating / 5) * 100));
    }
    const completionRate = (user.completedCount || 0) / totalTasks;
    return Math.max(0, Math.min(100, Math.round(completionRate * 0.7 * 100)));
  };

  const mapCategoryToType = (category) => {
    switch (category) {
      case "Top Rated":
        return "pro";
      case "Rising Talent":
        return "rising";
      default:
        return "beginner";
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.userName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    let matchesFilter = filter === "all" || user.type === filter;
    return matchesSearch && matchesFilter;
  });

  const getBadgeInfo = (type) => {
    switch (type) {
      case "pro":
        return {
          icon: "diamond",
          text: t("profileRank.txt5"),
          color: "#bfa824ff",
          bgColor: "rgba(255, 215, 0, 0.1)",
        };
      case "rising":
        return {
          icon: "rocket",
          text: t("profileRank.txt4"),
          color: "#79b7b0ff",
          bgColor: "#71a5821a",
        };
      default:
        return {
          icon: "star",
          text: t("profileRank.txt3"),
          color: "#b697d1ff",
          bgColor: "#d3c2e2ff",
        };
    }
  };

  const UserCard = ({ user }) => {
    const badge = getBadgeInfo(user.type);
    const getUserCardGradient = (
      type: "pro" | "rising" | "beginner",
      isDark: boolean,
    ) => {
      const mode = isDark ? "dark" : "light";

      switch (type) {
        case "pro":
          return TopRatedUserGradients.pro[mode];
        case "rising":
          return TopRatedUserGradients.rising[mode];
        case "beginner":
          return TopRatedUserGradients.beginner[mode];
        default:
          return TopRatedUserGradients.default[mode];
      }
    };

    const cardGradient = getUserCardGradient(user.type, theme.mode === "dark");

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("TopRatedUserProfile", {
            user: user.originalData || user,
            applier: false,
            postRequest: {},
          })
        }
        style={[
          styles.cardContainer,
          { shadowColor: cardGradient[1] },
          { borderColor: cardGradient[0] },
        ]}
      >
        <LinearGradient
          colors={cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientWrapper}
        >
          <LinearGradient
            colors={[
              theme.mode === "dark"
                ? "rgba(57, 51, 51, 0.4)"
                : "rgba(255, 255, 255, 1)",
              "transparent",
            ]}
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ rotate: "45deg" }], top: -50 },
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          {/* MESH OVERLAY 2 (Shadow Depth) */}
          <LinearGradient
            colors={
              theme.mode === "dark"
                ? ["transparent", "rgba(0,0,0,0.15)"]
                : ["rgba(245, 246, 255, 0.12)", "rgba(241, 241, 255, 1)"]
            }
            style={StyleSheet.absoluteFill}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <View style={styles.cardHeader}>
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <AvatarInitials name={user.userName} style={styles.avatar} />
            )}

            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                {/* Added shadow to text for better legibility on gradients */}
                <Text
                  style={[
                    styles.userName,
                    styles.textShadow,
                    {
                      color:
                        theme.mode === "dark" ? Colors.white : Colors.primary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {user.userName}
                </Text>
                <View
                  style={[styles.badgeTag, { backgroundColor: badge.bgColor }]}
                >
                  <Ionicons
                    name={badge.icon as any}
                    size={10}
                    color={badge.color}
                  />
                  <Text style={[styles.badgeText, { color: badge.color }]}>
                    {`  `}
                    {badge.text}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.memberSince,
                  {
                    color:
                      theme.mode === "dark"
                        ? "rgba(248, 249, 255, 1)"
                        : "rgba(109, 110, 118, 1)",
                  },
                ]}
              >
                {t("profileRank.txt9")} {user.memberSince}
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={20}
              color={theme.mode === "dark" ? "#fff" : Colors.lightGrey}
            />
          </View>

          <View style={[styles.statsIslandMesh]}>
            <View style={styles.statBox}>
              <Text style={[styles.statValMesh, { color: theme.grey }]}>
                {user.activeTasks}
              </Text>
              <Text style={[styles.statLabMesh, { color: theme.darkGrey }]}>
                {t("profileRank.txt6")}
              </Text>
            </View>
            <View style={[styles.divider]} />
            <View style={styles.statBox}>
              <Text
                style={[styles.statValMesh, { color: theme.grey }]}
                numberOfLines={1}
              >
                {user.completedTasks}
              </Text>
              <Text
                style={[styles.statLabMesh, { color: theme.darkGrey }]}
                numberOfLines={1}
              >
                {t("profileRank.txt7")}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text
                style={[styles.statValMesh, { color: theme.grey }]}
                numberOfLines={1}
              >
                {user.successRate}%
              </Text>
              <Text
                style={[styles.statLabMesh, { color: theme.darkGrey }]}
                numberOfLines={1}
              >
                {t("profileRank.txt31")}
              </Text>
            </View>
          </View>

          {user.distance && (
            <View style={styles.distRow}>
              <Ionicons name="location-outline" size={12} color="#fff" />
              <Text style={[styles.distText, { color: "#fff" }]}>
                {user.distance} km away
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />

      <CustomNav title={t("profileRank.txt1")} showBack={true} />

      <View style={styles.topStickyHeader}>
        <InputField
          placeholder={inputField[0].placeholder}
          placeholderColor={theme.grey}
          height={RFPercentage(6)}
          backgroundColor={theme.mode === "dark" ? "#131214ff" : "#F1F3F5"}
          borderWidth={0}
          borderRadius={14}
          color={theme.heading}
          handleFeild={(text) => handleChange(text, 0)}
          value={inputField[0].value}
          icon={true}
          fontSize={RFPercentage(1.7)}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Location Tabs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.heading }]}>
            {t("profileRank.txt42")}
          </Text>
          <View style={styles.tabRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tab,
                {
                  borderColor: theme.mode === "dark" ? "#22282dff" : "#E9ECEF",
                },
                !useCustomLocation && {
                  backgroundColor: Colors.primary,
                  borderColor: Colors.primary,
                },
              ]}
              onPress={() => {
                setUseCustomLocation(false);
                dispatch(selectLocation(null));
              }}
            >
              <Ionicons
                name="navigate"
                size={16}
                color={!useCustomLocation ? "#FFF" : theme.grey}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: !useCustomLocation ? "#FFF" : theme.grey },
                ]}
              >
                {t("profileRank.txt43")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.tab,
                {
                  borderColor: theme.mode === "dark" ? "#22282dff" : "#E9ECEF",
                },
                useCustomLocation && {
                  backgroundColor: Colors.primary,
                  borderColor: Colors.primary,
                },
              ]}
              onPress={() => {
                setUseCustomLocation(true);
                navigation.navigate("Location", { home: true });
              }}
            >
              <Ionicons
                name="map"
                size={16}
                color={useCustomLocation ? "#FFF" : theme.grey}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: useCustomLocation ? "#FFF" : theme.grey },
                ]}
                numberOfLines={1}
              >
                {selectedLocation?.name2
                  ? selectedLocation.name2.length > 10
                    ? `${selectedLocation.name2.substring(0, 10)}...`
                    : selectedLocation.name2
                  : t("profileRank.txt44")}{" "}
              </Text>
              {selectedLocation?.name2 && useCustomLocation && (
                <AntDesign
                  name="closecircle"
                  size={14}
                  color="#FFF"
                  onPress={() => {
                    dispatch(selectLocation(null));
                    setUseCustomLocation(false);
                  }}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.heading }]}>
            {t("profileRank.txt38")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {["all", "pro", "rising", "beginner"].map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => setFilter(v)}
                style={[
                  styles.chip,
                  {
                    borderColor:
                      theme.mode === "dark" ? "#22282dff" : "#E9ECEF",
                  },
                  filter === v && {
                    backgroundColor: Colors.primary,
                    borderColor: Colors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: filter === v ? "#FFF" : theme.grey },
                  ]}
                >
                  {t(
                    `profileRank.txt${
                      v === "all"
                        ? "12"
                        : v === "pro"
                          ? "13"
                          : v === "rising"
                            ? "14"
                            : "15"
                    }`,
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* List Section */}
        <View style={styles.listSection}>
          <Text style={[styles.resultCount, { color: theme.grey }]}>
            {filteredUsers.length} {t("profileRank.txt17")}{" "}
            {t("profileRank.txt18")}
          </Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => <UserCard key={user.id} user={user} />)
          ) : (
            <View style={styles.center}>
              <Ionicons name="search-outline" size={50} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.grey }]}>
                {t("profileRank.txt20")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topStickyHeader: { padding: 16, paddingBottom: 8 },
  scrollContent: { paddingBottom: 100 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 12,
  },
  tabRow: { flexDirection: "row", gap: 10 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    gap: 6,
  },
  tabText: { fontSize: 14, fontFamily: "Poppins_500Medium" },
  chip: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  chipText: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  listSection: { paddingHorizontal: 16, marginTop: 20 },
  resultCount: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    marginBottom: 15,
  },

  // Card UI
  userCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatar: { width: RFPercentage(6), height: RFPercentage(6), borderRadius:RFPercentage(1.5) },
  headerInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },

  badgeText: { fontSize: 9, fontFamily: "Poppins_700Bold" },
  memberSince: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 5 },

  statsIsland: {
    flexDirection: "row",
    borderRadius: 14,
    paddingVertical: 12,
    justifyContent: "space-around",
    alignItems: "center",
  },
  statBox: { alignItems: "center", flex: 1, paddingHorizontal: 5 },
  statVal: { fontSize: 14, fontFamily: "Poppins_700Bold" },
  statLab: {
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  divider: { width: 1, height: 20, backgroundColor: "#DEE2E6" },

  distRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
  },
  distText: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: "Poppins_600SemiBold",
  },
  center: { alignItems: "center", justifyContent: "center", marginTop: 40 },
  emptyText: { marginTop: 10, fontSize: 14, fontFamily: "Poppins_400Regular" },

  cardContainer: {
    marginBottom: 15,
    borderRadius: 16,
    // elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
  },
  gradientWrapper: {
    padding: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  textShadow: {
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsIslandMesh: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(173, 173, 184, 0.23)",
    borderRadius: RFPercentage(1.5),
    paddingVertical: RFPercentage(1),
    paddingHorizontal: RFPercentage(1),
  },
  statValMesh: {
    fontSize: RFPercentage(1.8),
    textAlign: "center",
    color: "white",
    fontFamily: "Poppins_600SemiBold",
  },
  statLabMesh: {
    fontSize: RFPercentage(1.3),
    color: "white",
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  badgeTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
});

export default TopRatedUsers;
