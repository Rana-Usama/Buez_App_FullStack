import React, { memo } from "react";
import { View, TouchableOpacity, Image, Text, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import ClickableMessageText from "../../components/common/ClickableMessageText";
import Colors from "../../config/Colors";
import AvatarInitials from "../common/DefaultAvatars";

type Props = {
  message: any;
  isOwn: boolean;
  profileImage: string;
  displayName: string;
  onLongPress: (id: string) => void;
  currentUserId: string;
  theme: any;
};

const MessageItem = memo(
  ({
    message,
    isOwn,
    profileImage,
    displayName,
    onLongPress,
    currentUserId,
    theme,
  }: Props) => {
    return (
      <View
        style={{
          flexDirection: isOwn ? "row-reverse" : "row",
          alignItems: "flex-end",
          marginVertical: RFPercentage(0.5),
          paddingHorizontal: RFPercentage(2),
        }}
      >
        <View
          style={{
            maxWidth: "90%",
            alignItems: isOwn ? "flex-end" : "flex-start",
          }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={() => {
              if (isOwn) onLongPress(message._id);
            }}
            style={[
              styles.msgBubble,
              isOwn
                ? {
                    backgroundColor:
                      theme.mode === "dark"
                        ? "rgba(54, 54, 65, 1)"
                        : Colors.primary,
                  }
                : {
                    backgroundColor:
                      theme.mode === "dark"
                        ? "rgba(39, 39, 43, 1)"
                        : "rgba(240, 242, 245, 1)",
                  },
            ]}
          >
            <View
              style={{
                marginRight: RFPercentage(1.2),
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.msgAvatar}
                />
              ) : (
                <AvatarInitials name={displayName} style={styles.msgAvatar} />
              )}

              <View style={{ marginLeft: RFPercentage(1.2) }}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.msgSenderName,
                    {
                      color: isOwn
                        ? Colors.white
                        : theme.mode === "dark"
                          ? Colors.lightGrey
                          : Colors.darkGrey2,
                    },
                  ]}
                >
                  {displayName}
                </Text>
                <Text
                  style={[
                    styles.msgTime,
                    {
                      color: isOwn
                        ? "rgba(255,255,255,0.6)"
                        : theme.mode === "dark"
                          ? "rgba(255,255,255,0.4)"
                          : "rgba(0,0,0,0.35)",
                    },
                  ]}
                >
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>

            <ClickableMessageText
              currentMessage={message}
              currentUserId={currentUserId}
              theme={theme}
              textStyle={{
                color: isOwn ? Colors.white : theme.black,
                marginTop: RFPercentage(1.4),
                marginBottom: RFPercentage(0.6),
              }}
              linkStyle={{
                color: isOwn ? "rgba(255,255,255,0.85)" : theme.primary,
              }}
              noPadding
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  },
  (prev, next) =>
    prev.message._id === next.message._id &&
    prev.message.text === next.message.text &&
    prev.isOwn === next.isOwn &&
    prev.theme === next.theme &&
    prev.currentUserId === next.currentUserId,
);

const styles = StyleSheet.create({
  msgAvatar: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(1),
  },
  msgAvatarFallback: {
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(1),
    justifyContent: "center",
    alignItems: "center",
  },
  msgAvatarInitial: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
  msgSenderName: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_600SemiBold",
  },
  msgTime: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(0.4),
  },
  msgBubble: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(1.2),
    paddingBottom: RFPercentage(0.8),
    borderRadius: RFPercentage(2.2),
    minWidth: RFPercentage(10),
  },
});

export default MessageItem;
