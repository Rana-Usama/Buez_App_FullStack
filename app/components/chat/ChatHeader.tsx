import React, { memo } from "react";
import { View, TouchableOpacity, Image,Platform, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors";

type Props = {
  navigation: any;
  receiver: any;
  theme: any;
};

const ChatHeader = memo(({ navigation, receiver, theme }: Props) => {
  return (
    <View style={[styles.profileContainer, { borderBottomColor: Colors.white5 }]}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={RFPercentage(2.7)} color={theme.heading} />
      </TouchableOpacity>

      <View style={{ marginLeft: RFPercentage(2.5) }}>
        {receiver?.profileImage ? (
          <Image source={{ uri: receiver.profileImage }} resizeMode="cover" style={styles.profile} />
        ) : (
          <View style={styles.noProfile}>
            <Text style={[styles.noProfileInner, { color: theme.primary }]}>
              {receiver?.userName?.[0]}
            </Text>
          </View>
        )}
      </View>

      <View style={{ marginLeft: RFPercentage(1.5), width: "60%" }}>
        <Text
          style={{
            color: theme.heading,
            fontSize: RFPercentage(2),
            fontFamily: "Poppins_500Medium",
          }}
        >
          {receiver?.userName}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  profileContainer: {
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    height: RFPercentage(8.6),
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
    marginTop: Platform?.OS === "android" ? RFPercentage(5) : RFPercentage(3),
    paddingHorizontal: RFPercentage(2),
  },
  profile: {
    width: RFPercentage(7),
    height: RFPercentage(7),
    borderRadius: RFPercentage(100),
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  noProfile: {
    width: RFPercentage(7),
    height: RFPercentage(7),
    borderRadius: RFPercentage(100),
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  noProfileInner: {
    fontSize: RFPercentage(2.5),
    fontFamily: "Poppins_500Medium",
    lineHeight: RFPercentage(2.6),
    top: 3,
  },
});

export default ChatHeader;