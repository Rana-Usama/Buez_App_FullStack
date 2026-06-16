import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import Nav from "../components/common/Nav";
import ToggleSwitch from "toggle-switch-react-native";
import { useAppTheme } from "../contexts/themeContext";
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { Icons } from "../config/theme";
import { useTranslation } from "react-i18next";
import { useExitAppOnBack } from "../utils/appBack";

function Settings({ navigation }) {
  const { userData: user } = useUser();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useAppTheme();
  useExitAppOnBack();

  const profileImgUrl = user?.profileImage || "";
  const currentPlan =
    user?.planType || user?.subscription?.planInterval || "free";
  const isMonthlyPlan = currentPlan === "monthly";
  const freePlan = user?.planType === "free";

  const navigationsList = [
    {
      iconSource: Icons.privacy,
      title: t("settings.txt2"),
      navigation: () => navigation.navigate("ChangePassword"),
      iconType: "image",
    },
    {
      iconSource: Icons.language,
      title: t("settings.txt12"),
      navigation: () => navigation.navigate("Language"),
      iconType: "image",
    },
    {
      iconSource: "globe",
      title: t("settings.txt3"),
      navigation: () => navigation.navigate("TermsAndConditions"),
      iconType: "feather",
    },
    {
      iconSource: Icons.privacy,
      title: t("settings.txt4"),
      navigation: () => navigation.navigate("PrivacyPolicy"),
      iconType: "image",
    },
    {
      iconSource: Icons.faq,
      title: t("settings.txt5"),
      navigation: () => navigation.navigate("FAQ"),
      iconType: "image",
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
      <Nav
        profileImage={profileImgUrl}
        leftLogo={true}
        gradient
        gradientColors={[Colors.primary, "#0b1544ff"]}
        title={t("settings.txt9")}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.lightGrey }]}>
            {t("settings.txt8")}
          </Text>
          <View
            style={[
              styles.underline,
              { backgroundColor: theme.primary + "30" },
            ]}
          />
        </View>

        {/* Theme Toggle Card */}
        <TouchableOpacity
        activeOpacity={0.6}
        onPress={toggleTheme}
          style={[
            styles.card,
            {
              backgroundColor: theme.mode === "dark" ? "#050505ff" : "#F8F9FA",
              borderColor: theme.mode === "dark" ? "#41444aff" : "#e4e8fbff",
            },
          ]}
        >
          <View style={styles.listItem}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.mode === "dark" ? "#26292fff" : theme.primary + "15" },
              ]}
            >
              <Feather
                name={theme.mode === "dark" ? "moon" : "sun"}
                size={18}
                color={theme.heading}
              />
            </View>
            <Text style={[styles.title, { color: theme.heading }]}>
              {t("settings.txt13")}
            </Text>
            <ToggleSwitch
              isOn={theme.mode === "dark"}
              onColor={Colors.primary}
              offColor={"rgb(224, 224, 227)"}
              size="small"
              onToggle={toggleTheme}
            />
          </View>
        </TouchableOpacity>

        {/* General Settings List */}
        <View
          style={[
            styles.card,
            {
              backgroundColor:
                theme.mode === "dark" ? "#050505ff" : "#ffffffff",
             borderColor: theme.mode === "dark" ? "#41444aff" : "#e4e8fbff",
            },
          ]}
        >
          {navigationsList
            .filter((item) => {
              if (item.title === "Upgrade Plan" && !isMonthlyPlan) return false;
              if (item.title === t("settings.txt1") && freePlan) return false;
              return true;
            })
            .map((item, i, filteredList) => (
              <TouchableOpacity
                key={i}
                onPress={item.navigation}
                activeOpacity={0.7}
                style={[
                  styles.listItem,
                  i !== filteredList.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.mode === "dark" ? "#41444aff" : "#e4e8fbff",
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor:  theme.mode === "dark" ? "#26292fff" : theme.primary + "15" },
                  ]}
                >
                  {item.iconType === "feather" ? (
                    <Feather
                      name={item.iconSource as any}
                      size={18}
                      color={theme.heading}
                    />
                  ) : (
                    <Image
                      style={styles.img}
                      source={item.iconSource}
                      tintColor={theme.heading}
                    />
                  )}
                </View>

                <Text style={[styles.title, { color: theme.heading }]}>
                  {item.title}
                </Text>

                <MaterialIcons
                  name="arrow-forward-ios"
                  size={14}
                  color={theme.lightGrey}
                />
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    width: "100%",
  },
  scrollContent: {
    paddingBottom: RFPercentage(5),
    paddingHorizontal: "5%",
  },
  sectionHeader: {
    marginTop: RFPercentage(4),
    marginBottom: RFPercentage(2),
    alignItems: "flex-start",
  },
  sectionTitle: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  underline: {
    width: 90,
    height: 3,
    borderRadius: 2,
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 0.6,
    paddingHorizontal: 15,
    marginBottom: 20,
    overflow: "hidden",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.8),
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  img: {
    width: 20,
    height: 20,
  },
  title: {
    flex: 1,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    marginLeft: 15,
  },
});

export default Settings;
