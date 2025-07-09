import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { RFPercentage } from "react-native-responsive-fontsize";
import MyAppButton from "./MyAppButton";

const ConfirmationModal = ({ isVisible, onClose, onConfirm, title, theme, t }) => {
  return (
    <Modal animationType="fade" transparent visible={isVisible} onRequestClose={onClose}>
      <BlurView intensity={100} style={[styles.modalBackground, { backgroundColor: theme.modal }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.white }]}>
          <Text style={[styles.modalText, { color: theme.heading }]}>{title}</Text>

          <View style={styles.modalButtons}>
            <Pressable style={[styles.cancelButton, { borderColor: theme.border }]} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: theme.border }]}>{t("buttons.cancel")}</Text>
            </Pressable>

            <MyAppButton title={t("buttons.yes")} marginTop={RFPercentage(0)} height={RFPercentage(5.8)} width={RFPercentage(17)} onPress={onConfirm} />
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
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: RFPercentage(2),
    width: "100%",
    paddingHorizontal:RFPercentage(2)
  },
  cancelButton: {
    height: RFPercentage(5.8),
    width: RFPercentage(17),
    borderRadius: RFPercentage(100),
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_500Medium",
  },
});
