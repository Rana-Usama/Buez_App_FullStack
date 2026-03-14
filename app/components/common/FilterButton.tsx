import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../../app/config/Colors";

type Props = {
  title: string;
  isActive?: boolean;
  isFirst?: boolean;
  onPress?: () => void;
};

export default function FilterButton({ title, isActive = false, isFirst = false, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.button,
        isActive ? styles.active : styles.inactive,
        isFirst ? styles.first : null,
      ]}
    >
      <Text style={[styles.text, isActive ? styles.textActive : styles.textInactive]} numberOfLines={1}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: RFPercentage(2.5),
    paddingVertical: RFPercentage(1.1),
    borderRadius: 25,
    marginRight: RFPercentage(1.2),
  },
  first: {
    marginLeft: RFPercentage(2),
  },
  active: {
    backgroundColor: Colors.primary,
  },
  inactive: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "transparent",
  },
  text: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_600SemiBold",
  },
  textActive: {
    color: Colors.white,
  },
  textInactive: {
    color: Colors.primary,
  },
});