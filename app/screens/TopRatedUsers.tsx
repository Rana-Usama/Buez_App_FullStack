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

const TopRatedUsers = ({ navigation }: any) => {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [inputField, SetInputField] = useState([
    { placeholder: t("home.txt2"), value: "" },
  ]);

  const handleChange = (text, i) => {
    const tmp = [...inputField];
    tmp[i].value = text;
    SetInputField(tmp);
    setSearchQuery(text);
  };

  const [users, setUsers] = useState([]);
  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetchUsersWithTaskStats();
      setUsers(res);
    };
    fetchUsers();
  }, []);

  return (
    <View style={[{ flex: 1 }, { backgroundColor: theme.white }]}>
      <Nav
        marginTop={RFPercentage(5)}
        leftLogo={false}
        navigation={navigation}
        title={"Top Rated Profiles"}
        dpNull
      />
      <View style={{ width: "90%", alignSelf: "center" }}>
        {inputField?.map((item, i) => (
          <View key={i} style={styles.inputFieldWrapper}>
            <InputField
              placeholder={item.placeholder}
              placeholderColor={"#6B7280"}
              height={
                Platform.OS === "android"
                  ? RFPercentage(6.4)
                  : RFPercentage(5.5)
              }
              backgroundColor={theme.white}
              borderWidth={RFPercentage(0.1)}
              borderColor={theme.border}
              secure={item.secure}
              borderRadius={RFPercentage(1.2)}
              color={theme.black}
              fontSize={RFPercentage(1.7)}
              fontFamily={"Poppins_400Regular"}
              handleFeild={(text) => handleChange(text, i)}
              value={item.value}
              width={"97%"}
            />
          </View>
        ))}

        {users?.length > 0 ? (
          <FlatList
            data={users}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.filterButtonsContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    navigation.navigate("TopRatedUserProfile");
                  }}
                  style={[
                    {
                      width: "100%",
                      height: RFPercentage(11),
                      borderWidth: 1,
                      borderRadius: RFPercentage(1.8),
                      justifyContent: "center",
                      marginTop: RFPercentage(2),
                    },
                    {
                      backgroundColor: theme.white,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: "90%",
                      alignSelf: "center",
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Image
                      source={Icons.dp}
                      resizeMode="contain"
                      style={{
                        width: RFPercentage(8.8),
                        height: RFPercentage(8.8),
                        borderRadius: RFPercentage(2),
                      }}
                    />
                    <View style={{ marginLeft: RFPercentage(1.5) }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={[
                            {
                              textAlign: "center",
                              fontFamily: "Poppins_600SemiBold",
                              fontSize: RFPercentage(1.6),
                              marginTop: RFPercentage(0.6),
                            },
                            { color: theme.darkGrey },
                          ]}
                        >
                          Sana Asghar
                        </Text>
                        <View
                          style={{
                            width: RFPercentage(5.5),
                            height: RFPercentage(1.6),
                            borderRadius: RFPercentage(100),
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#45B356",
                            alignSelf: "center",
                            marginTop: RFPercentage(0.6),
                            marginLeft: RFPercentage(0.5),
                          }}
                        >
                          <Text
                            style={{
                              color: Colors.white,
                              fontSize: RFPercentage(0.7),
                              fontFamily: "Poppins_500Medium",
                            }}
                          >
                            Top Rated
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[
                          {
                            fontSize: RFPercentage(1.3),
                            marginTop: RFPercentage(0.6),
                            fontFamily: "Poppins_Regular",
                          },
                          { color: theme.grey },
                        ]}
                      >
                        Member Since 4 April, 2004
                      </Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={{ position: "absolute", right: 0 }}
                    >
                      <Feather
                        name="arrow-right"
                        size={RFPercentage(2)}
                        color={theme.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <ActivityIndicator
            color={theme.primary}
            style={{ marginTop: RFPercentage(15) }}
          />
        )}
      </View>
    </View>
  );
};

export default TopRatedUsers;

const styles = StyleSheet.create({
  inputFieldWrapper: {
    marginTop: RFPercentage(2),
  },
  filterButtonsContainer: {
    marginTop: RFPercentage(1.4),
    paddingBottom:RFPercentage(20)
    // backgroundColor: "red",
  },
});
