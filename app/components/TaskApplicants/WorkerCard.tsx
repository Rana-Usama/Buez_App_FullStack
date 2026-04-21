import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAppTheme } from "../../contexts/themeContext";
import Colors from "../../config/Colors";
import { Icons } from "../../config/theme";
import { Worker } from "../../types/TaskApplicants/types";

interface WorkerCardProps {
  worker: Worker;
  isConfirmed: boolean;
  isConfirming?: boolean;
  isRemoving?: boolean;
  isLimitReached?: boolean;
  onConfirm?: () => void;
  onRemove?: () => void;
  onViewProfile?: () => void;
  t: (key: string, options?: any) => string;
}

const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  isConfirmed,
  isConfirming = false,
  isRemoving = false,
  isLimitReached = false,
  onConfirm,
  onRemove,
  onViewProfile,
  t,
}) => {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.workerCard,
        {
          backgroundColor: theme.white,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Worker Info */}
      <TouchableOpacity
        style={styles.workerInfo}
        onPress={onViewProfile}
        activeOpacity={0.7}
      >
        <Image
          source={worker.profileImage ? { uri: worker.profileImage } : Icons.dp}
          style={[
            styles.workerAvatar,
            { borderColor: Colors.workerAvatarBorder(Colors.primary) },
          ]}
        />
        <View style={styles.workerDetails}>
          <Text style={[styles.workerName, { color: theme.heading }]}>
            {worker.userName}
          </Text>
          <View style={styles.workerMeta}>
            <Ionicons
              name="mail"
              size={RFPercentage(1.4)}
              color={theme.darkGrey}
            />
            <Text
              style={[styles.workerEmail, { color: theme.darkGrey }]}
              numberOfLines={1}
            >
              {worker.email || t("taskApplicants.noEmail")}
            </Text>
          </View>
          {isConfirmed && worker.confirmedAt && (
            <View style={styles.workerMeta}>
              <Ionicons
                name="time"
                size={RFPercentage(1.4)}
                color={Colors.statusAlertSuccess}
              />
              <Text
                style={[
                  styles.confirmedTime,
                  { color: Colors.statusAlertSuccess },
                ]}
              >
                {t("taskApplicants.confirmedTime")}{" "}
                {new Date(worker.confirmedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {isConfirmed ? (
          // Remove Button
          <TouchableOpacity
            style={[styles.removeButton, isRemoving && styles.buttonDisabled]}
            onPress={onRemove}
            disabled={isRemoving}
            activeOpacity={0.7}
          >
            {isRemoving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons
                  name="close-circle"
                  size={RFPercentage(1.8)}
                  color="#FFF"
                />
                <Text numberOfLines={1} style={styles.removeButtonText}>
                  {t("taskApplicants.remove")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          // Confirm Button
          <TouchableOpacity
            style={[
              styles.confirmButton,
              (isConfirming || isLimitReached) && styles.buttonDisabled,
            ]}
            onPress={onConfirm}
            disabled={isConfirming || isLimitReached}
            activeOpacity={0.7}
          >
            {isConfirming ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons
                  name={isLimitReached ? "checkmark-done" : "checkmark-circle"}
                  size={RFPercentage(1.8)}
                  color="#FFF"
                />
                <Text numberOfLines={1} style={styles.confirmButtonText}>
                  {isLimitReached
                    ? t("taskApplicants.allSlotsFilled")
                    : t("taskApplicants.confirm")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* View Profile Button */}
        <TouchableOpacity
          style={[
            styles.profileButton,
            {
              backgroundColor:
                theme.mode === "dark"
                  ? "rgba(71, 72, 82, 0.71)"
                  : Colors.profileButtonBg,
              borderColor:
                theme.mode === "dark"
                  ? "rgba(71, 72, 82, 0.71)"
                  : Colors.profileButtonBg,
            },
          ]}
          onPress={onViewProfile}
          activeOpacity={0.7}
        >
          <Ionicons
            name="person"
            size={RFPercentage(1.8)}
            color={theme.mode === "dark" ? Colors.white : Colors.primary}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.profileButtonText,
              { color: theme.mode === "dark" ? Colors.white : Colors.primary },
            ]}
          >
            {t("taskApplicants.profile")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  workerCard: {
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2),
    marginBottom: RFPercentage(1.5),
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  workerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(1.5),
  },
  workerAvatar: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(3),
    marginRight: RFPercentage(1.5),
    borderWidth: 2,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.3),
  },
  workerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: RFPercentage(0.2),
    gap: RFPercentage(0.5),
  },
  workerEmail: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
    flex: 1,
  },
  confirmedTime: {
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
  },
  actionButtons: {
    flexDirection: "row",
    gap: RFPercentage(1),
  },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.secondary,
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1.5),
    gap: RFPercentage(0.5),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: RFPercentage(2),
  },
  confirmButtonText: {
    color: "#FFF",
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  removeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.buttonRemove,
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1.5),
    gap: RFPercentage(0.5),
    shadowColor: Colors.buttonRemoveShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: RFPercentage(2),
  },
  removeButtonText: {
    color: "#FFF",
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  profileButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.profileButtonBg,
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    gap: RFPercentage(0.5),
    borderColor: Colors.profileButtonBg,
  },
  profileButtonText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default WorkerCard;
