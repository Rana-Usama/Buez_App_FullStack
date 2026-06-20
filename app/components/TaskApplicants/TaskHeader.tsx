import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAppTheme } from "../../contexts/themeContext";
import Colors from "../../config/Colors";
import { TaskData, TranslatedTaskData } from "../../types/TaskApplicants/types";
import GroupChatButton from "./GroupChatButton";

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

  const heroColors =
    theme.mode === "dark" ? Colors.heroGradientDark : Colors.heroGradientLight;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={heroColors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.taskHeader}
      >
        <View style={styles.taskHeaderContent}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              navigation.goBack();
            }}
            style={[
              styles.headerBackBtn,
              {
                backgroundColor:
                  theme.mode === "dark"
                    ? "rgba(255, 255, 255, 0.27)"
                    : Colors.primary + "30",
              },
            ]}
          >
            <Feather
              name="arrow-left"
              color={Colors.white}
              size={RFPercentage(2.5)}
            />
          </TouchableOpacity>

          {/* Task Type Badge */}
          <View
            style={[
              styles.taskTypeBadge,
              { backgroundColor: Colors.categoryBadgeBg },
            ]}
          >
            <Ionicons
              name="briefcase"
              size={RFPercentage(1.8)}
              color={Colors.heroTitleColor}
            />
            <Text style={styles.taskTypeText} numberOfLines={1}>
              {taskData.taskType === "Other"
                ? translatedTaskData.customTaskTitle || taskData.customTaskTitle
                : translatedTaskData.taskType || taskData.taskType}
            </Text>
          </View>

          {/* Task Description */}
          <Text style={styles.taskTitle} numberOfLines={2}>
            {translatedTaskData.description ||
              taskData.description ||
              t("taskApplicants.noDescription")}
          </Text>

          {/* Group/Broadcast chat — bulk tasks only (single tasks use 1:1 chat) */}
          {requiredWorkers > 1 && confirmedWorkers?.length > 0 && (
            <GroupChatButton
              style={{ marginTop: RFPercentage(0.5), width: "55%" }}
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
                size={RFPercentage(2.4)}
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
                size={RFPercentage(2.4)}
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
                size={RFPercentage(2.4)}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  taskHeader: {
    paddingTop: RFPercentage(15),
    paddingBottom: RFPercentage(3),
    paddingHorizontal: RFPercentage(3),
    borderBottomLeftRadius: RFPercentage(4),
    borderBottomRightRadius: RFPercentage(4),
    overflow: "hidden",
  },
  headerBackBtn: {
    width: RFPercentage(4.6),
    height: RFPercentage(4.6),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: -RFPercentage(6),
    left: 0,
  },
  taskHeaderContent: {
    alignItems: "center",
  },
  taskTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1.8),
    paddingVertical: RFPercentage(0.7),
    borderRadius: RFPercentage(3),
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(0.6),
    maxWidth: "90%",
  },
  taskTypeText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.heroTitleColor,
  },
  taskTitle: {
    fontSize: RFPercentage(2.1),
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
    marginBottom: RFPercentage(2),
    lineHeight: RFPercentage(2.8),
    color: Colors.heroTitleColor,
  },
  taskStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    borderRadius: RFPercentage(2.5),
    paddingVertical: RFPercentage(2),
    paddingHorizontal: RFPercentage(1.5),
    marginVertical: RFPercentage(2),
    backgroundColor: Colors.heroStatsBg,
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
    fontSize: RFPercentage(1.25),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    color: Colors.heroStatsLabel,
  },
  statDivider: {
    width: 1,
    height: "60%",
    backgroundColor: Colors.heroStatsDivider,
  },
  progressContainer: {
    width: "100%",
    marginTop: RFPercentage(0.5),
  },
  progressBar: {
    height: RFPercentage(1.1),
    borderRadius: RFPercentage(0.6),
    overflow: "hidden",
    marginBottom: RFPercentage(0.5),
    backgroundColor: Colors.white15,
  },
  progressFill: {
    height: "100%",
    borderRadius: RFPercentage(0.6),
  },
  progressText: {
    fontSize: RFPercentage(1.25),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    marginTop: RFPercentage(0.8),
    color: Colors.heroStatsLabel,
  },
  statusAlert: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1.3),
    paddingHorizontal: RFPercentage(2),
    borderRadius: RFPercentage(2),
    marginTop: RFPercentage(2),
    gap: RFPercentage(0.8),
    width: "100%",
    backgroundColor: Colors.heroStatsBg,
  },
  statusAlertText: {
    fontSize: RFPercentage(1.35),
    fontFamily: "Poppins_600SemiBold",
    color: Colors.heroTitleColor,
  },
});

export default TaskHeader;
