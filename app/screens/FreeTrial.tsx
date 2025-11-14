import { Image, StatusBar, StyleSheet, Text, View } from "react-native";
import React from "react";
import Screen from "../components/Screen";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { RFPercentage } from "react-native-responsive-fontsize";
import MyAppButton from "../components/common/MyAppButton";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";

const FreeTrial = ({ navigation }: any) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  return (
    <Screen style={[styles.screen, { backgroundColor: theme.white }]}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.white}
      />
      <Image style={styles.logo} source={Icons.logo} />
      <View style={styles.headerContainer}>
        <Text style={[styles.headerText, { color: theme.primary }]}>{`${t(
          "freeTrial.txt1"
        )}`}</Text>
        <Text style={[styles.subHeaderText, { color: theme.darkGrey }]}>
          🎁 {`${t("freeTrial.txt2")}`}
        </Text>
        <View style={styles.stepsWrapper}>
          {/* Step 1 */}
          <View style={styles.stepRow}>
            <View style={{}}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.primary + "40"
                        : Colors.primary + "15",
                  },
                ]}
              >
                <Image
                  source={Icons.key}
                  resizeMode="contain"
                  style={styles.iconImage}
                />
              </View>
              <View
                style={[
                  styles.connectorLine1,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.primary + "40"
                        : Colors.primary + "15",
                  },
                ]}
              />
            </View>

            <View style={styles.stepTextContainer}>
              <Text style={[styles.stepTitle, { color: theme.primary }]}>{`${t(
                "freeTrial.txt3"
              )}`}</Text>
              <Text
                style={[styles.stepDescription, { color: theme.heading }]}
              >{`${t("freeTrial.txt4")}`}</Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.stepRowSecond}>
            <View>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.primary + "40"
                        : Colors.primary + "15",
                  },
                ]}
              >
                <Image
                  source={Icons.notify}
                  resizeMode="contain"
                  style={styles.iconImage}
                />
              </View>
              <View
                style={[
                  styles.connectorLine2,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.primary + "40"
                        : Colors.primary + "15",
                  },
                ]}
              />
            </View>
            <View style={styles.stepTextContainerSecond}>
              <Text style={[styles.stepTitle, { color: theme.primary }]}>{`${t(
                "freeTrial.txt5"
              )}`}</Text>
              <Text
                style={[styles.stepDescription, { color: theme.heading }]}
              >{`${t("freeTrial.txt6")}`}</Text>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.stepRowThird}>
            <View>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.primary + "40"
                        : Colors.primary + "15",
                  },
                ]}
              >
                <Image
                  source={Icons.star}
                  resizeMode="contain"
                  style={styles.iconImage}
                />
              </View>
              <View
                style={[
                  styles.connectorLine3,
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.primary + "40"
                        : Colors.primary + "15",
                  },
                ]}
              />
            </View>

            <View style={[styles.stepTextContainer]}>
              <Text style={[styles.stepTitle, { color: theme.primary }]}>{`${t(
                "freeTrial.txt7"
              )}`}</Text>
              <Text
                style={[styles.stepDescription, { color: theme.heading }]}
              >{`${t("freeTrial.txt8")}`}</Text>
            </View>
          </View>
        </View>
      </View>
      <MyAppButton
        title={`${t("freeTrial.txt9")}`}
        onPress={() => navigation.navigate("SubscriptionV2")}
        width={"45%"}
      />
    </Screen>
  );
};

export default FreeTrial;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  logo: {
    width: RFPercentage(6.5),
    height: RFPercentage(9.5),
    marginTop: RFPercentage(3),
  },
  headerContainer: {
    marginTop: RFPercentage(4),
    width: "100%",
  },
  headerText: {
    color: Colors.primary,
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },
  subHeaderText: {
    color: Colors.darkGrey,
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    top: RFPercentage(2),
  },
  stepsWrapper: {
    marginTop: RFPercentage(7),
    width: "90%",
    alignSelf: "center",
    marginLeft: RFPercentage(3),
  },
  stepRow: {
    flexDirection: "row",
  },
  stepRowSecond: {
    flexDirection: "row",
  },
  stepRowThird: {
    flexDirection: "row",
  },
  iconCircle: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: RFPercentage(100),
  },
  iconImage: {
    width: RFPercentage(3),
    height: RFPercentage(3),
  },
  stepTextContainer: {
    marginLeft: RFPercentage(2),
    width: RFPercentage(35),
  },
  stepTextContainerSecond: {
    marginLeft: RFPercentage(2),
    width: RFPercentage(35),
  },
  stepTitle: {
    color: Colors.primary,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_700Bold",
  },
  stepDescription: {
    color: Colors.heading,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(0.4),
    width: "85%",
  },
  connectorLine1: {
    width: RFPercentage(0.8),
    height: RFPercentage(10),
    backgroundColor: "#F3F4F6",
    left: RFPercentage(2.4),
  },
  connectorLine2: {
    width: RFPercentage(0.8),
    height: RFPercentage(10),
    backgroundColor: "#F3F4F6",
    left: RFPercentage(2.4),
  },
  connectorLine3: {
    width: RFPercentage(0.8),
    height: RFPercentage(10),
    backgroundColor: "#F3F4F6",
    left: RFPercentage(2.4),
  },
});
