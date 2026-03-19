import React, { memo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors";
import { Ionicons } from "@expo/vector-icons";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const EXTENDED_EMOJIS: { category: string; emojis: string[] }[] = [
  {
    category: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
      "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩",
      "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
      "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🫡",
      "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒",
      "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴",
      "😷", "🤒", "🤕", "🤢", "🤮", "🥵", "🥶", "🥴",
      "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐",
    ],
  },
  {
    category: "Gestures",
    emojis: [
      "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌",
      "🫶", "👐", "🤲", "🤝", "🙏", "✌️", "🤞", "🫰",
      "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️",
      "🫵", "👋", "🤚", "🖐️", "✋", "🖖", "💪", "🦾",
    ],
  },
  {
    category: "Hearts",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
      "💘", "💝", "💟", "♥️", "❤️‍🔥", "❤️‍🩹",
    ],
  },
  {
    category: "Animals",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
      "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈",
      "🙉", "🙊", "🐔", "🐧", "🐦", "🦅", "🦆", "🦉",
      "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛",
      "🦋", "🐌", "🐞", "🐜", "🪰", "🪲", "🪳", "🦟",
    ],
  },
  {
    category: "Food",
    emojis: [
      "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓",
      "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝",
      "🍅", "🥑", "🍕", "🍔", "🍟", "🌭", "🍿", "🧁",
      "🍰", "🎂", "🍩", "🍪", "🍫", "🍬", "☕", "🍵",
    ],
  },
  {
    category: "Objects",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🎱",
      "🎮", "🎲", "🧩", "🎭", "🎨", "🎬", "🎤", "🎧",
      "🎵", "🎶", "🎸", "🎹", "🥁", "🎺", "🎻", "🪘",
      "🏆", "🥇", "🥈", "🥉", "🎖️", "🏅", "🎗️", "🎁",
    ],
  },
  {
    category: "Symbols",
    emojis: [
      "✅", "❌", "⭕", "❗", "❓", "‼️", "⁉️", "💯",
      "🔥", "✨", "💫", "⭐", "🌟", "💥", "💢", "💤",
      "💨", "🕊️", "🎉", "🎊", "🎈", "🎀", "🎁", "🏳️",
    ],
  },
];

