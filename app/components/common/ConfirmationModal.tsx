import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { RFPercentage } from "react-native-responsive-fontsize";
import MyAppButton from "./MyAppButton";
import { MaterialIcons } from "@expo/vector-icons"; // You can use any icon library
import Colors from "../../config/Colors";

const ConfirmationModal = ({
  isVisible,
  onClose,
  onConfirm,
  title,
  theme,
  t,
  loading,
  message,
  type = "info", // Default type is "delete", other options: "logout", "warning", "info", "cancel"
}) => {
  // Function to get icon based on type
  const getIconConfig = () => {
    switch (type) {
      case "logout":
        return {
          name: "logout",
          color: theme.warning || "#FFA726",
        };
      case "warning":
        return {
          name: "warning",
          color: theme.warning || "#FFA726",
        };
      case "info":
        return {
          name: "info",
          color: theme.info || "#757575",
        };
      case "cancel":
        return {
          name: "cancel",
          color: theme.secondary || "#757575",
        };
      case "delete":
      default:
        return {
          name: "delete",
          color: theme.error || "#F44336",
        };
    }
  };

  const iconConfig = getIconConfig();

  return (
    <Modal
      animationType="none"
      transparent
      visible={isVisible}
      onRequestClose={onClose}
    >
      <BlurView
        intensity={8}
        style={[styles.modalBackground, { backgroundColor: theme.modal }]}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.white }]}>
          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.mode === "dark" ?  Colors.darkGrey + "30" : `${iconConfig.color}15` }, 
              ]}
            >
              <MaterialIcons
                name={iconConfig.name}
                size={RFPercentage(3.5)}
                color={iconConfig.color}
              />
            </View>
          </View>

          <Text style={[styles.modalText, { color: theme.heading }]}>
            {title}
          </Text>
          {message && (
            <Text
              style={[
                styles.messageText,
                { color: theme.darkGrey },
              ]}
            >
              {message}
            </Text>
          )}
          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.cancelButton, { borderColor: theme.lightGrey }]}
              onPress={onClose}
            >
              <Text
                style={[styles.cancelButtonText, { color: theme.lightGrey }]}
              >
                {t("buttons.cancel")}
              </Text>
            </Pressable>

            <MyAppButton
              title={t("buttons.yes")}
              marginTop={RFPercentage(0)}
              height={
                Platform.OS === "android"
                  ? RFPercentage(5.8)
                  : RFPercentage(5)
              }
              width={
                Platform.OS === "android"
                  ? RFPercentage(17)
                  : RFPercentage(15)
              }
              onPress={onConfirm}
              loading={loading}
              borderRadius={RFPercentage(100)}

              // You can add color prop to MyAppButton based on type if needed
              // backgroundColor={iconConfig.color}
            />
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

export default ConfirmationModal;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    borderRadius: 14,
    paddingVertical: RFPercentage(3),
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    // marginBottom: RFPercentage(2),
    alignItems: "center",
  },
  iconCircle: {
    width: RFPercentage(8),
    height: RFPercentage(8),
    borderRadius: RFPercentage(4),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  modalText: {
    fontSize: RFPercentage(1.7),
    // marginBottom: RFPercentage(1),
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    marginHorizontal: RFPercentage(1),
    marginVertical:RFPercentage(1.5)
  },
  messageText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    width: "75%",
    textAlign: "center",
    marginBottom: RFPercentage(2),
    lineHeight: RFPercentage(2.2),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: RFPercentage(1),
    width: "90%",
    paddingHorizontal: RFPercentage(0.5),
  },
  cancelButton: {
    height:
      Platform.OS === "android" ? RFPercentage(5.8) : RFPercentage(5),
    width:
      Platform.OS === "android" ? RFPercentage(17) : RFPercentage(15),
    borderRadius: RFPercentage(100),
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
});