import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";
import Colors from "../../config/Colors";
import { RFPercentage } from "react-native-responsive-fontsize";
import { Icons } from "../../config/theme";
import { useAppTheme } from "../../contexts/themeContext";

interface NotFoundProps {
  title: string;
}

const NotFound: React.FC<NotFoundProps> = ({ title }) => {
  const {theme} = useAppTheme()
  const isDark = theme.mode === "dark";
  return (
    <View style={styles.notFoundWrapper}>
      <View
        style={[
          styles.emptyIllustrationWrap,
          { backgroundColor: isDark ? theme.lightWhite : "#EEF1FB" },
        ]}
      >
        <Image
          source={Icons.empty}
          style={styles.emptyIllustration}
          resizeMode="contain"
        />
      </View>
      <Text style={[styles.notFoundText, {color:theme.darkGrey}]}>{title}</Text>
    </View>
  );
};

export default NotFound;

const styles = StyleSheet.create({
  notFoundWrapper: { marginTop: RFPercentage(20), justifyContent: "center", alignItems: "center" },
  emptyIllustrationWrap: {
    width: RFPercentage(24),
    height: RFPercentage(24),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: RFPercentage(3),
  },
  emptyIllustration: {
    width: RFPercentage(15),
    height: RFPercentage(15),
  },
  notFoundText: { color: Colors.darkGrey, fontSize: RFPercentage(1.8), fontFamily: "Poppins_400Regular" },
});
