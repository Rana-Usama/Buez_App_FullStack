import React from "react";
import { StyleSheet, Image } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { LinearGradient } from "expo-linear-gradient";

// config
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { getAuth } from "firebase/auth";
import SubscriptionListener from "../components/SubscriptionListener";
import { Icons } from "../config/theme";

function DeciderScreen({ navigation }) {
  const userId = getAuth()?.currentUser?.uid;
  const { userData, loading } = useUser();
  console.log("DECIDER: user", userData, loading, userId);
  return (
    <>
      {!userId || loading || !userData ? (
        <LinearGradient colors={[Colors.white, Colors.white]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.container}>
          <Image style={styles.img} source={Icons.buez} />
        </LinearGradient>
      ) : (
        <SubscriptionListener navigation={navigation} userId={userId} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  img: { width: RFPercentage(10), height: RFPercentage(10) },
});

export default DeciderScreen;
