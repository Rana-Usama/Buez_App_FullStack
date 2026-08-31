import React, { memo } from "react";
import {
  View,
  TouchableOpacity,
  Platform,
  Text,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors";
import AvatarInitials from "../common/DefaultAvatars";
import { getAvatarColors } from "../../config/avatarColors";

type Props = {
  navigation: any;
  receiver: any;
  theme: any;
};

const ChatHeader = memo(({ navigation, receiver, theme }: Props) => {
  const dark = theme.mode === "dark" ? true : false;
  const firstLetter = receiver?.userName?.trim()?.[0];
  const [, groupTextColor] = getAvatarColors(firstLetter, dark);

  return (
    <View
      style={[styles.profileContainer, styles.view]}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()}>
        <Ionicons
          name="chevron-back"
          size={RFPercentage(2.7)}
          color={theme.heading}
        />
      </TouchableOpacity>

      <View style={styles.view2}>
        {receiver?.profileImage ? (
          <Image
            source={{ uri: receiver.profileImage }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            style={styles.profile}
          />
        ) : (
          <AvatarInitials
            name={receiver?.userName}
            style={{
              width: RFPercentage(7),
              height: RFPercentage(7),
              borderRadius: RFPercentage(100),
              borderWidth: 1,
              borderColor:groupTextColor
            }}
          />
        )}
      </View>

      <View style={styles.view3}>
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
    borderWidth: 1,
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
  view: { borderBottomColor: Colors.white5 },
  view2: { marginLeft: RFPercentage(2.5) },
  view3: { marginLeft: RFPercentage(1.5), width: "60%" },
});

export default ChatHeader;
