import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
import Nav from "../components/common/Nav";
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";

function Profile({ navigation }) {
  const { userData: user } = useUser();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const profileImgUrl = user?.profileImage || "";
  const userName = user?.userName || "";
  const userBio = user?.biography || "";

  const [isExpanded, setIsExpanded] = useState(false);
  const needsReadMore = userBio.length > 80;
  const displayText = isExpanded
    ? userBio
    : userBio.slice(0, 80) + (needsReadMore ? "..." : "");

  const toggleReadMore = () => setIsExpanded(!isExpanded);

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
    <View style={[styles.screen, { backgroundColor: theme.white || "#FFFFFF" }]}>
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
        <View style={[styles.profileCard, { backgroundColor: theme.white, borderWidth:1, borderColor: theme.mode === 'dark' ? theme.border  : 'rgba(238, 238, 238, 1)'}]}>
          {/* Profile Image with Professional Border */}
          <View style={styles.imageSection}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("EditProfile")}
            >
              <View style={[styles.imageContainer, { borderColor: theme.primary }]}>
                <Image
                  style={styles.profileImage}
                  source={profileImgUrl ? { uri: profileImgUrl } : Icons.dp}
                />
                <View style={[styles.editBadge, { backgroundColor: theme.primary }]}>
                  <MaterialIcons name="edit" size={RFPercentage(1.8)} color={theme.white} />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* User Information */}
          <View style={styles.infoSection}>
            <Text style={[styles.userName, { color: theme.heading }]}>{userName}</Text>
            
            {/* Professional Title/Badge - You can add this field to your user data */}
            {/* <Text style={[styles.userTitle, { color: theme.primary }]}>
              Professional Member
            </Text> */}

            {/* Biography Section */}
            {userBio ? (
              <View style={styles.biographySection}>
                {/* <Text style={[styles.biographyLabel, { color: theme.darkGrey }]}>
                  ABOUT
                </Text> */}
                <Text style={[styles.biographyText, { color: theme.darkGrey }]}>
                  {displayText}
                  {/* {needsReadMore && (
                    <Text
                      style={[styles.readMoreText, { color: theme.primary }]}
                      onPress={toggleReadMore}
                    >
                      {isExpanded ? " Show less" : " Read more"}
                    </Text>
                  )} */}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate("EditProfile")}
                style={[styles.addBioButton, { borderColor: theme.border }]}
              >
                <MaterialIcons name="add" size={RFPercentage(2)} color={theme.primary} />
                <Text style={[styles.addBioText, { color: theme.primary }]}>
                  Add professional bio
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Navigation Menu */}
        <View style={styles.navigationSection}>
          <Text style={[styles.sectionTitle, { color: theme.heading }]}>
            ACCOUNT
          </Text>
          <View style={styles.navigationList}>
            {navigationsList.map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={item.navigation}
                activeOpacity={0.7}
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
                    <View style={[styles.iconContainer, { backgroundColor: `${theme.primary}15` }]}>
                      <Image
                        style={styles.navigationIcon}
                        source={item.iconSource}
                        tintColor={theme.primary}
                      />
                    </View>
                    <Text style={[styles.navigationTitle, { color: theme.heading }]}>
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

        {/* Stats Section - Optional professional touch */}
        {/* <View style={styles.statsSection}>
          <View style={[styles.statCard, { backgroundColor: theme.white }]}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: theme.darkGrey }]}>Completed Tasks</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.white }]}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: theme.darkGrey }]}>Reviews</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.white }]}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>0</Text>
            <Text style={[styles.statLabel, { color: theme.darkGrey }]}>Rating</Text>
          </View>
        </View> */}

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
    padding: RFPercentage(0.5),
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
  userTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_500Medium",
    marginBottom: RFPercentage(2),
    textAlign: "center",
  },
  biographySection: {
    width: "100%",
    alignItems: "center",
  },
  biographyLabel: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1),
    letterSpacing: 1,
    opacity: 0.7,
  },
  biographyText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.1),
    textAlign: "center",
  },
  readMoreText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_500Medium",
    marginLeft: RFPercentage(0.5),
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
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: RFPercentage(2),
    marginTop: RFPercentage(4),
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: RFPercentage(2),
    borderRadius: RFPercentage(1.5),
    marginHorizontal: RFPercentage(0.5),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: RFPercentage(2.4),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.5),
  },
  statLabel: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  bottomSpace: {
    height: RFPercentage(3),
  },
});

export default Profile;