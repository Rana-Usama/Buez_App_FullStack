import React, { memo } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { InputToolbar } from "react-native-gifted-chat";
import Feather from "@expo/vector-icons/Feather";
import { RFPercentage } from "react-native-responsive-fontsize";
import Colors from "../../config/Colors";

type Props = {
  inputText: string;
  setInputText: (v: string) => void;
  onSendText: (text: string) => void;
  theme: any;
  t: any;
};

const GroupInputToolbar = memo(({ inputText, setInputText, onSendText, theme, t }: Props) => {
  return (
    <View style={[styles.wrap, { backgroundColor: theme.white }]}>
      <InputToolbar
        containerStyle={[
          styles.toolbar,
          {
            backgroundColor: theme.mode === "dark" ? "transparent" : Colors.w1,
            borderColor: theme.mode === "dark" ? Colors.darkGrey : Colors.greyLight2,
            borderTopColor: theme.mode === "dark" ? Colors.darkGrey : Colors.greyLight2,
          },
        ]}
        renderComposer={() => (
          <TextInput
            style={[styles.customTextInput, { color: theme.black }]}
            placeholder={`${t("chat.txt2")}`}
            placeholderTextColor={Colors.gr1}
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
            <Feather name="send" size={RFPercentage(2.6)} color={theme.mode === "dark" ? Colors.white : Colors.primary} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    minHeight: RFPercentage(10),
    justifyContent: "center",
    paddingVertical: RFPercentage(2),
    width: "100%",
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