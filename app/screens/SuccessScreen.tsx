import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";
import { Octicons, MaterialIcons } from "@expo/vector-icons";
import Colors from "../config/Colors";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { ShareButton } from "../job-sharing/ShareButton";
import { RouteProp, useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

/**
 * Params this screen is navigated with. `useRoute()` otherwise types
 * `route.params` as `object`, which has no known properties.
 */
type SuccessScreenRoute = RouteProp<
  {
    SuccessScreen: {
      /** The task that was just posted or edited (used for sharing). */
      taskData?: any;
      /** True when arriving from an edit rather than a new post. */
      isEdit?: boolean;
    };
  },
  "SuccessScreen"
>;

function SuccessScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const route = useRoute<SuccessScreenRoute>();
  const taskData = route.params?.taskData || null;
  // When navigated here after editing an existing task, swap the headline copy
  // to an "edited" confirmation instead of the default "posted" message.
  const isEdit = route.params?.isEdit === true;

  // Bulk vs single drives the info-card copy below: bulk tasks need N
  // confirmed helpers (apply → owner confirms up to numberOfWorkers), while
  // single tasks are assigned to exactly one confirmed helper.
  const numberOfWorkers = taskData?.numberOfWorkers || 1;
  const isBulkRequest = taskData?.isBulkRequest === true || numberOfWorkers > 1;

  const InfoCard = ({ icon, title, description }) => (
    <View
      style={[
        styles.infoCard,
        {
          backgroundColor:
            theme.mode === "dark"
              ? "rgba(21, 23, 47, 0.73)"
              : Colors.backBtnBg,
              borderLeftColor: theme.mode === "dark" ? Colors.darkGrey : Colors.white,
        },
      ]}
    >
      <View style={styles.shareIconContainer}>
        <MaterialIcons
          name={icon}
          size={RFPercentage(3)}
          color={ Colors.white}
          style={styles.infoIcon}
        />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={[styles.infoTitle, styles.text]}>{title}</Text>
        <Text
          style={[
            styles.infoDescription,
            {
              color:
                theme.mode === "dark"
                  ? Colors.lastMsgTextColor
                  : Colors.whiteAlpha90,
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
          ? [Colors.blackSolid, Colors.blackSolid]
          : [Colors.primary, Colors.success2]
      }
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <StatusBar
        backgroundColor={"transparent"}
        barStyle={"light-content"}
        translucent
      />

      {/* Success Icon */}
      <View style={styles.iconContainer}>
        <Octicons
          name={"check-circle"}
          style={styles.icon}
          color={theme.mode === "dark" ? Colors.white : Colors.white}
        />
      </View>

      {/* Main Success Message */}
      <Text
        style={[
          styles.successTitle,
          { color: theme.mode === "dark" ? Colors.white : Colors.white },
        ]}
      >
        {isEdit ? t("successScreen.editedTitle") : t("successScreen.txt1")}
      </Text>

      <Text
        style={[
          styles.subtitle,
          {
            color:
              theme.mode === "dark"
                ? Colors.lastMsgTextColor
                : Colors.whiteAlpha90,
          },
        ]}
      >
        {isEdit
          ? t("successScreen.editedSubtitle")
          : isBulkRequest
            ? t("successScreen.bulkSubtitle", { count: numberOfWorkers })
            : t("successScreen.txt3")}
      </Text>

      {/* Share Card - Prominent CTA */}
      <View
        style={[
          styles.shareCard,
          {
            backgroundColor:
              theme.mode === "dark"
                ? "rgba(46, 43, 86, 0.1)"
                : Colors.whiteAlpha10,
            borderColor:
              theme.mode === "dark"
                ? Colors.blueAlpha34
                : Colors.categoryBadgeBg,
          },
        ]}
      >
        <View style={[styles.shareIconContainer]}>
          <Ionicons
            name="share-outline"
            size={RFPercentage(3)}
            color={theme.mode === "dark" ? Colors.white : Colors.white}
          />
        </View>

        <View style={styles.shareContent}>
          <Text style={[styles.shareTitle, styles.text]}>
            {t("successScreen.shareTitle")}
          </Text>

          <Text
            style={[
              styles.shareDescription,
              {
                color:
                  theme.mode === "dark"
                    ? Colors.lastMsgTextColor
                    : Colors.whiteAlpha90,
              },
            ]}
          >
            {t("successScreen.shareDescription")}
          </Text>

          <ShareButton
            jobId={taskData?.id || ""}
            jobTitle={taskData?.taskType || "New Task"}
            jobDescription={taskData?.description || ""}
            companyName="Buez"
            style={[
              styles.shareButton,
              {
                backgroundColor:
                  theme.mode === "dark"
                    ? Colors.blueAlpha34
                    : Colors.categoryBadgeBg,

                borderColor:
                  theme.mode === "dark"
                    ? Colors.blueAlpha34
                    : Colors.categoryBadgeBg,
              },
            ]}
            showLabel={true}
            iconOnly={false}
            variant="light"
          />
        </View>
      </View>

      {/* Information Cards */}
      <ScrollView
        style={styles.infoContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.infoContent}
      >
        <InfoCard
          icon="visibility"
          title={t("successScreen.txt4")}
          description={
            isBulkRequest
              ? t("successScreen.bulkVisibilityDesc", {
                  count: numberOfWorkers,
                })
              : t("successScreen.txt5")
          }
        />

        <InfoCard
          icon="person-add"
          title={
            isBulkRequest
              ? t("successScreen.bulkApplyTitle")
              : t("successScreen.txt6")
          }
          description={
            isBulkRequest
              ? t("successScreen.bulkApplyDesc", { count: numberOfWorkers })
              : t("successScreen.txt7")
          }
        />

        <InfoCard
          icon="how-to-reg"
          title={t("successScreen.confirmTitle")}
          description={
            isBulkRequest
              ? t("successScreen.bulkConfirmDesc", {
                  count: numberOfWorkers,
                })
              : t("successScreen.singleConfirmDesc")
          }
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
            numberOfLines={1}
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
                theme.mode === "dark" ? Colors.darkGrey : Colors.white,
            },
          ]}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate("MainApp", {
              screen: "MainTabs",
              params: {
                screen: t("bottomTab.txt1"),
              },
            })
          }
        >
          <Text
            numberOfLines={1}
            style={[
              styles.secondaryButtonText,
              { color: theme.mode === "dark" ? Colors.darkGrey : Colors.white },
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
    marginTop: Platform.OS === "android" ? RFPercentage(7) : RFPercentage(9),
    marginBottom: RFPercentage(2),
  },
  icon: {
    fontSize: RFPercentage(8),
  },
  successTitle: {
    fontSize: RFPercentage(2.5),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginBottom: RFPercentage(1),
  },
  subtitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: RFPercentage(3),
    marginHorizontal: RFPercentage(2),
  },
  shareCard: {
    flexDirection: "row",
    // alignItems: "center",
    padding: RFPercentage(2),
    borderRadius: RFPercentage(2),
    marginBottom: RFPercentage(3),
    backgroundColor: Colors.whiteAlpha10,
    borderWidth: 1,
    borderColor: Colors.backBtnBg,
    marginHorizontal: RFPercentage(1),
  },
  shareIconContainer: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(3),
    backgroundColor: Colors.categoryBadgeBg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: RFPercentage(2),
  },
  shareContent: {
    flex: 1,
  },
  shareTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.5),
  },
  shareDescription: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
    marginBottom: RFPercentage(1.5),
  },
  shareButton: {
    alignSelf: "flex-start",
    minWidth: RFPercentage(12),
    // backgroundColor:"white"
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
    borderLeftColor: Colors.primary,
  },
  infoIcon: {
    // marginRight: RFPercentage(2),
    // marginTop: RFPercentage(0.5),
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.5),
  },
  infoDescription: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2.2),
  },
  buttonContainer: {
    paddingVertical: RFPercentage(3),
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1),
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  primaryButton: {
    width: "40%",
    height: RFPercentage(6),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RFPercentage(2),
    shadowColor: Colors.blackSolid,
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
    width: "58%",
    height: RFPercentage(6),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RFPercentage(2),
    borderWidth: RFPercentage(0.15),
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
  },
  text: { color: Colors.white },
});

export default SuccessScreen;
