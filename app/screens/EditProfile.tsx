import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, KeyboardAvoidingView, ActivityIndicator, Platform, Keyboard } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

// components
import Screen from "../components/Screen";
import MyAppButton from "../components/common/MyAppButton";
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";
import InputField from "../components/common/InputField";

// config
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { updateProfile } from "../services/User.service";
import { Icons } from "../config/theme";

type InputFieldType = {
  placeholder: string;
  value: string;
  secure?: boolean; // optional;
  icon? : any;
  title? : string
};

function EditProfile({ navigation }) {
  const { userData: user } = useUser();
  const [imageUri, setImageUri] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [originalData, setOriginalData] = useState({
  name: "",
  phone: "",
  imageUri: null,
});


  const [inputField, SetInputField] = useState<InputFieldType[]>([
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

  useFocusEffect(
    useCallback(() => {
      console.log("getLoggedInUser");
      fetchUserData();
    }, [])
  );

 const fetchUserData = async () => {
  try {
    if (user) {
      const name = user.userName || "";
      const phone = user.phoneNumber || "";
      const image = user.profileImage || null;

      const tempFields = [...inputField];
      tempFields[0].value = name;
      tempFields[1].value = phone;
      SetInputField(tempFields);

      setOriginalData({ name, phone, imageUri: image });
      setImageUri(image);
    }
  } catch (error) {
    console.log(error);
  }
};


  const updateProfileData = async () => {
    const userName = inputField[0].value.trim();
    const phoneNumber = inputField[1].value.trim();
    const userData = {
      userName,
      phoneNumber,
    };
    setIsUpdating(true);

    try {
      await updateProfile(userData, imageUri);
      navigation.goBack();
    } catch (error) {
      console.log(error);
    } finally {
      setIsUpdating(false);
    }
  };


  const isChanged =
  inputField[0].value.trim() !== originalData.name.trim() ||
  inputField[1].value.trim() !== originalData.phone.trim() ||
  imageUri !== originalData.imageUri;


  return (
    <View style={styles.screen}>
      {/* Nav */}
      <Nav dpNull={true} marginTop={Platform.OS === "android" ? RFPercentage(4.5) : RFPercentage(7.9)} leftLogo={false} navigation={navigation} title="Edit Profile" />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboard}>
        <ScrollView style={{ width: "100%" }} showsVerticalScrollIndicator={false} contentContainerStyle={{ width: "100%", alignItems: "center" }} keyboardShouldPersistTaps="handled">
          {/* Profile Image */}
          <TouchableOpacity activeOpacity={0.8} onPress={pickImage} style={{ marginTop: RFPercentage(5.5), opacity: imageUri ? 1 : 0.8 }}>
            <Image style={styles.image} source={imageUri ? { uri: imageUri } : Icons.dp} />
            <Image style={styles.edit} source={Icons.gallery} />
          </TouchableOpacity>
          <View style={styles.editInfo}>
            <Text style={styles.infoText}>Edit Info</Text>
            <View style={styles.infoBottom} />
          </View>

          {/* Input field */}
          <View style={styles.fieldWrapper}>
            {inputField.map((item, i) => (
              <View
                key={i}
                style={{
                  marginTop: i == 0 ? RFPercentage(-0.5) : RFPercentage(2.2),
                  alignSelf: "center",
                }}
              >
                <Text style={styles.titleText}>{item.title}</Text>
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
                  fontFamily={"Poppins_400Regular"}
                  icon={item.icon}
                  onChangeText={(text) => handleChange(text, i)}
                  value={item.value}
                  width={"97%"}
                />
              </View>
            ))}
          </View>
          {/* Button */}
          <View style={styles.buttonWrapper}>
            <MyAppButton title={"Edit"} marginTop={RFPercentage(2)} onPress={updateProfileData} loading={isUpdating}  disabled={!isChanged || isUpdating} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  keyboard: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: RFPercentage(20), height: RFPercentage(20), borderRadius: RFPercentage(100), borderColor: Colors.primary, borderWidth: RFPercentage(0.4) },
  edit: { width: RFPercentage(4), height: RFPercentage(4), borderRadius: RFPercentage(20), position: "absolute", bottom: RFPercentage(-0.3), right: RFPercentage(3) },
  editInfo: { width: "90%", justifyContent: "flex-start", alignItems: "flex-start", marginTop: RFPercentage(2.5) },
  infoText: { color: Colors.lightGrey, fontSize: RFPercentage(1.9), fontFamily: "Poppins_400Regular" },
  infoBottom: { width: "75%", height: RFPercentage(0.1), backgroundColor: "#F3F4F6", marginTop: RFPercentage(1.6) },
  fieldWrapper: {
    marginTop: RFPercentage(3),
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    alignSelf: "center",
  },
  titleText: { left: RFPercentage(1.6), color: "#57534E", fontSize: RFPercentage(1.8), fontFamily: "Poppins_400Regular" },
  buttonWrapper: { justifyContent: "center", alignItems: "center", marginTop: RFPercentage(12) },
});

export default EditProfile;
