import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors";

type Props = {
  reactions: Record<string, string[]>;
  currentUserId: string;
  onToggleReaction: (emoji: string) => void;
  theme: any;
  isOwnMessage?: boolean;
};

const ReactionDisplay = memo(
  ({ reactions, currentUserId, onToggleReaction, theme, isOwnMessage = false }: Props) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;

    // Filter out emojis with no reactors
    const activeReactions = Object.entries(reactions).filter(
      ([, users]) => users && users.length > 0
    );

    if (activeReactions.length === 0) return null;

    return (
      <View
        style={[
          styles.container,
          { alignSelf: isOwnMessage ? "flex-end" : "flex-start" },
        ]}
      >
        {activeReactions.map(([emoji, users]) => {
          const hasReacted = users.includes(currentUserId);
          return (
            <TouchableOpacity
              key={emoji}
              activeOpacity={0.7}
              onPress={() => onToggleReaction(emoji)}
              style={[
                styles.badge,
                {
                  backgroundColor: hasReacted
                    ? theme.mode === "dark"
                      ? "rgba(255,255,255,0.15)"
                      : Colors.primary + "18"
                    : theme.mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)",
                  borderColor: hasReacted
                    ? theme.mode === "dark"
                      ? "rgba(255,255,255,0.25)"
                      : Colors.primary + "40"
                    : "transparent",
                },
              ]}
            >
              <Text style={styles.badgeEmoji}>{emoji}</Text>
              <Text
                style={[
                  styles.badgeCount,
                  {
                    color: hasReacted
                      ? theme.mode === "dark"
                        ? Colors.white
                        : Colors.primary
                      : theme.mode === "dark"
                        ? "rgba(255,255,255,0.6)"
                        : "rgba(0,0,0,0.5)",
                  },
                ]}
              >
                {users.length}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  },
  (prev, next) =>
    JSON.stringify(prev.reactions) === JSON.stringify(next.reactions) &&
    prev.currentUserId === next.currentUserId &&
    prev.theme === next.theme &&
    prev.isOwnMessage === next.isOwnMessage
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: RFPercentage(0.3),
    marginBottom: RFPercentage(0.3),
    gap: RFPercentage(0.5),
    paddingHorizontal: RFPercentage(0.5),
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.3),
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    gap: RFPercentage(0.3),
  },
  badgeEmoji: {
    fontSize: RFPercentage(1.6),
  },
  badgeCount: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
  },
});

export default ReactionDisplay;
