import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, TextInput, Image } from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

// components
import Nav from "../components/common/Nav";
import CustomTabBar from "../components/common/CustomTabBar";
import InputField from "../components/common/InputField";
import MyAppButton from "../components/common/MyAppButton";

// config
import Colors from "../config/Colors";

function PostRequest({ navigation, route }) {
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [selectedTask, setSelectedTask] = useState("");
  const [showCompensationDropdown, setShowCompensationDropdown] = useState(false);
  const [selectedCompensation, setSelectedCompensation] = useState("");
  const [imageUris, setImageUris] = useState([null, null, null]);
  const title = route.params?.title;

  const taskOptions = [
    { id: 1, name: "Cleaning" },
    { id: 2, name: "Gardening" },
    { id: 3, name: "Gaming" },
    { id: 4, name: "Moving" },
  ];

  const compensationOptions = [
    { id: 1, type: "Monitarely" },
    { id: 2, type: "Other" },
  ];

  const toggleDropdown = (dropdownType) => {
    if (dropdownType === "task") {
      setShowTaskDropdown(!showTaskDropdown);
      if (showCompensationDropdown) setShowCompensationDropdown(false);
    } else {
      setShowCompensationDropdown(!showCompensationDropdown);
      if (showTaskDropdown) setShowTaskDropdown(false);
    }
  };

  const selectTask = (task) => {
    setSelectedTask(task.name);
    setShowTaskDropdown(false);
  };

  const selectCompensation = (type) => {
    setSelectedCompensation(type.type);
    setShowCompensationDropdown(false);
  };

  // Image Picker
  const pickImage = async (index) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      let tempImageUris = [...imageUris];
      tempImageUris[index] = result.assets[0].uri;
      setImageUris(tempImageUris);
    }
  };

  const deleteImage = (index) => {
    let tempImageUris = [...imageUris];
    tempImageUris[index] = null;
    setImageUris(tempImageUris);
  };

  // Input Fields
  const [indicator, showIndicator] = useState(false);
  const [inputField, SetInputField] = useState([
    {
      placeholder: "Location Address",
      value: "",
    },
    {
      placeholder: "Compensation Details e.g, Two Movie Tickets",
      value: "",
    },
    {
      placeholder: "e.g, 100$",
      value: "",
    },
  ]);

  const handleChange = (text, i) => {
    let tempfeilds = [...inputField];
    tempfeilds[i].value = text;
    SetInputField(tempfeilds);
  };

  const [remember, setRemember] = useState(false);

  const toggleRemember = () => {
    setRemember(!remember);
    console.log(remember);
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Nav */}
        <Nav marginTop={RFPercentage(7.5)} leftLogo={false} navigation={navigation} title={title === "Edit Profile" ? "Edit Profile" : "Post Request"} />

        {/* Task Type Dropdown */}
        <TouchableOpacity
          style={[
            styles.dropdownHeader,
            { marginTop: RFPercentage(3), borderBottomLeftRadius: showTaskDropdown ? 0 : RFPercentage(1), borderBottomRightRadius: showTaskDropdown ? 0 : RFPercentage(1) },
          ]}
          onPress={() => toggleDropdown("task")}
        >
          <Text style={styles.dropdownHeaderText}>{selectedTask || "Task Type"}</Text>
          <MaterialIcons name={showTaskDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} style={styles.dropdownIcon} />
        </TouchableOpacity>

        {showTaskDropdown && (
          <FlatList
            data={taskOptions}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            style={[
              styles.dropdown,
              {
                maxHeight: RFPercentage(20),
                borderTopLeftRadius: showTaskDropdown ? 0 : RFPercentage(1),
                borderTopRightRadius: showTaskDropdown ? 0 : RFPercentage(1),
              },
            ]}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectTask(item)} style={styles.dropdownItem}>
                <Text style={styles.dropdownItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <View style={{ width: "100%", justifyContent: "center", alignItems: "center" }}>
          <TouchableOpacity
            style={[
              styles.dropdownHeader,
              { marginTop: RFPercentage(2.2), borderBottomLeftRadius: showCompensationDropdown ? 0 : RFPercentage(1), borderBottomRightRadius: showCompensationDropdown ? 0 : RFPercentage(1) },
            ]}
            onPress={() => toggleDropdown("compensation")}
          >
            <Text style={styles.dropdownHeaderText}>{selectedCompensation || "Compensation Type"}</Text>
            <MaterialIcons name={showCompensationDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} style={styles.dropdownIcon} />
          </TouchableOpacity>

          {showCompensationDropdown && (
            <FlatList
              data={compensationOptions}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              style={[
                styles.dropdown,
                { maxHeight: RFPercentage(20), borderTopLeftRadius: showCompensationDropdown ? 0 : RFPercentage(1), borderTopRightRadius: showCompensationDropdown ? 0 : RFPercentage(1) },
              ]}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => selectCompensation(item)} style={styles.dropdownItem}>
                  <Text style={styles.dropdownItemText}>{item.type}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        {/* decsription */}
        <View
          style={{
            width: "90%",
            height: RFPercentage(20),
            borderRadius: RFPercentage(1.2),
            borderColor: Colors.border,
            borderWidth: RFPercentage(0.1),
            justifyContent: "flex-start",
            alignItems: "flex-start",
            marginTop: RFPercentage(2.5),
          }}
        >
          <TextInput
            placeholder="Description"
            placeholderTextColor={Colors.heading}
            style={{ color: Colors.black, fontFamily: "Poppins_400Regular", fontSize: RFPercentage(2), top: RFPercentage(1.5), left: RFPercentage(1.5) }}
          />
        </View>

        {/* Input field */}
        <View style={{ justifyContent: "center", alignItems: "center", width: "100%" }}>
          {inputField.map((item, i) => (
            <View key={i} style={{ marginTop: i == 0 ? RFPercentage(1.7) : RFPercentage(1) }}>
              <InputField
                placeholder={item.placeholder}
                placeholderColor={"#6B7280"}
                height={RFPercentage(6.2)}
                backgroundColor={Colors.white}
                borderWidth={RFPercentage(0.1)}
                borderColor={"#E5E7EB"}
                secure={item.secure}
                borderRadius={RFPercentage(1)}
                color={Colors.black}
                fontSize={RFPercentage(1.8)}
                fontFamily={"Poppins_400Regular"}
                handleFeild={(text) => handleChange(text, i)}
                value={item.value}
                width={"97.5%"}
              />
            </View>
          ))}
        </View>

        {/* Image Picker */}
        <View style={{ width: "90%", justifyContent: "flex-start", alignItems: "flex-start", marginTop: RFPercentage(2.3) }}>
          <Text style={{ marginBottom: RFPercentage(1), color: "#57534E", fontSize: RFPercentage(1.8), fontFamily: "Poppins_400Regular" }}>Upload Photos From Gallery</Text>
          <View style={{ width: "100%", justifyContent: "space-between", alignItems: "center", marginTop: RFPercentage(0.8), flexDirection: "row" }}>
            {[0, 1, 2].map((index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => pickImage(index)}
                style={{ width: "32%", height: RFPercentage(14), borderRadius: RFPercentage(1.4), justifyContent: "center", alignItems: "center", backgroundColor: "#F3F4F6", position: "relative" }}
              >
                {imageUris[index] ? (
                  <>
                    <Image style={{ width: "100%", height: "100%", borderRadius: RFPercentage(1.4) }} source={{ uri: imageUris[index] }} />
                    <TouchableOpacity onPress={() => [deleteImage(index), pickImage(index)]} style={{ position: "absolute", top: 5, right: 5 }}>
                      <Image style={{ width: RFPercentage(3), height: RFPercentage(3) }} source={require("../../assets/Images/edit.png")} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Image style={{ width: RFPercentage(3), height: RFPercentage(3) }} source={require("../../assets/Images/gal.png")} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/*Login Button */}
        <MyAppButton title={title === "Edit Profile" ? "Edit" : "Post"} marginTop={RFPercentage(6)} onPress={() => navigation.navigate("SuccessScreen")} />

        <View style={{ marginBottom: RFPercentage(8) }} />
      </ScrollView>

      {/* Bottom Tab */}
      <CustomTabBar postRequest={true} navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    width: "100%",
  },
  scrollViewContent: {
    alignItems: "center",
  },
  dropdownHeader: {
    marginTop: RFPercentage(3),
    width: "90%",
    height: RFPercentage(6.2),
    justifyContent: "space-between",
    alignItems: "center",
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    flexDirection: "row",
    paddingHorizontal: RFPercentage(2),
    backgroundColor: Colors.white,
    borderRadius: RFPercentage(1),
  },
  dropdownHeaderText: {
    color: Colors.heading,
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_400Regular",
    left: RFPercentage(-0.5),
  },
  dropdownIcon: {
    fontSize: RFPercentage(2.8),
    color: Colors.heading,
  },
  dropdown: {
    width: "90%",
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderWidth: RFPercentage(0.1),
    borderRadius: RFPercentage(1),
  },
  dropdownItem: {
    padding: RFPercentage(2),
  },
  dropdownItemText: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_400Regular",
    color: Colors.heading,
  },
});

export default PostRequest;