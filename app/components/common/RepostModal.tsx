import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Feather from "@expo/vector-icons/Feather";
import Colors from "../../config/Colors";

const RepostSuccessModal = ({ isVisible, onClose, theme, t }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Fade in when modal becomes visible
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out smoothly before closing
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay]}>
        <Animated.View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.white, opacity: fadeAnim },
          ]}
        >
          <View style={styles.iconContainer}>
            <Feather
              name="check-circle"
              size={RFPercentage(8)}
              color={Colors.primary}
            />
          </View>

          <Text style={[styles.title, { color: theme.heading }]}>
            {t("myRequests.repostSuccess") || "Request Reposted!"}
          </Text>

          <Text style={[styles.message, { color: theme.darkGrey }]}>
            {t("myRequests.repostAvailable") ||
              "Your request has been reposted and is now available for other users to accept."}
          </Text>

          <TouchableOpacity
            style={[styles.button, styles.touchableOpacity]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {t("common.gotIt") || "Got It"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.blackAlpha60,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: RFPercentage(2),
  },
  modalContainer: {
    width: "100%",
    borderRadius: RFPercentage(2),
    padding: RFPercentage(3),
    alignItems: "center",
    shadowColor: Colors.blackSolid,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: RFPercentage(2),
  },
  title: {
    fontSize: RFPercentage(2.2),
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    marginBottom: RFPercentage(1),
  },
  message: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: RFPercentage(3),
    lineHeight: RFPercentage(2.5),
  },
  button: {
    width: "100%",
    paddingVertical: RFPercentage(1.5),
    borderRadius: RFPercentage(1),
    alignItems: "center",
  },
  buttonText: {
    color: Colors.white,
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
  },
  touchableOpacity: { backgroundColor: Colors.primary },
});

export default RepostSuccessModal;
