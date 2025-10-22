import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { RFPercentage } from "react-native-responsive-fontsize";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { MaterialIcons } from "@expo/vector-icons";
import MyAppButton from "../components/common/MyAppButton";
import Nav from "../components/common/Nav";
import InputField from "../components/common/InputField";
import Colors from "../config/Colors";
import { useUser } from "../contexts/user.context";
import { useFocusEffect } from "@react-navigation/native";
import { updateProfile } from "../services/User.service";
import { Icons } from "../config/theme";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import { cachedTranslate } from "../utils/cachedTranslations";

type InputFieldType = {
  placeholder: string;
  value: string;
  secure?: boolean;
  icon?: any;
  title?: string;
  type?: string;
};

function EditProfile({ navigation }) {
  const { t } = useTranslation();
  const { userData: user } = useUser();
  const { theme } = useAppTheme();
  const [imageUri, setImageUri] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [originalData, setOriginalData] = useState({
    name: "",
    biography: "",
    imageUri: null,
  });

  const [translatedTexts, setTranslatedTexts] = useState({
    biographyTitle: "",
    biographyPlaceholder: "",
    biographyHint: "",
    validationError: "",
    pleaseEnterName: "",
    cameraPermissionTitle: "",
    cameraPermissionMessage: ""
  });

  const [inputField, setInputField] = useState<InputFieldType[]>([
    {
      placeholder: `${t("editProfile.txt1")}`,
      title: `${t("common.name")}`,
      value: "",
      type: "default",
    },
  ]);

  const [biography, setBiography] = useState("");
  const [translatedBiography, setTranslatedBiography] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  // Translate static texts
  useEffect(() => {
    const translateTexts = async () => {
      try {
        const [
          biographyTitle,
          biographyPlaceholder,
          biographyHint,
          validationError,
          pleaseEnterName,
          cameraPermissionTitle,
          cameraPermissionMessage
        ] = await Promise.all([
          cachedTranslate("Biography"),
          cachedTranslate("Tell others about yourself, your skills, and experience..."),
          cachedTranslate("Share your professional background, skills, and what makes you a great performer"),
          cachedTranslate("Validation Error"),
          cachedTranslate("Please enter your name"),
          cachedTranslate("Permission Required"),
          cachedTranslate("Sorry, we need camera roll permissions to change your profile picture.")
        ]);

        setTranslatedTexts({
          biographyTitle,
          biographyPlaceholder,
          biographyHint,
          validationError,
          pleaseEnterName,
          cameraPermissionTitle,
          cameraPermissionMessage
        });
      } catch (error) {
        console.log("Error translating texts:", error);
        // Set fallback texts
        setTranslatedTexts({
          biographyTitle: "Biography",
          biographyPlaceholder: "Tell others about yourself, your skills, and experience...",
          biographyHint: "Share your professional background, skills, and what makes you a great performer",
          validationError: "Validation Error",
          pleaseEnterName: "Please enter your name",
          cameraPermissionTitle: "Permission Required",
          cameraPermissionMessage: "Sorry, we need camera roll permissions to change your profile picture."
        });
      }
    };

    translateTexts();
  }, []);

  // Translate existing biography when component loads or biography changes
  useEffect(() => {
    const translateExistingBiography = async () => {
      if (biography && biography.trim() !== '') {
        setIsTranslating(true);
        try {
          const translated = await cachedTranslate(biography);
          setTranslatedBiography(translated);
        } catch (error) {
          console.log("Error translating existing biography:", error);
          setTranslatedBiography(biography); // Fallback to original
        } finally {
          setIsTranslating(false);
        }
      } else {
        setTranslatedBiography("");
      }
    };

    translateExistingBiography();
  }, [biography]);

  const handleChange = (text, i) => {
    let tempFields = [...inputField];
    tempFields[i].value = text;
    setInputField(tempFields);
  };

  const handleBiographyChange = (text) => {
    setBiography(text);
    // When user is typing, show the text directly without translation
    setTranslatedBiography(text);
  };

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        translatedTexts.cameraPermissionTitle || "Permission Required",
        translatedTexts.cameraPermissionMessage || "Sorry, we need camera roll permissions to change your profile picture."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const compressedImage = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 500, height: 500 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      setImageUri(compressedImage.uri);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      if (user) {
        const name = user?.userName || "";
        const bio = user?.biography || "";
        const image = user?.profileImage || null;
        const tempFields = [...inputField];
        tempFields[0].value = name;
        setInputField(tempFields);
        setOriginalData({ name, biography: bio, imageUri: image });
        setImageUri(image);
        setBiography(bio);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateProfileData = async () => {
    const userName = inputField[0].value.trim();
    const userBio = biography.trim(); // Store the original biography text

    if (!userName) {
      Toast.show({
        type: "error",
        text1: translatedTexts.validationError || "Validation Error",
        text2: translatedTexts.pleaseEnterName || "Please enter your name",
      });
      return;
    }

    const userData = {
      userName,
      biography: userBio, // Store original text, not translated
    };

    setIsUpdating(true);
    try {
      await updateProfile(userData, imageUri);
      Toast.show({
        type: "success",
        text1: `${t("toast.editProfile.one")}`,
        text2: `${t("toast.editProfile.two")}`,
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: `${t("toast.editProfile.three")}`,
        text2: `${t("toast.editProfile.four")}`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isChanged =
    inputField[0].value.trim() !== originalData.name.trim() ||
    biography.trim() !== originalData.biography.trim() ||
    imageUri !== originalData.imageUri;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.keyboard, { backgroundColor: theme.white }]}
    >
      <View style={[styles.screen, { backgroundColor: theme.white }]}>
        {/* Navigation Header */}
        <Nav
          dpNull={true}
          leftLogo={false}
          navigation={navigation}
          title={`${t("profile.txt2")}`}
          marginTop={RFPercentage(5)}
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Image Section */}
          <View style={styles.profileImageSection}>
            <View style={styles.imageContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={pickImage}
                style={styles.imageTouchable}
              >
                <View
                  style={[styles.imageWrapper, { borderColor: theme.primary }]}
                >
                  <Image
                    style={styles.profileImage}
                    source={imageUri ? { uri: imageUri } : Icons.dp}
                  />
                  <View
                    style={[
                      styles.editOverlay,
                      { backgroundColor: `${theme.primary}E6` },
                    ]}
                  >
                    <MaterialIcons
                      name="photo-camera"
                      size={RFPercentage(2.5)}
                      color={theme.white}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Section */}
          <View
            style={[
              styles.formContainer,
              {
                backgroundColor: theme.white,
                borderWidth: 1,
                borderColor:
                  theme.mode === "dark"
                    ? theme.border
                    : "rgba(238, 238, 238, 1)",
              },
            ]}
          >
            {/* Name Field */}
            <View style={styles.fieldSection}>
              <Text style={[styles.fieldLabel, { color: theme.heading }]}>
                {inputField[0].title}
              </Text>
              <InputField
                placeholder={inputField[0].placeholder}
                placeholderColor={theme.inputFieldPlaceholder}
                placeholderAtCenter={false}
                height={RFPercentage(5.5)}
                borderColor={theme.border}
                borderWidth={RFPercentage(0.1)}
                backgroundColor={theme.white || theme.white}
                borderRadius={RFPercentage(1)}
                color={theme.black}
                fontSize={RFPercentage(1.7)}
                fontFamily={"Poppins_400Regular"}
                onChangeText={(text) => handleChange(text, 0)}
                value={inputField[0].value}
                width="100%"
                returnKeyType="next"
              />
            </View>

            {/* Biography Field */}
            <View style={styles.fieldSection}>
              <View style={styles.biographyHeader}>
                <Text style={[styles.fieldLabel, { color: theme.heading }]}>
                  {translatedTexts.biographyTitle || "Biography"}
                </Text>
                <Text style={[styles.charCount, { color: theme.darkGrey }]}>
                  {biography.length}/300
                </Text>
              </View>

              <View
                style={[
                  styles.biographyInputContainer,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.white || theme.white,
                  },
                ]}
              >
                {isTranslating ? (
                  <View style={styles.translatingContainer}>
                    <Text style={[styles.translatingText, { color: theme.darkGrey }]}>
                      Translating...
                    </Text>
                  </View>
                ) : (
                  <TextInput
                    placeholder={translatedTexts.biographyPlaceholder || "Tell others about yourself, your skills, and experience..."}
                    placeholderTextColor={theme.inputFieldPlaceholder}
                    value={translatedBiography}
                    multiline
                    onChangeText={handleBiographyChange}
                    maxLength={300}
                    style={[styles.biographyInput, { color: theme.black }]}
                    textAlignVertical="top"
                    cursorColor={theme.primary}
                    selectionColor={`${theme.primary}40`}
                    numberOfLines={5}
                  />
                )}
              </View>

              <Text style={[styles.biographyHint, { color: theme.darkGrey }]}>
                {translatedTexts.biographyHint || "Share your professional background, skills, and what makes you a great performer"}
              </Text>
            </View>
          </View>
          {/* Action Section */}
          <View style={styles.actionSection}>
            <MyAppButton
              title={`${t("editProfile.txt4")}`}
              onPress={updateProfileData}
              loading={isUpdating}
              disabled={!isChanged || isUpdating}
              marginTop={RFPercentage(2)}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: RFPercentage(4),
  },
  profileImageSection: {
    alignItems: "center",
    paddingVertical: RFPercentage(3),
    paddingHorizontal: RFPercentage(2),
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  imageTouchable: {
    position: "relative",
  },
  imageWrapper: {
    borderWidth: RFPercentage(0.3),
    borderRadius: RFPercentage(8),
    padding: RFPercentage(0.3),
  },
  profileImage: {
    width: RFPercentage(12),
    height: RFPercentage(12),
    borderRadius: RFPercentage(100),
  },
  editOverlay: {
    position: "absolute",
    bottom: RFPercentage(1),
    right: RFPercentage(-1),
    width: RFPercentage(4),
    height: RFPercentage(4),
    borderRadius: RFPercentage(2),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  removePhotoButton: {
    position: "absolute",
    right: RFPercentage(-1),
    width: RFPercentage(3),
    height: RFPercentage(3),
    borderRadius: RFPercentage(1.5),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  imageHint: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(1),
  },
  formContainer: {
    marginHorizontal: RFPercentage(2),
    borderRadius: RFPercentage(1.5),
    padding: RFPercentage(3),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: RFPercentage(2),
  },
  fieldSection: {
    marginBottom: RFPercentage(3),
  },
  fieldLabel: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1),
  },
  biographyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  biographyInputContainer: {
    borderRadius: RFPercentage(1),
    borderWidth: 1,
    padding: RFPercentage(1.5),
    minHeight: RFPercentage(15),
  },
  biographyInput: {
    fontFamily: "Poppins_400Regular",
    fontSize: RFPercentage(1.5),
    lineHeight: RFPercentage(2.2),
    flex: 1,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
  },
  biographyHint: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(1),
    fontStyle: "italic",
  },
  actionSection: {
    paddingHorizontal: RFPercentage(2),
    marginBottom: RFPercentage(2),
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    paddingVertical: RFPercentage(1.5),
    borderRadius: RFPercentage(1),
    borderWidth: 1,
    alignItems: "center",
    marginTop: RFPercentage(1),
  },
  cancelButtonText: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_500Medium",
  },
  translatingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: RFPercentage(10),
  },
  translatingText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    fontStyle: "italic",
  },
});

export default EditProfile;