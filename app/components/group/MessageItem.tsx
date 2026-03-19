import React, { memo } from "react";
import { View, TouchableOpacity, Image, Text, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import ClickableMessageText from "../../components/common/ClickableMessageText";
import ReactionDisplay from "../../components/chat/ReactionDisplay";
import Colors from "../../config/Colors";
import { useTranslation } from "react-i18next";

type Props = {
  message: any;
  isOwn: boolean;
  profileImage: string;
  displayName: string;
  onLongPress: (message: any) => void;
  currentUserId: string;
  theme: any;
  onToggleReaction?: (messageId: string, emoji: string) => void;
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
    onToggleReaction,
  }: Props) => {
    const { t } = useTranslation();

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
            onLongPress={() => onLongPress(message)}
            style={[
              styles.msgBubble,
              isOwn
                ? {
                    backgroundColor:
                      theme.mode === "dark"
                        ? "rgba(7, 7, 36, 1)"
                        : Colors.primary,
                  }
                : {
                    backgroundColor:
                      theme.mode === "dark"
                        ? "rgba(10,10,17,1)"
                        : "rgba(240,240,240,1)",
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
                <View
                  style={[
                    styles.msgAvatarFallback,
                    { backgroundColor: Colors.primary + "25" },
                  ]}
                >
                  <Text
                    style={[
                      styles.msgAvatarInitial,
                      {
                        color:
                          theme.mode === "dark" ? Colors.white : Colors.primary,
                      },
                    ]}
                  >
                    {displayName[0]?.toUpperCase() || "?"}
                  </Text>
                </View>
              )}

              <View style={{ marginLeft: RFPercentage(1.2) }}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.msgSenderName,
                    { color: isOwn ? Colors.white : Colors.lightGrey },
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

            {/* Edited label */}
            {message.edited && (
              <Text
                style={[
                  styles.editedLabel,
                  {
                    color: isOwn
                      ? "rgba(255,255,255,0.55)"
                      : theme.mode === "dark"
                        ? "rgba(255,255,255,0.4)"
                        : "rgba(0,0,0,0.35)",
                    textAlign: isOwn ? "right" : "left",
                  },
                ]}
              >
                {t("chat.txt8")}
              </Text>
            )}
          </TouchableOpacity>

          {/* Reactions display */}
          {message.reactions && Object.keys(message.reactions).length > 0 && (
            <ReactionDisplay
              reactions={message.reactions}
              currentUserId={currentUserId}
              onToggleReaction={(emoji) => {
                if (onToggleReaction) {
                  onToggleReaction(message._id, emoji);
                }
              }}
              theme={theme}
              isOwnMessage={isOwn}
            />
          )}
        </View>
      </View>
    );
  },
  (prev, next) =>
    prev.message._id === next.message._id &&
    prev.message.text === next.message.text &&
    prev.message.edited === next.message.edited &&
    JSON.stringify(prev.message.reactions) === JSON.stringify(next.message.reactions) &&
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
    fontSize: RFPercentage(1.2),
    fontFamily: "Poppins_400Regular",
  },
  msgTime: {
    fontSize: RFPercentage(1.1),
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
  editedLabel: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_400Regular_Italic",
    marginTop: RFPercentage(0.2),
  },
});

export default MessageItem;
