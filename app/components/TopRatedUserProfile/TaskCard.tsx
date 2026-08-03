import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors";

export default function TaskCard({
  item,
  translatedText,
  t,
  theme,
  translatedTaskType,
}: any) {
  return (
    <View
      style={{
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: RFPercentage(1.6),
        borderWidth: 1,
        width: "90%",
        alignSelf: "center",
        backgroundColor:
          theme.mode === "dark" ? Colors.whiteAlpha04 : Colors.white,
        borderColor:
          theme.mode === "dark"
            ? Colors.whiteAlpha10
            : Colors.slateAlpha08,
      }}
    >
      <Image
        source={{ uri: item.taskDetails.imageUrls?.[0] }}
        style={styles.image}
      />
      <View style={styles.view}>
        <Text
          style={{
            fontSize: RFPercentage(1.5),
            fontFamily: "Poppins_500Medium",
            marginBottom: RFPercentage(0.5),
            color: theme.heading,
          }}
        >
          {translatedText ?? item.taskDetails.description}
        </Text>
        <Text style={{ fontSize: RFPercentage(1.2), color: theme.grey }}>
          {t("myRequests.txt3")}{" "}
          {item.completedAt
            ? new Date(
                item.completedAt.seconds
                  ? item.completedAt.seconds * 1000
                  : item.completedAt,
              ).toLocaleDateString()
            : ""}
        </Text>
      </View>
      <View
        style={styles.view2}
      >
        <Text
          numberOfLines={1}
          style={styles.text}
        >
          {translatedTaskType ?? item.taskDetails.taskType}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: "100%", height: RFPercentage(20) },
  view: { padding: RFPercentage(2) },
  view2: {
          backgroundColor: Colors.slateAlpha55,
          borderWidth: 1,
          borderColor: Colors.whiteAlpha22,
          paddingVertical: RFPercentage(0.6),
          paddingHorizontal: RFPercentage(1.4),
          maxWidth: "60%",
          borderRadius: RFPercentage(100),
          alignItems: "center",
          justifyContent: "center",
          position: "absolute",
          top: RFPercentage(1),
          right: RFPercentage(1),
        },
  text: {
            fontSize: RFPercentage(1.3),
            color: Colors.white,
            fontFamily: "Poppins_600SemiBold",
          },
});
