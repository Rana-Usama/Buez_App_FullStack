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
  return (
    <View style={styles.notFoundWrapper}>
      <Image style={styles.notFoundImg} source={Icons.empty} />
      <Text style={[styles.notFoundText, {color:theme.darkGrey}]}>{title}</Text>
    </View>
  );
};

export default NotFound;

const styles = StyleSheet.create({
  notFoundWrapper: { marginTop: RFPercentage(30), justifyContent: "center", alignItems: "center" },
  notFoundImg: { borderRadius: RFPercentage(1), width: RFPercentage(16), height: RFPercentage(16), marginBottom: RFPercentage(2) },
  notFoundText: { color: Colors.darkGrey, fontSize: RFPercentage(1.8), fontFamily: "Poppins_400Regular" },
});
