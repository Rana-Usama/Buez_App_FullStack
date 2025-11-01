import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import Nav from "../components/common/Nav";
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { fetchCompletedTasksFromFirebase } from "../services/Review.service";
import { cachedTranslate } from "../utils/cachedTranslations";

function Profile({ navigation }) {
  const { userData: user } = useUser();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const profileImgUrl = user?.profileImage || "";
  const userName = user?.userName || "";
  const userBio = user?.biography || "";

  const [isExpanded, setIsExpanded] = useState(false);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [userBadge, setUserBadge] = useState(null);
  const [translatedBadgeText, setTranslatedBadgeText] = useState("");
  const [translatedTasksText, setTranslatedTasksText] = useState("");
  const [translatedReadMore, setTranslatedReadMore] = useState({
    readMore: "",
    readLess: "",
  });
  const [translatedAddBio, setTranslatedAddBio] = useState("");
  const [translatedBiography, setTranslatedBiography] = useState("");

  const needsReadMore = userBio.length > 80;
  const displayText = isExpanded
    ? translatedBiography
    : translatedBiography.slice(0, 80) + (needsReadMore ? "..." : "");

  // Fetch completed tasks and calculate badge
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const records = await fetchCompletedTasksFromFirebase();
        const count = records?.length || 0;
        setCompletedTasksCount(count);

        // Determine badge based on completed tasks count
        let badge = null;
        if (count >= 3) {
          badge = {
            type: "pro",
            icon: "trophy",
            text: `${t("profileRank.txt5")}`,
            color: "#FFD700",
            bgColor: "#FFFDE7",
            borderColor: "#FFD700",
          };
        } else if (count >= 2) {
          badge = {
            type: "rising",
            icon: "trending-up",
            text: `${t("profileRank.txt4")}`,
            color: "#FF9800",
            bgColor: "#FFF3E0",
            borderColor: "#FF9800",
          };
        } else if (count >= 1) {
          badge = {
            type: "beginner",
            icon: "leaf",
            text: `${t("profileRank.txt3")}`,
            color: "#4CAF50",
            bgColor: "#E8F5E8",
            borderColor: "#4CAF50",
          };
        }
        setUserBadge(badge);

        // Translate badge text if badge exists
        if (badge) {
          const translatedText = await cachedTranslate(badge.text);
          setTranslatedBadgeText(translatedText);
        }
      } catch (error) {
        console.log("Error fetching user stats:", error);
      }
    };

    fetchUserStats();
  }, []);

  // Translate static texts
  useEffect(() => {
    const translateTexts = async () => {
      try {
        // Translate tasks completed text
        const tasksText = await cachedTranslate("tasks completed");
        setTranslatedTasksText(tasksText);

        // Translate read more/less texts
        const readMoreText = await cachedTranslate("Read more");
        const readLessText = await cachedTranslate("Read less");
        setTranslatedReadMore({
          readMore: readMoreText,
          readLess: readLessText,
        });

        // Translate add bio text
        const addBioText = await cachedTranslate("Add professional bio");
        setTranslatedAddBio(addBioText);

        // Translate biography if it exists
        if (userBio) {
          const translatedBio = await cachedTranslate(userBio);
          setTranslatedBiography(translatedBio);
        }
      } catch (error) {
        console.log("Error translating texts:", error);
        // Set fallback texts
        setTranslatedTasksText("tasks completed");
        setTranslatedReadMore({
          readMore: "Read more",
          readLess: "Read less",
        });
        setTranslatedAddBio("Add professional bio");
        setTranslatedBiography(userBio);
      }
    };

    translateTexts();
  }, [userBio]);

  // Update biography translation when userBio changes
  useEffect(() => {
    const translateBiography = async () => {
      if (userBio) {
        try {
          const translatedBio = await cachedTranslate(userBio);
          setTranslatedBiography(translatedBio);
        } catch (error) {
          console.log("Error translating biography:", error);
          setTranslatedBiography(userBio);
        }
      } else {
        setTranslatedBiography("");
      }
    };

    translateBiography();
  }, [userBio]);

  const navigationsList = [
    {
      iconSource: Icons.editP,
      title: `${t("profile.txt2")}`,
      navigation: () => navigation.navigate("EditProfile"),
    },
    {
      iconSource: Icons.receipt,
      title: `${t("profile.txt3")}`,
      navigation: () => navigation.navigate("Reviews"),
    },
    {
      iconSource: Icons.map2,
      title: `${t("profile.txt4")}`,
      navigation: () => navigation.navigate("CompletedTasks"),
    },
  ];

  return (
    <View
      style={[styles.screen, { backgroundColor: theme.white || "#FFFFFF" }]}
    >
      {/* Navigation Header */}
      <Nav
        dpNull
        leftLogo={false}
        profileImage={profileImgUrl}
        navigation={navigation}
        title={`${t("profile.txt1")}`}
        marginTop={RFPercentage(5)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: theme.white,
              borderWidth: 1,
              borderColor:
                theme.mode === "dark" ? theme.border : "rgba(238, 238, 238, 1)",
            },
          ]}
        >
          {/* Profile Image with Professional Border */}
          <View style={styles.imageSection}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <View
                style={[styles.imageContainer, { borderColor: theme.primary }]}
              >
                <Image
                  style={styles.profileImage}
                  source={profileImgUrl ? { uri: profileImgUrl } : Icons.dp}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* User Information */}
          <View style={styles.infoSection}>
            <Text style={[styles.userName, { color: theme.heading }]}>
              {userName}
            </Text>

            {/* User Badge */}
            {userBadge && (
              <View
                style={[
                  styles.badgeContainer,
                  {
                    backgroundColor: userBadge.bgColor,
                    borderColor: userBadge.borderColor,
                  },
                ]}
              >
                <Ionicons
                  name={userBadge.icon}
                  size={RFPercentage(1.4)}
                  color={userBadge.color}
                />
                <Text style={[styles.badgeText, { color: userBadge.color }]}>
                  { userBadge.text}
                </Text>
              </View>
            )}

            {/* Tasks Completed Count */}
            {completedTasksCount > 0 && (
              <View style={styles.tasksCountContainer}>
                <Ionicons
                  name="checkmark-done-circle"
                  size={RFPercentage(1.6)}
                  color={Colors.primary}
                />
                <Text
                  style={[styles.tasksCountText, { color: theme.darkGrey }]}
                >
                  {completedTasksCount}{" "}
                  {translatedTasksText || "tasks completed"}
                </Text>
              </View>
            )}

            {/* Biography Section */}
            {userBio ? (
              <View style={styles.biographySection}>
                <Text style={[styles.biographyText, { color: theme.darkGrey }]}>
                  {displayText}
                </Text>
                {needsReadMore && (
                  <TouchableOpacity
                    onPress={() => setIsExpanded(!isExpanded)}
                    style={styles.readMoreButton}
                  >
                    <Text
                      style={[styles.readMoreText, { color: theme.primary }]}
                    >
                      {isExpanded
                        ? translatedReadMore.readLess || "Read less"
                        : translatedReadMore.readMore || "Read more"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate("EditProfile")}
                style={[styles.addBioButton, { borderColor: theme.border }]}
              >
                <MaterialIcons
                  name="add"
                  size={RFPercentage(2)}
                  color={theme.primary}
                />
                <Text style={[styles.addBioText, { color: theme.primary }]}>
                  {translatedAddBio || "Add professional bio"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Navigation Menu */}
        <View style={styles.navigationSection}>
          <View style={styles.navigationList}>
            {navigationsList.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={item.navigation}
                activeOpacity={1}
                style={[
                  styles.navigationItem,
                  {
                    backgroundColor: theme.white,
                    borderBottomColor: theme.border,
                    borderBottomWidth: i === navigationsList.length - 1 ? 0 : 1,
                  },
                ]}
              >
                <View style={styles.navigationContent}>
                  <View style={styles.itemLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: `${theme.primary}15` },
                      ]}
                    >
                      <Image
                        style={styles.navigationIcon}
                        source={item.iconSource}
                        tintColor={theme.primary}
                      />
                    </View>
                    <Text
                      style={[styles.navigationTitle, { color: theme.heading }]}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={RFPercentage(2.2)}
                    color={theme.darkGrey}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    paddingBottom: RFPercentage(3),
  },
  profileCard: {
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(3),
    borderRadius: RFPercentage(1.5),
    padding: RFPercentage(3),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: RFPercentage(2),
  },
  imageContainer: {
    position: "relative",
    borderWidth: RFPercentage(0.3),
    borderRadius: RFPercentage(10),
    padding: RFPercentage(0.1),
  },
  profileImage: {
    width: RFPercentage(12),
    height: RFPercentage(12),
    borderRadius: RFPercentage(6),
  },
  editBadge: {
    position: "absolute",
    bottom: RFPercentage(0.6),
    right: RFPercentage(-0.7),
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(2),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  infoSection: {
    alignItems: "center",
  },
  userName: {
    fontSize: RFPercentage(2.4),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.5),
    textAlign: "center",
  },
  // Badge Styles
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1.2),
    paddingVertical: RFPercentage(0.5),
    borderRadius: RFPercentage(1),
    borderWidth: 1,
    marginBottom: RFPercentage(1),
  },
  badgeText: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(0.3),
  },
  // Tasks Count Styles
  tasksCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1.5),
  },
  tasksCountText: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(0.5),
  },
  biographySection: {
    width: "100%",
    alignItems: "center",
  },
  biographyText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.1),
    textAlign: "center",
  },
  readMoreButton: {
    marginTop: RFPercentage(0.5),
  },
  readMoreText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
  },
  addBioButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(2),
    borderRadius: RFPercentage(1),
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: RFPercentage(1),
  },
  addBioText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(1),
  },
  navigationSection: {
    marginTop: RFPercentage(4),
    marginHorizontal: RFPercentage(2),
  },
  sectionTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1.5),
    marginLeft: RFPercentage(0.5),
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  navigationList: {
    borderRadius: RFPercentage(1.5),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  navigationItem: {
    paddingVertical: RFPercentage(2),
    paddingHorizontal: RFPercentage(2.5),
  },
  navigationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
    marginRight: RFPercentage(2),
  },
  navigationIcon: {
    width: RFPercentage(2),
    height: RFPercentage(2),
  },
  navigationTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    flex: 1,
  },
  bottomSpace: {
    height: RFPercentage(3),
  },
});

export default Profile;
