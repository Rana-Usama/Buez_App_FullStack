import React, { memo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { InputToolbar } from "react-native-gifted-chat";
import Feather from "@expo/vector-icons/Feather";
import { Ionicons } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors";

type Props = {
  inputText: string;
  setInputText: (v: string) => void;
  onSendText: (text: string) => void;
  theme: any;
  t: any;
  editingMessage?: any;
  onCancelEdit?: () => void;
};

const GroupInputToolbar = memo(
  ({ inputText, setInputText, onSendText, theme, t, editingMessage, onCancelEdit }: Props) => {
    const isEditing = !!editingMessage;

    return (
      <View style={[styles.wrap, { backgroundColor: theme.white }]}>
        {/* Edit banner */}
        {isEditing && (
          <View
            style={[
              styles.editBanner,
              {
                backgroundColor:
                  theme.mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : Colors.primary + "12",
                borderLeftColor:
                  theme.mode === "dark" ? Colors.white : Colors.primary,
              },
            ]}
          >
            <Ionicons
              name="pencil"
              size={RFPercentage(1.8)}
              color={theme.mode === "dark" ? Colors.white : Colors.primary}
            />
            <Text
              style={[
                styles.editBannerText,
                {
                  color:
                    theme.mode === "dark" ? Colors.white : Colors.primary,
                },
              ]}
            >
              {t("chat.txt9")}
            </Text>
            <TouchableOpacity
              onPress={onCancelEdit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.editCancelButton}
            >
              <Ionicons
                name="close"
                size={RFPercentage(2)}
                color={theme.mode === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)"}
              />
            </TouchableOpacity>
          </View>
        )}

        <InputToolbar
          containerStyle={[
            styles.toolbar,
            {
              backgroundColor:
                theme.mode === "dark"
                  ? "transparent"
                  : "rgba(241,241,241,1)",
              borderColor:
                theme.mode === "dark"
                  ? Colors.darkGrey
                  : "rgba(234,233,233,1)",
              borderTopColor:
                theme.mode === "dark"
                  ? Colors.darkGrey
                  : "rgba(234,233,233,1)",
            },
          ]}
          renderComposer={() => (
            <TextInput
              style={[styles.customTextInput, { color: theme.black }]}
              placeholder={`${t("chat.txt2")}`}
              placeholderTextColor="rgba(145,144,144,1)"
              value={inputText}
              onChangeText={setInputText}
              multiline
              scrollEnabled
              textAlignVertical="top"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
            />
          )}
          renderSend={() => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.sendButton}
              disabled={!inputText.trim()}
              onPress={() => {
                if (!inputText.trim()) return;
                onSendText(inputText.trim());
                setInputText("");
              }}
            >
              {isEditing ? (
                <Ionicons
                  name="checkmark"
                  size={RFPercentage(2.8)}
                  color={theme.mode === "dark" ? Colors.white : Colors.primary}
                />
              ) : (
                <Feather
                  name="send"
                  size={RFPercentage(2.6)}
                  color={theme.mode === "dark" ? Colors.white : Colors.primary}
                />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  wrap: {
    minHeight: RFPercentage(10),
    justifyContent: "center",
    paddingVertical: RFPercentage(2),
    width: "100%",
  },
  editBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: RFPercentage(0.8),
    paddingHorizontal: RFPercentage(1.5),
    marginHorizontal: "5%",
    marginBottom: RFPercentage(0.8),
    borderRadius: RFPercentage(1),
    borderLeftWidth: 3,
    gap: RFPercentage(0.8),
  },
  editBannerText: {
    flex: 1,
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_500Medium",
  },
  editCancelButton: {
    padding: RFPercentage(0.3),
  },
  toolbar: {
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(4),
    maxHeight: RFPercentage(18),
    justifyContent: "center",
    paddingHorizontal: RFPercentage(1.7),
    borderTopWidth: RFPercentage(0.1),
    alignSelf: "center",
    width: "90%",
    paddingVertical: RFPercentage(1.5),
  },
  customTextInput: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    width: "90%",
    marginVertical: 0,
    paddingVertical: 0,
    justifyContent: "center",
    textAlignVertical: "top",
    paddingTop: 3,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
    width: RFPercentage(4.5),
    height: RFPercentage(4.5),
    borderRadius: RFPercentage(100),
    position: "absolute",
    right: 0,
    top: RFPercentage(-0.8),
  },
});

export default GroupInputToolbar;