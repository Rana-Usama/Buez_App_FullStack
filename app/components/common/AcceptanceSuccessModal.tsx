import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Octicons, MaterialIcons } from "@expo/vector-icons";
import Colors from "../../config/Colors";
import { useTranslation } from "react-i18next";

const AcceptanceSuccessModal = ({
  visible,
  onClose,
  onViewRequests,
  theme,
}) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [slideAnim] = React.useState(new Animated.Value(300));
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      showModal();
    } else {
      hideModal();
    }
  }, [visible]);

  const showModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const InfoRow = ({ icon, title, description }) => (
    <View
      style={[
        styles.infoRow,
        {
          backgroundColor:
            theme.mode === "dark"
              ? Colors.whiteAlpha05
              : "rgba(0,0,0,0.02)",
        },
      ]}
    >
      <MaterialIcons
        name={icon}
        size={RFPercentage(3)}
        color={theme.primary}
        style={styles.infoRowIcon}
      />
      <View style={styles.infoRowText}>
        <Text style={[styles.infoRowTitle, { color: theme.heading }]}>
          {title}
        </Text>
        <Text style={[styles.infoRowDescription, { color: theme.darkGrey }]}>
          {description}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.mode === "dark" ? Colors.tabsBackgroundDark : Colors.white,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.modalIconContainer}>
            <Octicons
              name="check-circle"
              size={RFPercentage(6)}
              color={Colors.primary}
            />
          </View>

          {/* Title */}
          <Text style={[styles.modalTitle, { color: theme.heading }]}>
            {t("modal.txt1")}
          </Text>

          {/* Information Cards */}
          <ScrollView
            style={styles.modalInfoContainer}
            showsVerticalScrollIndicator={false}
          >
            <InfoRow
              icon="message"
              title={t("modal.txt2")}
              description={t("modal.txt3")}
            />

            <InfoRow
              icon="folder-special"
              title={t("modal.txt4")}
              description={t("modal.txt5")}
            />

            <InfoRow
              icon="notifications"
              title={t("modal.txt6")}
              description={t("modal.txt7")}
            />

            <InfoRow
              icon="schedule"
              title={t("modal.txt8")}
              description={t("modal.txt9")}
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.primaryModalButton,
                styles.touchableOpacity,
              ]}
              onPress={onClose}
            >
              <Text style={styles.primaryModalButtonText}>
                {t("modal.txt10")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.secondaryModalButton,
                { borderColor: theme.primary },
              ]}
              onPress={onViewRequests}
            >
              <Text
                style={[
                  styles.secondaryModalButtonText,
                  { color: theme.primary },
                ]}
              >
                {t("modal.txt11")}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: RFPercentage(3),
  },
  modalContainer: {
    width: "100%",
    maxHeight: "80%",
    borderRadius: RFPercentage(2),
    padding: RFPercentage(3),
    shadowColor: Colors.blackSolid,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalIconContainer: {
    alignItems: "center",
    marginBottom: RFPercentage(2),
    marginTop: RFPercentage(1),
  },
  gradientCircle: {
    width: RFPercentage(12),
    height: RFPercentage(12),
    borderRadius: RFPercentage(6),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  modalTitle: {
    fontSize: RFPercentage(2.1),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginBottom: RFPercentage(2),
  },
  modalInfoContainer: {
    maxHeight: RFPercentage(30),
    marginBottom: RFPercentage(2),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: RFPercentage(2),
    borderRadius: RFPercentage(1.5),
    marginBottom: RFPercentage(1.5),
  },
  infoRowIcon: {
    marginRight: RFPercentage(2),
    marginTop: RFPercentage(0.3),
  },
  infoRowText: {
    flex: 1,
  },
  infoRowTitle: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.5),
  },
  infoRowDescription: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    lineHeight: RFPercentage(2),
  },
  modalButtonContainer: {
    marginTop: RFPercentage(1),
  },
  primaryModalButton: {
    width: "100%",
    height: RFPercentage(6),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RFPercentage(1.5),
    marginBottom: RFPercentage(1.5),
  },
  primaryModalButtonText: {
    color: Colors.white,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
  secondaryModalButton: {
    width: "100%",
    height: RFPercentage(6),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: RFPercentage(1.5),
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  secondaryModalButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
    lineHeight: RFPercentage(1.8),
  },
  touchableOpacity: { backgroundColor: Colors.primary },
});

export default AcceptanceSuccessModal;
