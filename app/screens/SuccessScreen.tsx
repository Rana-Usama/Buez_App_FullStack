import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import { Octicons, MaterialIcons } from "@expo/vector-icons";
import Colors from "../config/Colors";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";

function SuccessScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const InfoCard = ({ icon, title, description }) => (
    <View
      style={[
        styles.infoCard,
        {
          backgroundColor:
            theme.mode === "dark"
              ? "rgba(255,255,255,0.05)"
              : "rgba(255,255,255,0.2)",
        },
      ]}
    >
      <MaterialIcons
        name={icon}
        size={RFPercentage(3.5)}
        color={theme.mode === "dark" ? Colors.primary : Colors.white}
        style={styles.infoIcon}
      />
      <View style={styles.infoTextContainer}>
        <Text
          style={[
            styles.infoTitle,
            { color: theme.mode === "dark" ? Colors.primary : Colors.white },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.infoDescription,
            {
              color:
                theme.mode === "dark"
                  ? "rgba(255,255,255,0.8)"
                  : "rgba(255,255,255,0.9)",
            },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={
        theme.mode === "dark"
          ? ["#000000", "#1a1a1a"]
          : [Colors.primary, Colors.success2]
      }
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <StatusBar
        backgroundColor={theme.white}
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
      />

      {/* Success Icon */}
      <View style={styles.iconContainer}>
        <Octicons
          name={"check-circle"}
          style={styles.icon}
          color={theme.mode === "dark" ? Colors.primary : Colors.white}
        />
      </View>

      {/* Main Success Message */}
      <Text
        style={[
          styles.successTitle,
          { color: theme.mode === "dark" ? Colors.primary : Colors.white },
        ]}
      >
        {t("successScreen.txt1")}
      </Text>

      <Text
        style={[
          styles.subtitle,
          {
            color:
              theme.mode === "dark"
                ? "rgba(255,255,255,0.8)"
                : "rgba(255,255,255,0.9)",
          },
        ]}
      >
        {t("successScreen.txt3")}
      </Text>

      {/* Information Cards */}
      <ScrollView
        style={styles.infoContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.infoContent}
      >
        <InfoCard
          icon="visibility"
          title={t("successScreen.txt4")}
          description={t("successScreen.txt5")}
        />

        <InfoCard
          icon="person-add"
          title={t("successScreen.txt6")}
          description={t("successScreen.txt7")}
        />

        <InfoCard
          icon="update"
          title={t("successScreen.txt8")}
          description={t("successScreen.txt9")}
        />

        <InfoCard
          icon="notifications"
          title={t("successScreen.txt10")}
          description={t("successScreen.txt11")}
        />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor:
                theme.mode === "dark" ? Colors.primary : Colors.white,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("TabNavigator")}
        >
          <Text
            style={[
              styles.primaryButtonText,
              { color: theme.mode === "dark" ? Colors.white : Colors.primary },
            ]}
          >
            {t("successScreen.txt2")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            {
              borderColor:
                theme.mode === "dark" ? Colors.primary : Colors.white,
            },
          ]}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate("TabNavigator", { screen: t("bottomTab.txt1") })
          }
        >
          <Text
            style={[
              styles.secondaryButtonText,
              { color: theme.mode === "dark" ? Colors.primary : Colors.white },
            ]}
          >
            {t("successScreen.txt12")}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: RFPercentage(2),
  },
  iconContainer: {
    alignItems: "center",
    marginTop: RFPercentage(5),
    marginBottom: RFPercentage(2),
  },
  icon: {
    fontSize: RFPercentage(8),
  },
  successTitle: {
    fontSize: RFPercentage(3),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginBottom: RFPercentage(1),
  },
  subtitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: RFPercentage(4),
    marginHorizontal: RFPercentage(2),
  },
  infoContainer: {
    flex: 1,
    marginBottom: RFPercentage(2),
  },
  infoContent: {
    paddingHorizontal: RFPercentage(1),
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: RFPercentage(2),
    borderRadius: RFPercentage(1.5),
    marginBottom: RFPercentage(2),
    borderLeftWidth: 3,
    borderLeftColor: Colors.success2,
  },
  infoIcon: {
    marginRight: RFPercentage(2),
    marginTop: RFPercentage(0.5),
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.5),
  },
  infoDescription: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.2),
  },
  buttonContainer: {
    paddingVertical: RFPercentage(3),
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1),
  },
  primaryButton: {
    width: "100%",
    height: RFPercentage(6),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RFPercentage(1.5),
    marginBottom: RFPercentage(2),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
  secondaryButton: {
    width: "100%",
    height: RFPercentage(6),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RFPercentage(1.5),
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
});

export default SuccessScreen;
