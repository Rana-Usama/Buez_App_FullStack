import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  TextInputProps,
  StyleProp,
  TextStyle,
  KeyboardTypeOptions, StyleSheet } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "react-native-vector-icons/Ionicons";
import Feather from "react-native-vector-icons/Feather";

// config
import Colors from "../../config/Colors";
import { Icons } from "../../config/theme";

interface InputFieldProps extends TextInputProps {
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  placeholder?: string;
  multipleLines?: boolean;
  handleFeild?: (text: string) => void;
  borderColor?: string;
  borderLeftColor?: string;
  borderTopColor?: string;
  borderRightColor?: string;
  borderBottomColor?: string;
  borderWidth?: number;
  fontFamily?: string | null;
  placeholderColor?: string;
  borderRadius?: number;
  letterSpacing?: boolean;
  backgroundColor?: string;
  icon?: boolean;
  keyboardType?: KeyboardTypeOptions;
  textCenter?: "left" | "center" | "right";
  fontSize?: number;
  editIcon?: boolean;
  dropdownIcon?: boolean;
  placeholderAtCenter?: boolean;
  width?: any;
  value?: string;
  iconName?: string;
  height?: any;
  secure?: boolean;
  handleClear?: boolean;
  leftIconName?: string;
  autoFocus?: boolean;
  searchMarginLeft?: number | null;
  color?: string;
  cardIcon?: boolean;
  description?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  onTouchStart = () => {},
  onTouchEnd = () => {},
  placeholder,
  multipleLines = false,
  handleFeild,
  borderColor,
  borderLeftColor = Colors.white,
  borderTopColor = Colors.white,
  borderRightColor = Colors.white,
  borderBottomColor = Colors.white,
  borderWidth = 0,
  fontFamily = undefined,
  placeholderColor = Colors.greyLight5,
  borderRadius = RFPercentage(1),
  letterSpacing = false,
  backgroundColor = Colors.white,
  icon = false,
  keyboardType = "default",
  textCenter = "left",
  fontSize = RFPercentage(2.5),
  editIcon = false,
  dropdownIcon = false,
  placeholderAtCenter = false,
  width = "100%",
  value,
  iconName = "",
  height = RFPercentage(6.9),
  secure = false,
  handleClear = false,
  leftIconName = "",
  autoFocus = false,
  searchMarginLeft = null,
  color = "black",
  cardIcon = false,
  description = false,
  ...otherProps
}) => {
  const [eyeIcon, setEyeIcon] = useState(false);

  return (
    <View style={styles.view}>
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          backgroundColor: backgroundColor,
          borderBottomColor: borderColor ? undefined : borderBottomColor,
          borderTopColor: borderColor ? undefined : borderTopColor,
          borderRightColor: borderColor ? undefined : borderRightColor,
          borderLeftColor: borderColor ? undefined : borderLeftColor,
          borderWidth: borderWidth,
          borderColor: borderColor,
          width: width,
          height: height,
          borderRadius: borderRadius,
          marginVertical: RFPercentage(0.7),
        }}
      >
        <TextInput
          placeholder={placeholder}
          multiline={multipleLines}
          placeholderTextColor={placeholderColor}
          onChangeText={handleFeild}
          onResponderStart={onTouchStart}
          onEndEditing={onTouchEnd}
          value={value}
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          secureTextEntry={secure && !eyeIcon}
          textAlign={textCenter}
          style={{
            flexWrap: "wrap",
            right: RFPercentage(0.5),
            color: color,
            alignSelf: "center",
            fontFamily: fontFamily || undefined,
            fontSize: fontSize,
            width: leftIconName ? "85%" : "90%",
            height: "100%",
            letterSpacing: letterSpacing ? RFPercentage(0.4) : undefined,
          }}
          {...otherProps}
        />

        {secure && (
          <TouchableOpacity
            onPress={() => setEyeIcon(!eyeIcon)}
            style={styles.touchableOpacity}
          >
            <Ionicons
              color={Colors.lightGrey}
              style={styles.ionicons}
              size={RFPercentage(2.2)}
              name={eyeIcon ? "eye" : "eye-off-outline"}
            />
          </TouchableOpacity>
        )}

        {cardIcon && (
          <TouchableOpacity style={styles.touchableOpacity}>
            <Image
              style={styles.image}
              source={Icons.visa}
            />
          </TouchableOpacity>
        )}

        {icon && (
          <TouchableOpacity style={styles.touchableOpacity}>
            <Ionicons
              color={Colors.darkGrey2}
              style={styles.ionicons}
              size={RFPercentage(2.7)}
              name={"search-outline"}
            />
          </TouchableOpacity>
        )}

        {iconName === "Wifi" && (
          <TouchableOpacity style={styles.touchableOpacity}>
            <Feather
              color={Colors.darkGrey2}
              style={styles.ionicons}
              size={RFPercentage(2.7)}
              name={"wifi"}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default InputField;

const styles = StyleSheet.create({
  view: { justifyContent: "center", alignItems: "center" },
  touchableOpacity: { position: "absolute", right: RFPercentage(1) },
  ionicons: { right: RFPercentage(0.5) },
  image: { width: RFPercentage(3.5), height: RFPercentage(3) },
});
