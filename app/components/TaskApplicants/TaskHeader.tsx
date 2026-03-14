import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAppTheme } from "../../contexts/themeContext";
import Colors from "../../config/Colors";
import { TaskData, TranslatedTaskData } from "../../types/TaskApplicants/types";

interface TaskHeaderProps {
  taskData: TaskData | null;
  confirmedWorkers: any[];
  translatedTaskData: TranslatedTaskData;
  t: (key: string, options?: any) => string;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({
  taskData,
  confirmedWorkers,
  translatedTaskData,
  t,
}) => {
  const { theme } = useAppTheme();

  if (!taskData) return null;

  // ── CALCULATIONS ──
  const requiredWorkers = taskData.numberOfWorkers || 1;
  const isFull = confirmedWorkers.length >= requiredWorkers;
  const availableSpots = requiredWorkers - confirmedWorkers.length;

  return (
    <View style={[styles.taskHeader, { backgroundColor: theme.white }]}>
      <View style={styles.taskHeaderContent}>
        {/* Task Type Badge */}
        <View
          style={[
            styles.taskTypeBadge,
            { backgroundColor: Colors.taskTypeBadgeBg(Colors.primary) },
          ]}
        >
          <Ionicons
            name="briefcase"
            size={RFPercentage(2)}
            color={Colors.primary}
          />
          <Text style={[styles.taskTypeText, { color: Colors.primary }]}>
            {taskData.taskType === "Other"
              ? translatedTaskData.customTaskTitle || taskData.customTaskTitle
              : translatedTaskData.taskType || taskData.taskType}
          </Text>
        </View>

        {/* Task Description */}
        <Text style={[styles.taskTitle, { color: theme.heading }]} numberOfLines={2}>
          {translatedTaskData.description ||
            taskData.description ||
            t("taskApplicants.noDescription")}
        </Text>

        {/* Task Stats */}
        <View
          style={[
            styles.taskStats,
            {
              backgroundColor: theme.mode === "dark" ? theme.primary + "20" : "#F8F9FA",
            },
          ]}
        >
          <View style={styles.statItem}>
            <Ionicons name="people" size={RFPercentage(2)} color={theme.darkGrey} />
            <Text style={[styles.statValue, { color: theme.heading }]}>
              {requiredWorkers}
            </Text>
            <Text style={[styles.statLabel, { color: theme.darkGrey }]}>
              {t("taskApplicants.helpersNeeded")}
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

          <View style={styles.statItem}>
            <Ionicons
              name="checkmark-circle"
              size={RFPercentage(2)}
              color={Colors.statusAlertSuccess}
            />
            <Text style={[styles.statValue, { color: Colors.statusAlertSuccess }]}>
              {confirmedWorkers.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.darkGrey }]}>
              {t("taskApplicants.confirmed")}
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

          <View style={styles.statItem}>
            <Ionicons
              name={isFull ? "checkmark-done-circle" : "alert-circle"}
              size={RFPercentage(2)}
              color={isFull ? Colors.statusAlertSuccess : Colors.statusAlertWarning}
            />
            <Text
              style={[
                styles.statValue,
                {
                  color: isFull ? Colors.statusAlertSuccess : Colors.statusAlertWarning,
                },
              ]}
            >
              {isFull
                ? t("taskApplicants.full")
                : t("taskApplicants.spotsLeft", { spots: availableSpots })}
            </Text>
            <Text style={[styles.statLabel, { color: theme.darkGrey }]}>
              {t("taskApplicants.status")}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((confirmedWorkers.length / requiredWorkers) * 100, 100)}%`,
                  maxWidth: "100%",
                  backgroundColor: isFull ? Colors.statusAlertSuccess : Colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.darkGrey }]}>
            {t("taskApplicants.progress", {
              current: confirmedWorkers.length,
              total: requiredWorkers,
            })}
          </Text>
        </View>

        {/* Status Alert */}
        {isFull && (
          <View
            style={[
              styles.statusAlert,
              { backgroundColor: Colors.statusAlertSuccessBg(Colors.statusAlertSuccess) },
            ]}
          >
            <Ionicons
              name="checkmark-done"
              size={RFPercentage(1.8)}
              color={Colors.statusAlertSuccess}
            />
            <Text
              style={[styles.statusAlertText, { color: Colors.statusAlertSuccess }]}
            >
              {t("taskApplicants.allHelpersConfirmed")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  taskHeader: {
    paddingTop: RFPercentage(2),
    paddingBottom: RFPercentage(4),
    paddingHorizontal: RFPercentage(3),
    borderBottomLeftRadius: RFPercentage(3),
    borderBottomRightRadius: RFPercentage(3),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  taskHeaderContent: {
    alignItems: "center",
  },
  taskTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(1.5),
    paddingVertical: RFPercentage(0.8),
    borderRadius: RFPercentage(2),
    marginBottom: RFPercentage(1.5),
    gap: RFPercentage(0.5),
  },
  taskTypeText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  taskTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginBottom: RFPercentage(2),
    lineHeight: RFPercentage(2.4),
  },
  taskStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2),
    marginBottom: RFPercentage(2),
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_700Bold",
    marginTop: RFPercentage(0.5),
    marginBottom: RFPercentage(0.3),
  },
  statLabel: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
  },
  progressContainer: {
    width: "100%",
    marginTop: RFPercentage(1),
  },
  progressBar: {
    height: RFPercentage(1),
    borderRadius: RFPercentage(0.5),
    overflow: "hidden",
    marginBottom: RFPercentage(0.5),
  },
  progressFill: {
    height: "100%",
    borderRadius: RFPercentage(0.5),
  },
  progressText: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    marginTop: RFPercentage(0.8),
  },
  statusAlert: {
    flexDirection: "row",
    alignItems: "center",
    padding: RFPercentage(1.5),
    borderRadius: RFPercentage(1.5),
    marginTop: RFPercentage(2),
    gap: RFPercentage(0.8),
    width: "100%",
  },
  statusAlertText: {
    flex: 1,
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_600SemiBold",
  },
});

export default TaskHeader;