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

const ConfirmationModal = ({
  isVisible,
  onClose,
  onConfirm,
  title,
  theme,
  t,
  loading,
  message,
}) => {
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
          <Text style={[styles.modalText, { color: theme.heading }]}>
            {title}
          </Text>
          {message && (
            <Text style={[styles.modalText, { color: theme.darkGrey, fontSize:RFPercentage(1.6),fontFamily:"Poppins_400Regular"  , width:"75%"}]}>
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
                Platform.OS === "android" ? RFPercentage(5.8) : RFPercentage(5)
              }
              width={
                Platform.OS === "android" ? RFPercentage(17) : RFPercentage(15)
              }
              onPress={onConfirm}
              loading={loading}
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
    paddingVertical: RFPercentage(4),
    alignItems: "center",
    justifyContent: "center",
  },
  modalText: {
    fontSize: RFPercentage(2),
    marginBottom: RFPercentage(2),
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    marginHorizontal: RFPercentage(1),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: RFPercentage(2),
    width: "100%",
    paddingHorizontal: RFPercentage(2),
  },
  cancelButton: {
    height: Platform.OS === "android" ? RFPercentage(5.8) : RFPercentage(5),
    width: Platform.OS === "android" ? RFPercentage(17) : RFPercentage(15),
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
