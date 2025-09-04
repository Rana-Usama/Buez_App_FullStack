import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

const NetworkErrorScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Problem</Text>
      <Text style={styles.subtitle}>
        We couldn’t fetch data from Firebase. Please check your internet
        connection and try again.
      </Text>
      <Button title="Retry" onPress={() => { /* reload logic */ }} />
    </View>
  );
};

export default NetworkErrorScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 14, color: "gray", textAlign: "center", marginBottom: 20 },
});
