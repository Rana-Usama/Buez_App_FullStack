import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors";

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  theme: any;
  t: any;
};

const GroupDeleteModal = memo(({ visible, onConfirm, onCancel, theme, t }: Props) => {
  if (!visible) return null;
  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContainer, { backgroundColor: theme.white }]}>
        <Text style={[styles.modalTitle, { color: theme.heading }]}>{t("chat.txt3")}</Text>
        <Text style={[styles.modalText, { color: theme.darkGrey }]}>{t("chat.txt4")}</Text>
        <View style={styles.modalButtons}>
          <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.lightGrey }]} onPress={onCancel}>
            <Text style={{ color: theme.heading, fontFamily: "Poppins_500Medium" }}>{t("buttons.cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={onConfirm}>
            <Text style={styles.deleteBtnText}>{t("chat.txt5")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modalContainer: {
    width: "80%",
    borderRadius: RFPercentage(2),
    padding: RFPercentage(3),
  },
  modalTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_700Bold",
    marginBottom: RFPercentage(1),
  },
  modalText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    marginBottom: RFPercentage(2),
  },
  modalButtons: {
    flexDirection: "row",
    gap: RFPercentage(1),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: RFPercentage(1.2),
    borderRadius: RFPercentage(100),
    borderWidth: 1,
    alignItems: "center",
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: RFPercentage(1.2),
    borderRadius: RFPercentage(100),
    backgroundColor: "#F44336",
    alignItems: "center",
  },
  deleteBtnText: {
    color: "#FFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: RFPercentage(1.5),
  },
});

export default GroupDeleteModal;