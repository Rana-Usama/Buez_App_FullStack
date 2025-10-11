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

const AcceptanceSuccessModal = ({
  visible,
  onClose,
  onViewRequests,
  theme,
}) => {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [slideAnim] = React.useState(new Animated.Value(300));

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
              ? "rgba(255,255,255,0.05)"
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
              backgroundColor: theme.mode === "dark" ? "#1a1a1a" : Colors.white,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.modalIconContainer}>
            <Octicons
              name="check-circle"
              size={RFPercentage(8)}
              color={Colors.primary}
            />
          </View>

          {/* Title */}
          <Text style={[styles.modalTitle, { color: theme.heading }]}>
            Task Accepted Successfully!
          </Text>

          {/* Information Cards */}
          <ScrollView
            style={styles.modalInfoContainer}
            showsVerticalScrollIndicator={false}
          >
            <InfoRow
              icon="message"
              title="Start Communicating"
              description="You can now message the requester to discuss task details and arrangements."
            />

            <InfoRow
              icon="folder-special"
              title="Find in My Requests"
              description="This task will appear in 'My Requests' tab under 'Accepted' filter for easy access."
            />

            <InfoRow
              icon="notifications"
              title="Stay Updated"
              description="You'll receive notifications about any updates or messages from the requester."
            />

            <InfoRow
              icon="schedule"
              title="Next Steps"
              description="Coordinate with the requester to schedule and complete the task successfully."
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.primaryModalButton,
                { backgroundColor: Colors.primary },
              ]}
              onPress={onClose}
            >
              <Text style={styles.primaryModalButtonText}>Got It!</Text>
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
                View My Requests
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
    shadowColor: "#000",
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
    fontSize: RFPercentage(2.5),
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
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(0.5),
  },
  infoRowDescription: {
    fontSize: RFPercentage(1.5),
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
});

export default AcceptanceSuccessModal;
