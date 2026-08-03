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

type ConfirmationModalType =
  | "delete"
  | "logout"
  | "warning"
  | "info"
  | "cancel";

interface ConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** App theme object (see contexts/colorTheme). */
  theme: any;
  /** i18next translate function. */
  t: (key: string, options?: any) => string;
  loading?: boolean;
  /**
   * Rendered inside a <Text> when truthy. Callers pass `false` to omit it,
   * so this is a ReactNode rather than a string.
   */
  message?: React.ReactNode;
  type?: ConfirmationModalType;
  /** Override for the confirm button label (defaults to buttons.yes). */
  confirmText?: string;
  /** When true: no Cancel button — single centered CTA + a close (X) icon top-right instead. */
  hideCancel?: boolean;
}

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
  confirmText, // Optional override for the confirm button label (defaults to buttons.yes)
  hideCancel = false, // When true: no Cancel button — single centered CTA + a close (X) icon top-right instead
}: ConfirmationModalProps) => {
  // Function to get icon based on type
  const getIconConfig = () => {
    switch (type) {
      case "logout":
        return {
          name: "logout",
          color: theme.warning || Colors.orange6,
        };
      case "warning":
        return {
          name: "warning",
          color: theme.warning || Colors.orange6,
        };
      case "info":
        return {
          name: "info",
          color: theme.info || Colors.grey2,
        };
      case "cancel":
        return {
          name: "cancel",
          color: theme.secondary || Colors.grey2,
        };
      case "delete":
      default:
        return {
          name: "delete",
          color: theme.error || Colors.dangerRed,
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
          {/* Close (X) — replaces the Cancel button for single-CTA modals */}
          {hideCancel && (
            <Pressable
              style={[
                styles.closeButton,
                { backgroundColor: theme.mode === "dark" ? Colors.darkGrey + "30" : "#00000010" },
              ]}
              onPress={onClose}
              hitSlop={10}
            >
              <MaterialIcons
                name="close"
                size={RFPercentage(2.2)}
                color={theme.darkGrey}
              />
            </Pressable>
          )}

          {/* Icon Container */}
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.mode === "dark" ?  Colors.darkGrey + "30" : `${iconConfig.color}15` }, 
              ]}
            >
              <MaterialIcons
                name={iconConfig.name as any}
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
          <View
            style={[
              styles.modalButtons,
              hideCancel && styles.modalButtonsCentered,
            ]}
          >
            {!hideCancel && (
              <Pressable
                style={[
                  styles.cancelButton,
                  { borderColor: theme.lightGrey },
                  confirmText && styles.cancelButtonCompact,
                ]}
                onPress={onClose}
              >
                <Text
                  style={[styles.cancelButtonText, { color: theme.lightGrey }]}
                >
                  {t("buttons.cancel")}
                </Text>
              </Pressable>
            )}

            <MyAppButton
              title={confirmText || t("buttons.yes")}
              marginTop={RFPercentage(0)}
              height={
                 RFPercentage(5)
              }
              // Custom CTAs (e.g. "Active Tasks") are longer than "Yes" — give
              // them more room instead of clipping to the default width. A
              // single centered CTA (no Cancel alongside it) gets even more.
              width={
                hideCancel
                  ? RFPercentage(28)
                  : confirmText
                    ? RFPercentage(21)
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
  closeButton: {
    position: "absolute",
    top: RFPercentage(1.2),
    right: RFPercentage(1.2),
    width: RFPercentage(3.4),
    height: RFPercentage(3.4),
    borderRadius: RFPercentage(1.7),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
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
  modalButtonsCentered: {
    justifyContent: "center",
  },
  cancelButton: {
    height:
       RFPercentage(5),
    width:
     RFPercentage(15),
    borderRadius: RFPercentage(100),
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonCompact: {
    width: RFPercentage(11),
  },
  cancelButtonText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
});