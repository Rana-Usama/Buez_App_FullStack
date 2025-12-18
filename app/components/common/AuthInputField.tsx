import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  TextInputProps,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import Ionicons from "react-native-vector-icons/Ionicons";
import Feather from "react-native-vector-icons/Feather";

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
  keyboardType?: TextInputProps["keyboardType"];
  textCenter?: "left" | "right" | "center";
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
  borderWidth = 1,
  fontFamily = undefined,
  placeholderColor = "#B4B6B8",
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
  ...otherProps
}) => {
  const [eyeIcon, setEyeIcon] = useState(false);

  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
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
          onChangeText={(text) => handleFeild(text)}
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
            style={{ position: "absolute", right: RFPercentage(1) }}
          >
            <Ionicons
              color={Colors.lightGrey}
              style={{ right: RFPercentage(0.5) }}
              size={RFPercentage(2.2)}
              name={eyeIcon ? "eye" : "eye-off-outline"}
            />
          </TouchableOpacity>
        )}

        {cardIcon && (
          <TouchableOpacity
            style={{ position: "absolute", right: RFPercentage(1) }}
          >
            <Image
              style={{ width: RFPercentage(3.5), height: RFPercentage(3) }}
              source={Icons.visa}
            />
          </TouchableOpacity>
        )}

        {icon && (
          <TouchableOpacity
            style={{ position: "absolute", right: RFPercentage(1) }}
          >
            <Ionicons
              color={Colors.lightGrey}
              style={{ right: RFPercentage(0.5) }}
              size={RFPercentage(2.7)}
              name={"search-outline"}
            />
          </TouchableOpacity>
        )}

        {iconName === "Wifi" && (
          <TouchableOpacity
            style={{ position: "absolute", right: RFPercentage(1) }}
          >
            <Feather
              color={Colors.darkGrey2}
              style={{ right: RFPercentage(0.5) }}
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
