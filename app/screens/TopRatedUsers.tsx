import {
  StyleSheet,
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
import { Ionicons, Feather, AntDesign } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { selectLocation } from "../redux/Actions";
import CustomNav from "../components/common/CustomNav";
import { LinearGradient } from "expo-linear-gradient";
import { HomeGradients } from "../config/Gradients";
import AvatarInitials from "../components/common/DefaultAvatars";
import FounderBadgeById from "../components/common/FounderBadgeById";

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
          color: Colors.yellow,
          bgColor: Colors.yellowAlpha10,
        };
      case "rising":
        return {
          icon: "rocket",
          text: t("profileRank.txt4"),
          color: Colors.teal2,
          bgColor: Colors.green5,
        };
      default:
        return {
          icon: "leaf",
          text: t("profileRank.txt3"),
          color: Colors.indigo,
          bgColor: Colors.indigoLight,
        };
    }
  };

  const UserCard = ({ user }: any) => {
    const badge = getBadgeInfo(user.type);
    const isDark = theme.mode === "dark";

    // Same soft brand surface as the home screen top-rated cards
    const cardGradient = isDark
      ? HomeGradients.topRatedBrandDark
      : HomeGradients.topRatedBrand;
    const ui = {
      cardBorder: isDark ? Colors.whiteAlpha10 : Colors.primaryAlpha10,
      softFill: isDark ? Colors.sectionBgDark : Colors.loaderLightOverlay,
      divider: isDark ? Colors.whiteAlpha10 : Colors.primaryAlpha12,
      chevronBg: isDark ? Colors.whiteAlpha08 : Colors.heroStatsLabel,
    };

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate("TopRatedUserProfile", {
            user: user.originalData || user,
            applier: false,
            postRequest: {},
          })
        }
        style={[styles.cardContainer, { borderColor: ui.cardBorder }]}
      >
        <LinearGradient
          colors={cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardSurface}
        >
          <View style={styles.cardHeader}>
            <View style={styles.avatarWrapper}>
              {user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <AvatarInitials name={user.userName} style={styles.avatar} />
              )}

              {/* Founder Badge — originalData is the full record from
                  fetchUsersWithTaskStats, which carries isFounder. */}
              <FounderBadgeById
                user={user.originalData}
                userId={user.id}
                size={RFPercentage(2.6)}
                style={styles.founderBadge}
              />
            </View>

            <View style={styles.headerInfo}>
              <View
                style={[
                  styles.badgeTag,
                  { backgroundColor: isDark ? badge.bgColor : badge.color },
                ]}
              >
                <Ionicons
                  name={badge.icon as any}
                  size={10}
                  color={isDark ? badge.color : Colors.white}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: isDark ? badge.color : Colors.white },
                  ]}
                  numberOfLines={1}
                >
                  {badge.text}
                </Text>
              </View>

              <View>
                <Text
                  style={[
                    styles.userName,
                    { color: isDark ? Colors.white : theme.heading },
                  ]}
                  numberOfLines={1}
                >
                  {user.userName}
                </Text>
              </View>
            </View>

            <View
              style={[styles.chevronChip, { backgroundColor: ui.chevronBg }]}
            >
              <Feather
                name="chevron-right"
                size={18}
                color={isDark ? Colors.white : theme.darkGrey}
              />
            </View>
          </View>

          <View style={[styles.statsStrip, { backgroundColor: ui.softFill }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: theme.heading }]}>
                {user.activeTasks}
              </Text>
              <Text style={[styles.statLab, { color: theme.darkGrey }]}>
                {t("profileRank.txt6")}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: ui.divider }]} />
            <View style={styles.statBox}>
              <Text
                style={[styles.statVal, { color: theme.heading }]}
                numberOfLines={1}
              >
                {user.completedTasks}
              </Text>
              <Text
                style={[styles.statLab, { color: theme.darkGrey }]}
                numberOfLines={1}
              >
                {t("profileRank.txt7")}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: ui.divider }]} />
            <View style={styles.statBox}>
              <Text
                style={[styles.statVal, { color: theme.heading }]}
                numberOfLines={1}
              >
                {user.successRate}%
              </Text>
              <Text
                style={[styles.statLab, { color: theme.darkGrey }]}
                numberOfLines={1}
              >
                {t("profileRank.txt31")}
              </Text>
            </View>
          </View>

          {user.distance && (
            <View style={styles.distRow}>
              <Ionicons
                name="location-outline"
                size={12}
                color={isDark ? Colors.darkGrey : Colors.primary}
              />
              <Text
                style={[
                  styles.distText,
                  { color: isDark ? Colors.darkGrey : Colors.primary },
                ]}
              >
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
          backgroundColor={theme.mode === "dark" ? Colors.hom2 : Colors.tabsBackgroundLight}
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
                  borderColor: theme.mode === "dark" ? Colors.greyDark2 : Colors.white6,
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
                color={!useCustomLocation ? Colors.white : theme.grey}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: !useCustomLocation ? Colors.white : theme.grey },
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
                  borderColor: theme.mode === "dark" ? Colors.greyDark2 : Colors.white6,
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
                color={useCustomLocation ? Colors.white : theme.grey}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: useCustomLocation ? Colors.white : theme.grey },
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
                  color={Colors.white}
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
            contentContainerStyle={styles.scrollViewContentContainer}
          >
            {["all", "pro", "rising", "beginner"].map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => setFilter(v)}
                style={[
                  styles.chip,
                  {
                    borderColor:
                      theme.mode === "dark" ? Colors.greyDark2 : Colors.white6,
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
                    { color: filter === v ? Colors.white : theme.grey },
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
              <ActivityIndicator size="large" color={theme.darkGrey} />
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
    borderColor: Colors.white6,
    gap: 6,
  },
  tabText: { fontSize: 14, fontFamily: "Poppins_500Medium" },
  chip: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.white6,
  },
  chipText: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
  listSection: { paddingHorizontal: 16, marginTop: 20 },
  resultCount: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    marginBottom: 15,
  },

  // Card UI (modern minimal)
  cardContainer: {
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardSurface: {
    padding: 16,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  avatarWrapper: {
    position: "relative",
  },
  founderBadge: {
    position: "absolute",
    right: -RFPercentage(0.5),
    bottom: -RFPercentage(0.4),
  },
  avatar: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
  },
  headerInfo: { marginLeft: 12,  flex:1 },
  userName: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    top: 2,
  },
 badgeTag: {
  flexDirection: "row",
  alignItems: "center",
  alignSelf: "flex-start",   
  paddingHorizontal: 8,      
  paddingVertical: 3,
  borderRadius: 100,
  gap: 4,
  justifyContent: "center",
},
  badgeText: { fontSize: 10, fontFamily: "Poppins_700Bold", lineHeight:14 },
  memberSince: { fontSize: 11, fontFamily: "Poppins_400Regular", marginTop: 4 },
  chevronChip: {
    width: RFPercentage(3.6),
    height: RFPercentage(3.6),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 0,
  },

  statsStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: RFPercentage(1.2),
    paddingHorizontal: RFPercentage(1),
  },
  statBox: { alignItems: "center", flex: 1, paddingHorizontal: 5 },
  statVal: {
    fontSize: RFPercentage(1.8),
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
  },
  statLab: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 1,
  },
  divider: { width: 1, height: 22 },

  distRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
  },
  distText: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  center: { alignItems: "center", justifyContent: "center", marginTop: 40 },
  emptyText: { marginTop: 10, fontSize: 14, fontFamily: "Poppins_400Regular" },
  scrollViewContentContainer: { gap: 8 },
});

export default TopRatedUsers;
