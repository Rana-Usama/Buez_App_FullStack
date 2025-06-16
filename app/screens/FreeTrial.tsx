import { Image, StyleSheet, Text, View } from "react-native";
import React from "react";
import Screen from "../components/Screen";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { RFPercentage } from "react-native-responsive-fontsize";
import MyAppButton from "../components/common/MyAppButton";
import { useTranslation } from "react-i18next";

const FreeTrial = ({ navigation }: any) => {
  const { t } = useTranslation();

  return (
    <Screen style={styles.screen}>
      <Image style={styles.logo} source={Icons.logo} />
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>{`${t("freeTial.txt1")}`}</Text>
        <Text style={styles.subHeaderText}>🎁 {`${t("freeTial.txt2")}`}</Text>
        <View style={styles.stepsWrapper}>
          {/* Step 1 */}
          <View style={styles.stepRow}>
            <View style={styles.iconCircle}>
              <Image source={Icons.key} resizeMode="contain" style={styles.iconImage} />
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>{`${t("freeTial.txt3")}`}</Text>
              <Text style={styles.stepDescription}>{`${t("freeTial.txt4")}`}</Text>
            </View>
          </View>
          <View style={styles.connectorLine1} />

          {/* Step 2 */}
          <View style={styles.stepRowSecond}>
            <View style={styles.iconCircle}>
              <Image source={Icons.notify} resizeMode="contain" style={styles.iconImage} />
            </View>
            <View style={styles.stepTextContainerSecond}>
              <Text style={styles.stepTitle}>{`${t("freeTial.txt5")}`}</Text>
              <Text style={styles.stepDescription}>{`${t("freeTial.txt6")}`}</Text>
            </View>
          </View>
          <View style={styles.connectorLine2} />

          {/* Step 3 */}
          <View style={styles.stepRowThird}>
            <View style={styles.iconCircle}>
              <Image source={Icons.star} resizeMode="contain" style={styles.iconImage} />
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>{`${t("freeTial.txt7")}`}</Text>
              <Text style={styles.stepDescription}>{`${t("freeTial.txt8")}`}</Text>
            </View>
          </View>
          <View style={styles.connectorLine3} />
        </View>
      </View>
      <MyAppButton title={`${t("freeTial.txt9")}`} marginTop={RFPercentage(-10)} onPress={() => navigation.navigate("SubscriptionV2")} />
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
    color: Colors.grey,
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    top: RFPercentage(2),
  },
  stepsWrapper: {
    marginTop: RFPercentage(4),
    width: "90%",
    alignSelf: "center",
    marginLeft: RFPercentage(3),
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepRowSecond: {
    flexDirection: "row",
    alignItems: "center",
    bottom: RFPercentage(6),
  },
  stepRowThird: {
    flexDirection: "row",
    alignItems: "center",
    bottom: RFPercentage(12.5),
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
    width: RFPercentage(30),
    top: RFPercentage(3),
  },
  stepTextContainerSecond: {
    marginLeft: RFPercentage(2),
    width: RFPercentage(30),
    top: RFPercentage(1.5),
  },
  stepTitle: {
    color: Colors.primary,
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_700Bold",
  },
  stepDescription: {
    color: Colors.grey,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
  },
  connectorLine1: {
    width: RFPercentage(0.8),
    height: RFPercentage(12),
    backgroundColor: "#F3F4F6",
    bottom: RFPercentage(2.6),
    left: RFPercentage(2.4),
  },
  connectorLine2: {
    width: RFPercentage(0.8),
    height: RFPercentage(12),
    backgroundColor: "#F3F4F6",
    bottom: RFPercentage(7.6),
    left: RFPercentage(2.4),
  },
  connectorLine3: {
    width: RFPercentage(0.8),
    height: RFPercentage(12),
    backgroundColor: "#F3F4F6",
    bottom: RFPercentage(15.2),
    left: RFPercentage(2.4),
  },
});
