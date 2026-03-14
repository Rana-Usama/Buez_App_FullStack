import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAppTheme } from "../../contexts/themeContext";
import Colors from "../../config/Colors";
import { ModalButton } from "../../types/TaskApplicants/types";


const { width } = Dimensions.get("window");

interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  buttons: ModalButton[];
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  title,
  message,
  type = "info",
  buttons,
}) => {
  const { theme } = useAppTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  // ── ANIMATIONS ──
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // ── TYPE COLORS ──
  const getTypeColors = () => {
    switch (type) {
      case "warning":
        return {
          primary: Colors.statusAlertWarning,
          gradient: [Colors.statusAlertWarning, "#F57C00"],
          icon: "alert-circle" as const,
          iconColor: Colors.statusAlertWarning,
        };
      case "success":
        return {
          primary: Colors.statusAlertSuccess,
          gradient: Colors.modalSuccessGradient as [string, string],
          icon: "checkmark-circle" as const,
          iconColor: Colors.statusAlertSuccess,
        };
      case "error":
        return {
          primary: Colors.statusAlertError,
          gradient: Colors.modalErrorGradient as [string, string],
          icon: "close-circle" as const,
          iconColor: Colors.statusAlertError,
        };
      case "info":
      default:
        return {
          primary: Colors.primary,
          gradient: [Colors.primary, "#314495"] as [string, string],
          icon: "information-circle" as const,
          iconColor: Colors.primary,
        };
    }
  };

  const typeColors = getTypeColors();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[
          styles.modalOverlay,
          {
            opacity: fadeAnim,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
          },
        ]}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ scale: scaleAnim }],
                backgroundColor: theme.white,
              },
            ]}
          >
            {/* Header */}
            <LinearGradient
              colors={typeColors.gradient}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.headerContent}>
                <Ionicons name={typeColors.icon} size={RFPercentage(2.5)} color="#FFF" />
                <Text style={styles.modalTitle}>{title}</Text>
              </View>
            </LinearGradient>

            {/* Body */}
            <View style={styles.modalBody}>
              <Text style={[styles.modalMessage, { color: theme.heading }]}>
                {message}
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === "destructive" && styles.destructiveButton,
                    button.style === "primary" && styles.primaryButton,
                    buttons.length === 1 && styles.singleButton,
                  ]}
                  onPress={() => {
                    if (button.onPress) button.onPress();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={
                      button.style === "primary"
                        ? typeColors.gradient
                        : button.style === "destructive"
                          ? Colors.modalDestructiveGradient as [string, string]
                          : [theme.border, theme.border + "80"]
                    }
                    style={[
                      styles.buttonGradient,
                      button.style === "cancel" && styles.cancelButtonGradient,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        button.style === "cancel" && { color: theme.heading },
                        (button.style === "primary" || button.style === "destructive") && {
                          color: "#FFF",
                        },
                      ]}
                    >
                      {button.text}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: RFPercentage(2.5),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    paddingVertical: RFPercentage(2),
    paddingHorizontal: RFPercentage(3),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1),
  },
  modalTitle: {
    color: "#FFF",
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_700Bold",
    flex: 1,
  },
  modalBody: {
    padding: RFPercentage(3),
  },
  modalMessage: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
    lineHeight: RFPercentage(2.2),
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    paddingHorizontal: RFPercentage(2),
    paddingBottom: RFPercentage(2),
    gap: RFPercentage(1),
  },
  button: {
    flex: 1,
    borderRadius: RFPercentage(1.5),
    overflow: "hidden",
    height: RFPercentage(5),
  },
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonGradient: {
    backgroundColor: "transparent",
  },
  primaryButton: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  destructiveButton: {
    shadowColor: Colors.buttonRemoveShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  singleButton: {
    width: "100%",
  },
  buttonText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_600SemiBold",
  },
});

export default ConfirmationModal;