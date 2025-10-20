import {
  StyleSheet,
  Platform,
  View,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useAppTheme } from "../contexts/themeContext";
import Nav from "../components/common/Nav";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useTranslation } from "react-i18next";
import InputField from "../components/common/AuthInputField";
import { fetchUsersWithTaskStats } from "../services/Review.service";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import Feather from "@expo/vector-icons/Feather";
import MyAppButton from "../components/common/MyAppButton";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";

const TopRatedUserProfile = ({ navigation }: any) => {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View style={[{ flex: 1 }, { backgroundColor: theme.white }]}>
      <Nav
        marginTop={RFPercentage(5)}
        leftLogo={false}
        navigation={navigation}
        title={"Sana Asghar's Profile"}
        dpNull
      />
      <View
        style={{
          width: "90%",
          alignSelf: "center",
          marginTop: RFPercentage(3),
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              width: RFPercentage(13),
              height: RFPercentage(13),
              borderRadius: RFPercentage(100),
              borderWidth: RFPercentage(0.3),
              alignItems: "center",
              justifyContent: "center",
              borderColor: "#45B356",
            }}
          >
            <Image
              source={Icons.dp}
              resizeMode="contain"
              style={{
                width: RFPercentage(12),
                height: RFPercentage(12),
                borderRadius: RFPercentage(100),
              }}
            />
            <View
              style={{
                width: RFPercentage(6),
                height: RFPercentage(1.8),
                borderRadius: RFPercentage(100),
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#45B356",
                alignSelf: "center",
                position: "absolute",
                bottom: RFPercentage(-0.6),
              }}
            >
              <Text
                style={{
                  color: Colors.white,
                  fontSize: RFPercentage(0.8),
                  fontFamily: "Poppins_500Medium",
                }}
              >
                Top Rated
              </Text>
            </View>
          </View>
          <View style={{ marginLeft: RFPercentage(1.5), width: "70%" }}>
            <Text
              style={[
                {
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: RFPercentage(1.9),
                },
                { color: theme.darkGrey },
              ]}
            >
              Sana Asghar
            </Text>
            <Text
              style={[
                {
                  fontFamily: "Poppins_400Regular",
                  fontSize: RFPercentage(1.4),
                  marginTop: RFPercentage(0.6),
                },
                { color: theme.grey },
              ]}
            >
              I am passionate Mobile App Developer with expertise in React
              Native.
            </Text>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: RFPercentage(2.5),
          }}
        >
          <Text
            style={[
              { fontFamily: "Poppins_400Regular", fontSize: RFPercentage(1.4) },
              { color: theme.grey },
            ]}
          >
            Member Since 4 April, 2004
          </Text>
          <MyAppButton title={t("details.txt9")} marginTop={RFPercentage(0)} />
        </View>
        <View
          style={[
            {
              width: "100%",
              height: RFPercentage(14),
              borderRadius: RFPercentage(1.5),
              marginTop: RFPercentage(3),
              justifyContent: "center",
            },
            {
              backgroundColor:
                theme.mode === "dark"
                  ? Colors.primary + "40"
                  : Colors.primary + "08",
            },
          ]}
        >
          <View style={{ width: "90%", alignSelf: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons
                name="add-task"
                size={RFPercentage(2)}
                color={theme.primary}
              />
              <Text
                style={{
                  color: Colors.primary,
                  fontFamily: "Poppins_500Medium",
                  fontSize: RFPercentage(1.6),
                  marginLeft: RFPercentage(0.8),
                }}
              >
                Active Tasks
              </Text>
              <View
                style={[
                  {
                    width: RFPercentage(3.2),
                    height: RFPercentage(3.2),
                    borderRadius: RFPercentage(100),
                    alignItems: "center",
                    justifyContent: "center",
                    position: "absolute",
                    right: 0,
                  },
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.primary + "40"
                        : Colors.primary + "12",
                  },
                ]}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    color: Colors.primary,
                    fontSize: RFPercentage(1.4),
                  }}
                >
                  3
                </Text>
              </View>
            </View>
            <View
              style={[
                {
                  width: "100%",
                  alignSelf: "center",
                  height: RFPercentage(0.1),
                  marginVertical: RFPercentage(2),
                },
                { backgroundColor: theme.border },
              ]}
            ></View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons
                name="task-alt"
                size={RFPercentage(2)}
                color={theme.primary}
              />
              <Text
                style={{
                  color: Colors.primary,
                  fontFamily: "Poppins_500Medium",
                  fontSize: RFPercentage(1.6),
                  marginLeft: RFPercentage(0.8),
                }}
              >
                Completed Tasks
              </Text>
              <View
                style={[
                  {
                    width: RFPercentage(3.2),
                    height: RFPercentage(3.2),
                    borderRadius: RFPercentage(100),
                    alignItems: "center",
                    justifyContent: "center",
                    position: "absolute",
                    right: 0,
                  },
                  {
                    backgroundColor:
                      theme.mode === "dark"
                        ? Colors.primary + "40"
                        : Colors.primary + "12",
                  },
                ]}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    color: Colors.primary,
                    fontSize: RFPercentage(1.4),
                  }}
                >
                  23
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ width: "100%", marginTop: RFPercentage(2.5) }}>
          <Text
            style={[
              {
                fontFamily: "Poppins_600SemiBold",
                fontSize: RFPercentage(1.6),
              },
              { color: theme.grey },
            ]}
          >
            Sana Asghar's Completed Tasks
          </Text>
        </View>
        <View>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              {
                width: "100%",
                borderRadius: RFPercentage(1.2),
                borderWidth: 1,
                marginTop: RFPercentage(2),
              },
              { borderColor: theme.border },
            ]}
          >
            <View>
              <Image
                source={Icons.garden}
                resizeMode="cover"
                style={{
                  width: "100%",
                  height: RFPercentage(17),
                  borderTopRightRadius: RFPercentage(1.2),
                  borderTopLeftRadius: RFPercentage(1.2),
                }}
              />
              <LinearGradient
                colors={[Colors.primary, "#4557B0"]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderTopRightRadius: RFPercentage(1.2),
                  borderBottomLeftRadius: RFPercentage(1.3),
                  paddingHorizontal: RFPercentage(1.7),
                  height: RFPercentage(3.6),
                  position: "absolute",
                  right: 0,
                  top: 0,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontFamily: "Poppins_500Medium",
                    fontSize: RFPercentage(1.5),
                  }}
                >
                  Gardening
                </Text>
              </LinearGradient>
            </View>
            <View
              style={{
                width: "90%",
                alignSelf: "center",
                marginVertical: RFPercentage(2),
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Image
                  source={Icons.profile2}
                  resizeMode="contain"
                  style={{
                    width: RFPercentage(5),
                    height: RFPercentage(5),
                    borderRadius: RFPercentage(100),
                    borderWidth: 1,
                    borderColor: Colors.primary,
                  }}
                />
                <Text
                  style={[
                    { color: theme.darkGrey },
                    {
                      fontFamily: "Poppins_500Medium",
                      fontSize: RFPercentage(1.6),
                      marginLeft: RFPercentage(1),
                    },
                  ]}
                >
                  Emma Stone
                </Text>
                <Text
                  style={[
                    { color: theme.darkGrey },
                    {
                      fontFamily: "Poppins_500Medium",
                      fontSize: RFPercentage(1.3),
                      position: "absolute",
                      right: 0,
                    },
                  ]}
                >
                  Completed On: 04-03-2025
                </Text>
              </View>
              <View
                style={{
                  marginTop: RFPercentage(1.4),
                }}
              >
                <Text
                  style={[
                    { color: theme.darkGrey },
                    {
                      fontFamily: "Poppins_500Medium",
                      fontSize: RFPercentage(1.5),
                    },
                  ]}
                >
                  Help in Gardening on Week any one can help?...
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" , marginTop:RFPercentage(1)}}>
                  <Image
                    tintColor={theme.primary}
                    style={{
                      width: RFPercentage(1.4),
                      height: RFPercentage(1.4),
                    }}
                    resizeMode="contain"
                    source={require("../../assets/Images/compensation.png")}
                  />
                  <Text
                    style={{
                      color: Colors.primary,
                      fontSize: RFPercentage(1.3),
                      fontFamily: "Poppins_500Medium",
                      marginLeft: RFPercentage(0.3),
                    }}
                  >
                    Compensation: 60$
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default TopRatedUserProfile;

const styles = StyleSheet.create({
  inputFieldWrapper: {
    marginTop: RFPercentage(2),
  },
  filterButtonsContainer: {
    marginTop: RFPercentage(1.4),
    // backgroundColor: "red",
  },
});