type Props = {
  visible: boolean;
  isOwnMessage: boolean;
  currentReactions?: Record<string, string[]>;
  currentUserId: string;
  onReact: (emoji: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
  theme: any;
  t: any;
};

const MessageActionModal = memo(
  ({
    visible,
    isOwnMessage,
    currentReactions = {},
    currentUserId,
    onReact,
    onEdit,
    onDelete,
    onClose,
    theme,
    t,
  }: Props) => {
    const [showExtended, setShowExtended] = useState(false);

    if (!visible) return null;

    const hasReacted = (emoji: string) => {
      return currentReactions[emoji]?.includes(currentUserId) ?? false;
    };

    const handleClose = () => {
      setShowExtended(false);
      onClose();
    };

    const handleReact = (emoji: string) => {
      onReact(emoji);
      setShowExtended(false);
      onClose();
    };

    return (
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable
            style={[styles.container, { backgroundColor: theme.white }]}
            onPress={() => {}}
          >
            {!showExtended ? (
              <>
                {/* Quick emoji row + plus button */}
                <View style={styles.emojiRow}>
                  {QUICK_EMOJIS.map((emoji) => {
                    const reacted = hasReacted(emoji);
                    return (
                      <TouchableOpacity
                        key={emoji}
                        activeOpacity={0.7}
                        onPress={() => handleReact(emoji)}
                        style={[
                          styles.emojiButton,
                          reacted && {
                            backgroundColor:
                              theme.mode === "dark"
                                ? "rgba(255,255,255,0.15)"
                                : Colors.primary + "20",
                            borderColor:
                              theme.mode === "dark"
                                ? "rgba(255,255,255,0.3)"
                                : Colors.primary + "50",
                          },
                        ]}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Plus button to expand */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowExtended(true)}
                    style={[
                      styles.emojiButton,
                      {
                        backgroundColor:
                          theme.mode === "dark"
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.05)",
                      },
                    ]}
                  >
                    <Ionicons
                      name="add"
                      size={RFPercentage(2.8)}
                      color={
                        theme.mode === "dark"
                          ? "rgba(255,255,255,0.6)"
                          : "rgba(0,0,0,0.4)"
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor:
                        theme.mode === "dark"
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.08)",
                    },
                  ]}
                />

                {/* Action buttons (only for own messages) */}
                {isOwnMessage && (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.actionButton}
                      onPress={() => {
                        onEdit();
                        setShowExtended(false);
                        onClose();
                      }}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={RFPercentage(2.2)}
                        color={
                          theme.mode === "dark"
                            ? Colors.white
                            : Colors.primary
                        }
                      />
                      <Text
                        style={[
                          styles.actionText,
                          {
                            color:
                              theme.mode === "dark"
                                ? Colors.white
                                : theme.heading,
                          },
                        ]}
                      >
                        {t("chat.txt11")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.actionButton}
                      onPress={() => {
                        setShowExtended(false);
                        onDelete();
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={RFPercentage(2.2)}
                        color="#F44336"
                      />
                      <Text
                        style={[styles.actionText, { color: "#F44336" }]}
                      >
                        {t("chat.txt5")}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              /* Extended emoji picker */
              <>
                {/* Header with back button */}
                <View style={styles.extendedHeader}>
                  <TouchableOpacity
                    onPress={() => setShowExtended(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={RFPercentage(2.5)}
                      color={theme.mode === "dark" ? Colors.white : theme.heading}
                    />
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.extendedTitle,
                      {
                        color:
                          theme.mode === "dark" ? Colors.white : theme.heading,
                      },
                    ]}
                  >
                    {t("chat.txt10")}
                  </Text>
                </View>

                <ScrollView
                  style={styles.extendedScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {EXTENDED_EMOJIS.map((section) => (
                    <View key={section.category} style={styles.emojiSection}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          {
                            color:
                              theme.mode === "dark"
                                ? "rgba(255,255,255,0.5)"
                                : "rgba(0,0,0,0.4)",
                          },
                        ]}
                      >
                        {section.category}
                      </Text>
                      <View style={styles.emojiGrid}>
                        {section.emojis.map((emoji, idx) => {
                          const reacted = hasReacted(emoji);
                          return (
                            <TouchableOpacity
                              key={`${emoji}-${idx}`}
                              activeOpacity={0.7}
                              onPress={() => handleReact(emoji)}
                              style={[
                                styles.gridEmojiButton,
                                reacted && {
                                  backgroundColor:
                                    theme.mode === "dark"
                                      ? "rgba(255,255,255,0.15)"
                                      : Colors.primary + "20",
                                  borderRadius: RFPercentage(1),
                                },
                              ]}
                            >
                              <Text style={styles.gridEmojiText}>
                                {emoji}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "85%",
    maxHeight: "70%",
    borderRadius: RFPercentage(2),
    paddingVertical: RFPercentage(2),
    paddingHorizontal: RFPercentage(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: RFPercentage(1),
    paddingHorizontal: RFPercentage(0.5),
  },
  emojiButton: {
    width: RFPercentage(5),
    height: RFPercentage(5),
    borderRadius: RFPercentage(2.5),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  emojiText: {
    fontSize: RFPercentage(2.8),
  },
  divider: {
    height: 1,
    marginVertical: RFPercentage(1),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(1.4),
    paddingHorizontal: RFPercentage(1.5),
    borderRadius: RFPercentage(1),
    gap: RFPercentage(1.5),
  },
  actionText: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
  // Extended picker styles
  extendedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: RFPercentage(1.2),
    marginBottom: RFPercentage(1),
    paddingHorizontal: RFPercentage(0.5),
  },
  extendedTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
  },
  extendedScroll: {
    maxHeight: RFPercentage(40),
  },
  emojiSection: {
    marginBottom: RFPercentage(1.5),
  },
  sectionTitle: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_500Medium",
    marginBottom: RFPercentage(0.8),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridEmojiButton: {
    width: "12.5%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: RFPercentage(0.3),
  },
  gridEmojiText: {
    fontSize: RFPercentage(2.8),
  },
});

export default MessageActionModal;
