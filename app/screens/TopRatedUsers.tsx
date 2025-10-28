import {
  StyleSheet,
  Platform,
  View,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useAppTheme } from "../contexts/themeContext";
import Nav from "../components/common/Nav";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useTranslation } from "react-i18next";
import InputField from "../components/common/AuthInputField";
import { fetchUsersWithTaskStats } from "../services/Review.service";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather,
  AntDesign,
} from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { selectLocation } from "../redux/Actions";

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
  const [filter, setFilter] = useState("all"); // 'all', 'pro', 'rising', 'normal'
  const [useCustomLocation, setUseCustomLocation] = useState(false);

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
        // Pass custom location if selected, otherwise use current location
        const customLocation =
          useCustomLocation && selectedLocation?.latitude2
            ? {
                latitude: selectedLocation.latitude2,
                longitude: selectedLocation.longitude2,
              }
            : null;

        const apiUsers = await fetchUsersWithTaskStats(customLocation);

        console.log(apiUsers);

        // Map API response to match your component structure
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
          // Include original API data for the profile screen
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

  // Helper function to calculate success rate
  const calculateSuccessRate = (user) => {
    const totalTasks = (user.activeCount || 0) + (user.completedCount || 0);
    if (totalTasks === 0) return 0;
    return Math.round((user.completedCount / totalTasks) * 100);
  };

  // Helper function to map API category to your type
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

    let matchesFilter = true;
    if (filter === "pro") {
      matchesFilter = user.type === "pro";
    } else if (filter === "rising") {
      matchesFilter = user.type === "rising";
    } else if (filter === "beginner") {
      matchesFilter = user.type === "beginner";
    }

    return matchesSearch && matchesFilter;
  });

  const getBadgeInfo = (type) => {
    switch (type) {
      case "pro":
        return {
          icon: "diamond",
          text: `${t("profileRank.txt5")}`,
          color: "#bfa824ff",
          bgColor: "rgba(255, 215, 0, 0.15)",
          borderColor: "rgba(255, 215, 0, 0.3)",
        };
      case "rising":
        return {
          icon: "rocket",
          text: `${t("profileRank.txt4")}`,
          color: "#FF9800",
          bgColor: "#FFF3E0",
          borderColor: "#FF9800",
        };
      case "beginner":
        return {
          icon: "star",
          text: `${t("profileRank.txt3")}`,
          color: Colors.primary,
          bgColor: Colors.primary + "15",
          borderColor: Colors.primary + "30",
        };
      default:
        return {
          icon: "star",
          text: `${t("profileRank.txt3")}`,
          color: Colors.primary,
          bgColor: Colors.primary + "15",
          borderColor: Colors.primary + "30",
        };
    }
  };

  const LocationSelector = () => (
    <View style={styles.locationSection}>
      <Text style={[styles.locationTitle, { color: theme.heading }]}>
        {t("profileRank.txt42")}
      </Text>
      <View style={styles.locationButtons}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.locationButton,
            !useCustomLocation && [
              styles.activeLocationButton,
              { backgroundColor: Colors.primary },
            ],
            { borderColor: theme.border },
          ]}
          onPress={() => {
            setUseCustomLocation(false);
            if (selectedLocation?.name2) {
              dispatch(selectLocation(null));
            }
          }}
        >
          <Ionicons
            name="location"
            size={RFPercentage(1.8)}
            color={!useCustomLocation ? Colors.white : theme.primary}
          />
          <Text
            style={[
              styles.locationButtonText,
              !useCustomLocation
                ? styles.activeLocationButtonText
                : { color: theme.darkGrey },
            ]}
          >
            {t("profileRank.txt43")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.locationButton,
            useCustomLocation && [
              styles.activeLocationButton,
              { backgroundColor: Colors.primary },
            ],
            { borderColor: theme.border },
          ]}
          onPress={() => {
            setUseCustomLocation(true);
            if (!selectedLocation?.name2) {
              navigation.navigate("Location", { home: true });
            }
          }}
        >
          <Ionicons
            name="map"
            size={RFPercentage(1.8)}
            color={useCustomLocation ? Colors.white : theme.primary}
          />
          <Text
            style={[
              styles.locationButtonText,
              useCustomLocation
                ? styles.activeLocationButtonText
                : { color: theme.darkGrey },
            ]}
          >
            {selectedLocation?.name2
              ? selectedLocation.name2.length > 12
                ? `${selectedLocation.name2.slice(0, 12)}...`
                : selectedLocation.name2
              : t("profileRank.txt44")}
          </Text>

          {selectedLocation?.name2 && useCustomLocation && (
            <TouchableOpacity
              style={styles.clearLocationButton}
              onPress={() => {
                dispatch(selectLocation(null));
                setUseCustomLocation(false);
              }}
            >
              <AntDesign
                name="closecircle"
                size={RFPercentage(1.5)}
                color={Colors.white}
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const UserCard = ({ user }) => {
    const badgeInfo = getBadgeInfo(user.type);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          navigation.navigate("TopRatedUserProfile", {
            user: user.originalData || user,
          });
        }}
        style={[
          styles.userCard,
          { backgroundColor: theme.white, borderColor: theme.border },
        ]}
      >
        <View style={styles.userInfoRow}>
          <View style={styles.avatarContainer}>
            <Image
              resizeMode="cover"
              source={user.profileImage ? { uri: user.profileImage } : Icons.dp}
              style={styles.avatar}
            />
          </View>

          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.userName, { color: theme.heading }]}
                numberOfLines={1}
              >
                {user.userName}
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: badgeInfo.bgColor,
                    borderColor: badgeInfo.borderColor,
                  },
                ]}
              >
                <Ionicons
                  name={badgeInfo.icon}
                  size={RFPercentage(1.2)}
                  color={badgeInfo.color}
                />
                <Text style={[styles.badgeText, { color: badgeInfo.color }]}>
                  {badgeInfo.text}
                </Text>
              </View>
            </View>

            <Text
              style={[styles.memberSince, { color: theme.grey }]}
              numberOfLines={1}
            >
              {t("profileRank.txt9")} {user.memberSince}
            </Text>

            {/* Distance Info */}
            {user.distance && (
              <View style={styles.distanceContainer}>
                <Ionicons
                  name="location-outline"
                  size={RFPercentage(1.2)}
                  color={theme.primary}
                />
                <Text style={[styles.distanceText, { color: theme.primary }]}>
                  {user.distance} km away
                </Text>
              </View>
            )}

            <View
              style={[
                styles.statsRow,
                {
                  backgroundColor:
                    theme.mode === "dark"
                      ? Colors.primary + "20"
                      : Colors.primary + "09",
                },
              ]}
            >
              <View style={styles.statItem}>
                <MaterialIcons
                  name="pending-actions"
                  size={RFPercentage(1.4)}
                  color={Colors.primary}
                />
                <Text
                  style={[styles.statValue, { color: theme.heading }]}
                  numberOfLines={1}
                >
                  {user.activeTasks}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.grey }]}
                  numberOfLines={1}
                >
                  {t("profileRank.txt6")}
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <FontAwesome5
                  name="check-circle"
                  size={RFPercentage(1.2)}
                  color="#45B356"
                />
                <Text style={[styles.statValue, { color: theme.heading }]}>
                  {user.completedTasks}
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.grey }]}
                  numberOfLines={1}
                >
                  {t("profileRank.txt7")}
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons
                  name="trending-up"
                  size={RFPercentage(1.4)}
                  color="#db952bff"
                />
                <Text
                  style={[styles.statValue, { color: theme.heading }]}
                  numberOfLines={1}
                >
                  {user.successRate}%
                </Text>
                <Text
                  style={[styles.statLabel, { color: theme.grey }]}
                  numberOfLines={1}
                >
                  {t("profileRank.txt10")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.arrowContainer}>
            <Feather
              name="chevron-right"
              size={RFPercentage(2)}
              color={theme.primary}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ title, value, isActive }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { borderColor: theme.border },
        isActive && [
          styles.activeFilterButton,
          { backgroundColor: Colors.primary },
        ],
      ]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          isActive ? styles.activeFilterButtonText : { color: theme.darkGrey },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
      />

      <Nav
        marginTop={RFPercentage(5)}
        leftLogo={false}
        navigation={navigation}
        title={t("profileRank.txt1")}
        dpNull
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.searchSection}>
          {inputField?.map((item, i) => (
            <View key={i} style={styles.inputFieldWrapper}>
              <InputField
                placeholder={item.placeholder}
                placeholderColor={theme.grey}
                height={RFPercentage(5.5)}
                backgroundColor={theme.white}
                borderWidth={1}
                borderColor={theme.border}
                secure={item.secure}
                borderRadius={RFPercentage(1.2)}
                color={theme.heading}
                fontSize={RFPercentage(1.6)}
                fontFamily={"Poppins_400Regular"}
                handleFeild={(text) => handleChange(text, i)}
                value={item.value}
                width={"100%"}
                icon="search"
                iconColor={theme.grey}
              />
            </View>
          ))}
        </View>

        {/* Location Selector */}
        <LocationSelector />

        <View style={styles.filterSection}>
          <Text style={[styles.filterTitle, { color: theme.heading }]}>
            {t("profileRank.txt38")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContainer}
          >
            <View style={styles.filterButtons}>
              <FilterButton
                title={t("profileRank.txt12")}
                value="all"
                isActive={filter === "all"}
              />
              <FilterButton
                title={t("profileRank.txt13")}
                value="pro"
                isActive={filter === "pro"}
              />
              <FilterButton
                title={t("profileRank.txt14")}
                value="rising"
                isActive={filter === "rising"}
              />
              <FilterButton
                title={t("profileRank.txt15")}
                value="beginner"
                isActive={filter === "beginner"}
              />
            </View>
          </ScrollView>
        </View>

        <View style={styles.resultsSection}>
          <Text style={[styles.resultsText, { color: theme.darkGrey }]}>
            {filteredUsers.length}{" "}
            {filteredUsers.length === 1
              ? `${t("profileRank.txt16")}`
              : `${t("profileRank.txt17")}`}{" "}
            {t("profileRank.txt18")}
            {useCustomLocation && selectedLocation?.name2 && (
              <Text
                style={{
                  color: Colors.primary,
                  fontFamily: "Poppins_600SemiBold",
                }}
              >
                {" "}
                {`${t("profileRank.txt48")}`} {selectedLocation.name2}
              </Text>
            )}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.loadingText, { color: theme.darkGrey }]}>
              {t("profileRank.txt19")}
            </Text>
          </View>
        ) : filteredUsers.length > 0 ? (
          <View style={styles.usersList}>
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={RFPercentage(8)}
              color={theme.grey}
            />
            <Text style={[styles.emptyTitle, { color: theme.heading }]}>
              {t("profileRank.txt20")}
            </Text>
            <Text style={[styles.emptyText, { color: theme.grey }]}>
              {searchQuery
                ? `${t("profileRank.txt21")}`
                : useCustomLocation && selectedLocation?.name2
                ? `${t("profileRank.txt22")} ${t("profileRank.txt48")} ${
                    selectedLocation.name2
                  }`
                : `${t("profileRank.txt22")}`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default TopRatedUsers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: RFPercentage(10),
  },
  searchSection: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(2),
  },
  inputFieldWrapper: {
    marginBottom: RFPercentage(1),
  },
  locationSection: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1.5),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  locationTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1),
  },
  locationButtons: {
    flexDirection: "row",
    gap: RFPercentage(1),
  },
  locationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(1.2),
    borderRadius: RFPercentage(1),
    borderWidth: 1,
    gap: RFPercentage(0.5),
  },
  activeLocationButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationButtonText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },
  activeLocationButtonText: {
    color: Colors.white,
  },
  clearLocationButton: {
    marginLeft: RFPercentage(0.5),
  },
  filterSection: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(2),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  filterTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1),
  },
  filterButtons: {
    flexDirection: "row",
  },
  filterButton: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1),
    marginRight: RFPercentage(1),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  activeFilterButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_500Medium",
  },
  activeFilterButtonText: {
    color: Colors.white,
  },
  resultsSection: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1.5),
  },
  filterScrollContainer: {
    flexGrow: 1,
    paddingRight: RFPercentage(2),
  },
  resultsText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
  },
  usersList: {
    paddingHorizontal: RFPercentage(2),
  },
  userCard: {
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(1.5),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: RFPercentage(1.5),
  },
  avatar: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
    borderWidth: 2,
    borderColor: Colors.primary + "20",
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(0.5),
  },
  userName: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
    marginRight: RFPercentage(1),
    flex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.3),
    borderRadius: RFPercentage(0.8),
    borderWidth: 1,
  },
  badgeText: {
    fontSize: RFPercentage(1),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(0.3),
  },
  memberSince: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    marginBottom: RFPercentage(0.5),
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  distanceText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(0.3),
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: RFPercentage(1),
    padding: RFPercentage(1),
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_700Bold",
    marginTop: RFPercentage(0.3),
  },
  statLabel: {
    fontSize: RFPercentage(1),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(0.2),
    marginHorizontal:20
  },
  statDivider: {
    width: 1,
    height: RFPercentage(2.5),
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  arrowContainer: {
    marginLeft: RFPercentage(1),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: RFPercentage(10),
  },
  loadingText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(1),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: RFPercentage(10),
    paddingHorizontal: RFPercentage(4),
  },
  emptyTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(1),
  },
  emptyText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: RFPercentage(2.2),
  },
});
