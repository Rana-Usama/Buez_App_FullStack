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

const DeleteModal = memo(({ visible, onConfirm, onCancel, theme, t }: Props) => {
  if (!visible) return null;
  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContainer, { backgroundColor: theme.white }]}>
        <Text style={[styles.modalTitle, { color: theme.heading }]}>
          {t("chat.txt3")}
        </Text>
        <Text style={[styles.modalText, { color: theme.darkGrey }]}>
          {t("chat.txt4")}
        </Text>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.cancel, { borderColor: theme.lightGrey }]}
            onPress={onCancel}
          >
            <Text
              style={{
                color: theme.heading,
                fontFamily: "Poppins_500Medium",
                fontSize: RFPercentage(1.7),
              }}
            >
              {t("buttons.cancel")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.markButton}
            onPress={onConfirm}
          >
            <Text style={styles.txt}>{t("chat.txt5")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  modalContainer: {
    width: "80%",
    borderRadius: RFPercentage(2),
    padding: RFPercentage(2),
    paddingVertical: RFPercentage(3),
  },
  modalTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1),
  },
  modalText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    marginBottom: RFPercentage(2),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancel: {
    borderRadius: RFPercentage(100),
    width: RFPercentage(15.5),
    height: RFPercentage(5.2),
    borderWidth: RFPercentage(0.2),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  markButton: {
    borderRadius: RFPercentage(100),
    height: RFPercentage(5.2),
    borderColor: "#F44336",
    borderWidth: RFPercentage(0.1),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F44336",
    width: RFPercentage(15.5),
  },
  txt: {
    color: "white",
    fontFamily: "Poppins_500Medium",
    fontSize: RFPercentage(1.7),
  },
});

export default DeleteModal;