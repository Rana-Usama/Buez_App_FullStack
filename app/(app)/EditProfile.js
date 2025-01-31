import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

// components
import Screen from "../../components/Screen";
import MyAppButton from "../../components/common/MyAppButton";
import Nav from "../../components/common/Nav";
import CustomTabBar from "../../components/common/CustomTabBar";
import InputField from "../../components/common/InputField";

// config
import Colors from "../../config/Colors";
import { useUser } from "../../contexts/user.context";
import { useFocusEffect } from "@react-navigation/native";
import { updateProfile } from "../../services/User.service";
import { router } from "expo-router";

function EditProfile({ navigation }) {
  const user = useUser();
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState(null);
  const [inputField, SetInputField] = useState([
    {
      placeholder: "Emma Stone",
      title: "Name",
      value: "",
    },
    {
      placeholder: "+1 (502) 363-6754",
      title: "Phone Number",
      value: "",
    },
  ]);

  const handleChange = (text, i) => {
    let tempfeilds = [...inputField];
    tempfeilds[i].value = text;
    SetInputField(tempfeilds);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log(result);

    if (!result.canceled && result.assets) {
      setImageUri(result.assets[0].uri);
    }
  };

  useFocusEffect(useCallback(() => {
    console.log('getLoggedInUser');
    fetchUserData();
  }, []));

  const fetchUserData = async () => {
    try {
      // const response = await getLoggedInUser();
      if (user) {
        const tempfeilds = [...inputField];
        tempfeilds[0].value = user.userName || '';
        tempfeilds[1].value = user.phoneNumber || '';
        console.log(tempfeilds);
        SetInputField(tempfeilds);
        setImageUri(user.profileImage);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const updateProfileData = async () => {
    const userName = inputField[0].value.trim();
    const phoneNumber = inputField[1].value.trim();
    const userData = {
      userName,
      phoneNumber
    };

    try {
      await updateProfile(userData, imageUri);
      router.back();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={{ width: "100%" }} contentContainerStyle={{ width: "100%", alignItems: "center" }}>
        {/* Nav */}
        <Nav marginTop={RFPercentage(7.9)} leftLogo={false} navigation={navigation} title="Edit Profile" />

        {/* Profile Image */}
        <TouchableOpacity activeOpacity={0.8} onPress={pickImage} style={{ marginTop: RFPercentage(5.5), opacity: imageUri ? 1 : 0.8 }}>
          <Image
            style={{ width: RFPercentage(20), height: RFPercentage(20), borderRadius: RFPercentage(100), borderColor: Colors.primary, borderWidth: RFPercentage(0.4) }}
            source={imageUri ? { uri: imageUri } : require("../../assets/Images/dp.png")}
          />
          <Image
            style={{ width: RFPercentage(4), height: RFPercentage(4), borderRadius: RFPercentage(20), position: "absolute", bottom: RFPercentage(-0.3), right: RFPercentage(3) }}
            source={require("../../assets/Images/gallery.png")}
          />
        </TouchableOpacity>
        <View style={{ width: "90%", justifyContent: "flex-start", alignItems: "flex-start", marginTop: RFPercentage(2.5) }}>
          <Text style={{ color: Colors.lightGrey, fontSize: RFPercentage(1.9), fontFamily: "Poppins-Regular" }}>Edit Info</Text>
          <View style={{ width: "75%", height: RFPercentage(0.1), backgroundColor: "#F3F4F6", marginTop: RFPercentage(1.6) }} />
        </View>

        {/* Input field */}
        <View
          style={{
            marginTop: RFPercentage(3),
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            alignSelf: "center",
          }}
        >
          {inputField.map((item, i) => (
            <View
              key={i}
              style={{
                marginTop: i == 0 ? RFPercentage(-0.5) : RFPercentage(2.2),
                alignSelf: "center",
              }}
            >
              <Text style={{ left: RFPercentage(1.6), marginBottom: RFPercentage(1), color: "#57534E", fontSize: RFPercentage(1.8), fontFamily: "Poppins-Regular" }}>{item.title}</Text>
              <InputField
                placeholder={item.placeholder}
                placeholderColor={Colors.inputFieldPlaceholder}
                placeholderAtCenter={false}
                height={RFPercentage(6)}
                borderColor={Colors.border}
                borderWidth={RFPercentage(0.1)}
                backgroundColor={"white"}
                secure={item.secure}
                borderRadius={RFPercentage(1.4)}
                color={Colors.black}
                fontSize={RFPercentage(1.8)}
                fontFamily={"Poppins-Regular"}
                icon={item.icon}
                onChangeText={(text) => handleChange(text, i)}
                value={item.value}
                width={"97%"}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Button */}
      <View style={{ justifyContent: "center", alignItems: "center", position: "absolute", bottom: RFPercentage(16) }}>
        <MyAppButton title={"Edit"} marginTop={RFPercentage(2)} onPress={() => updateProfileData()} />
      </View>

      {/* Bottom Tab */}
      <CustomTabBar profileTab={true} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: Colors.white,
  },
});

export default EditProfile;
