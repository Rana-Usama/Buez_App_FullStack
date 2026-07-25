import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAppTheme } from "../../contexts/themeContext";
import Colors from "../../config/Colors";
import { TaskData, TranslatedTaskData } from "../../types/TaskApplicants/types";
import GroupChatButton from "./GroupChatButton";

const { width } = Dimensions.get("window");

// Refined, app-aligned header gradient (kept local so the shared
// Colors.heroGradient* tokens used by GroupDetails stay untouched).
const HEADER_GRADIENT_LIGHT = ["#253275d5", "#2b367f65", "#3e4fadb0"];
const HEADER_GRADIENT_DARK = ["#20233F", "#191C33", "#111325"];

interface TaskHeaderProps {
  taskData: TaskData | null;
  confirmedWorkers: any[];
  translatedTaskData: TranslatedTaskData;
  t: (key: string, options?: any) => string;
  navigation: any;
  taskId: any;
  currentUser: any;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({
  taskData,
  confirmedWorkers,
  translatedTaskData,
  t,
  navigation,
  taskId,
  currentUser,
}) => {
  const { theme } = useAppTheme();

  if (!taskData) return null;

  // ── CALCULATIONS ──
  const requiredWorkers = taskData.numberOfWorkers || 1;
  const isFull = confirmedWorkers.length >= requiredWorkers;
  const availableSpots = requiredWorkers - confirmedWorkers.length;
  const progress = Math.min(
    (confirmedWorkers.length / requiredWorkers) * 100,
    100,
  );

  const headerColors =
    theme.mode === "dark" ? HEADER_GRADIENT_DARK : HEADER_GRADIENT_LIGHT;

  const taskTypeLabel =
    taskData.taskType === "Other"
      ? translatedTaskData.customTaskTitle || taskData.customTaskTitle
      : translatedTaskData.taskType || taskData.taskType;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={headerColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.taskHeader}
      >
        {/* Subtle decorative depth */}
        <View style={styles.decorCircle1} pointerEvents="none" />
        <View style={styles.decorCircle2} pointerEvents="none" />

        {/* Top bar: back + title */}
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Feather
              name="arrow-left"
              color={Colors.white}
              size={RFPercentage(2.4)}
            />
          </TouchableOpacity>

          <Text style={styles.topBarTitle} numberOfLines={1}>
            {t("taskApplicants.title")}
          </Text>

          <View style={styles.backBtnSpacer} />
        </View>

        <View style={styles.taskHeaderContent}>
          {/* Task Type Badge */}
          {!!taskTypeLabel && (
            <View style={styles.taskTypeBadge}>
              <Ionicons
                name="briefcase"
                size={RFPercentage(1.6)}
                color={Colors.heroTitleColor}
              />
              <Text style={styles.taskTypeText} numberOfLines={1}>
                {taskTypeLabel}
              </Text>
            </View>
          )}

          {/* Task Description */}
          {/* <Text style={styles.taskTitle} numberOfLines={2}>
            {translatedTaskData.description ||
              taskData.description ||
              t("taskApplicants.noDescription")}
          </Text> */}

          {/* Group/Broadcast chat — bulk tasks only (single tasks use 1:1 chat) */}
          {requiredWorkers > 1 && confirmedWorkers?.length > 0 && (
            <GroupChatButton
              style={{ marginTop: RFPercentage(0.5), width: "58%" }}
              onPress={() =>
                navigation.navigate("GroupChat", {
                  groupChatId: taskId,
                  currentUserId: currentUser?.userData?.userId,
                  currentUserName: currentUser?.userData?.userName,
                  taskType: taskData?.taskType,
                  customTaskTitle: taskData?.customTaskTitle,
                })
              }
              t={t}
            />
          )}

          {/* Task Stats */}
          <View style={styles.taskStats}>
            <View style={styles.statItem}>
              <Ionicons
                name="people"
                size={RFPercentage(2.2)}
                color={Colors.heroTitleColor}
              />
              <Text style={styles.statValue} numberOfLines={1}>
                {requiredWorkers}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                {t("taskApplicants.helpersNeeded")}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons
                name="checkmark-circle"
                size={RFPercentage(2.2)}
                color={Colors.heroTitleColor}
              />
              <Text style={styles.statValue} numberOfLines={1}>
                {confirmedWorkers.length}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                {t("taskApplicants.confirmed")}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons
                name={isFull ? "checkmark-done-circle" : "alert-circle"}
                size={RFPercentage(2.2)}
                color={Colors.heroTitleColor}
              />
              <Text style={styles.statValue} numberOfLines={1}>
                {isFull
                  ? t("taskApplicants.full")
                  : t("taskApplicants.spotsLeft", { spots: availableSpots })}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                {t("taskApplicants.status")}
              </Text>
            </View>
          </View>

         
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  taskHeader: {
    paddingTop: RFPercentage(7),
    paddingBottom: RFPercentage(3),
    paddingHorizontal: RFPercentage(2.6),
    borderBottomLeftRadius: RFPercentage(3.5),
    borderBottomRightRadius: RFPercentage(3.5),
    overflow: "hidden",
  },
  decorCircle1: {
    position: "absolute",
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -width * 0.2,
    right: -width * 0.15,
  },
  decorCircle2: {
    position: "absolute",
    width: width * 0.32,
    height: width * 0.32,
    borderRadius: width * 0.16,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -width * 0.12,
    left: -width * 0.1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: RFPercentage(2),
  },
  backBtn: {
    width: RFPercentage(4.4),
    height: RFPercentage(4.4),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  backBtnSpacer: {
    width: RFPercentage(4.4),
  },
  topBarTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: RFPercentage(1.9),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.heroTitleColor,
  },
  taskHeaderContent: {
    alignItems: "center",
  },
  taskTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1.6),
    paddingVertical: RFPercentage(0.6),
    borderRadius: RFPercentage(3),
    marginBottom: RFPercentage(1.4),
    gap: RFPercentage(0.6),
    maxWidth: "90%",
    backgroundColor: Colors.categoryBadgeBg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  taskTypeText: {
    fontSize: RFPercentage(1.35),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.heroTitleColor,
  },
  taskTitle: {
    fontSize: RFPercentage(2.15),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: RFPercentage(2),
    lineHeight: RFPercentage(2.9),
    color: Colors.heroTitleColor,
  },
  taskStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    borderRadius: RFPercentage(2.2),
    paddingVertical: RFPercentage(1.8),
    paddingHorizontal: RFPercentage(1.2),
    marginTop: RFPercentage(1.5),
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: RFPercentage(0.4),
  },
  statValue: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_700Bold",
    marginTop: RFPercentage(0.6),
    marginBottom: RFPercentage(0.3),
    color: Colors.heroTitleColor,
    textAlign: "center",
  },
  statLabel: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    color: Colors.heroStatsLabel,
  },
  statDivider: {
    width: 1,
    height: "58%",
    backgroundColor: Colors.heroStatsDivider,
  },
  progressContainer: {
    width: "100%",
    marginTop: RFPercentage(1.6),
  },
  progressBar: {
    height: RFPercentage(0.9),
    borderRadius: RFPercentage(0.6),
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  progressFill: {
    height: "100%",
    borderRadius: RFPercentage(0.6),
  },
  progressText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    marginTop: RFPercentage(0.8),
    color: Colors.heroStatsLabel,
  },
});

export default TaskHeader;
