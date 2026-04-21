import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useAppTheme } from "../../contexts/themeContext";
import Colors from "../../config/Colors";

interface GroupChatButtonProps {
  onPress: () => void;
  t: (key: string) => string;
  style?:object
}

const GroupChatButton: React.FC<GroupChatButtonProps> = ({ onPress, t, style }) => {
  const { theme } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.groupChatBtn, { backgroundColor: theme.secondary }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="people" size={RFPercentage(2)} color="#FFF" />
      <Text numberOfLines={1} style={styles.groupChatBtnText}>
        {t("taskApplicants.group")}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  groupChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: RFPercentage(1.5),
    paddingHorizontal: RFPercentage(3),
    borderRadius: RFPercentage(3),
    marginTop: RFPercentage(2),
    width: "40%",
    gap: RFPercentage(1),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    alignSelf: "center",
  },
  groupChatBtnText: {
    color: "#FFF",
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
  },
});

export default GroupChatButton;