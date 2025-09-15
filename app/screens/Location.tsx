import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  Text,
  Alert,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { AntDesign } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useDispatch } from "react-redux";
import { selectLocation, setLocation } from "../redux/Actions";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useAppTheme } from "../contexts/themeContext";
import Colors from "../config/Colors";
import { useLocation } from "../utils/useLocation";

export default function Location({ navigation, route }) {
  const { home } = route.params;
  const mapRef = useRef(null);
  const [marker, setMarker] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const { location: currentLocation, getCurrentLocation } = useLocation();
  const key = process.env.EXPO_PUBLIC_LOCATION_NAME;

  console.log("🔑 API Key Loaded:", key);

  useEffect(() => {
    const fetchUserLocation = async () => {
      console.log("📍 Fetching user location...");
      const loc = await getCurrentLocation();
      console.log("📍 Current Location:", loc);

      if (loc) {
        try {
          console.log("🌍 Calling Google Reverse Geocode API...");
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.latitude},${loc.longitude}&key=${key}`
          );
          console.log("✅ Geocode Response:", response.data);

          const results = response.data.results;
          const address = results[0]?.formatted_address || "Current Location";

          setMarker(loc);
          setSelectedLocation({
            ...loc,
            name: address,
          });

          mapRef.current?.animateToRegion({
            ...loc,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } catch (error) {
          console.log("❌ Reverse geocoding failed:", error);
          setMarker(loc);
          setSelectedLocation({
            ...loc,
            name: "Current Location",
          });
        }
      } else {
        console.log("⚠️ Location permission not granted");
        Alert.alert(
          "Location Permission",
          "We need location access to show your current position. You can still search or pick manually."
        );
      }
    };
    fetchUserLocation();
  }, []);

  const handleMapPress = async (event) => {
    const coordinate = event.nativeEvent.coordinate;
    console.log("🖱️ Map Pressed at:", coordinate);

    setMarker(coordinate);

    mapRef.current.animateToRegion({
      ...coordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    try {
      console.log("🌍 Calling Google Reverse Geocode API for pressed location...");
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${key}`
      );
      console.log("✅ Geocode Response (Pressed Location):", response.data);

      const results = response.data.results;
      const address = results[0]?.formatted_address || "Selected Location";

      setSelectedLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name: address,
      });

      console.log("📍 Selected Location:", {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name: address,
      });
    } catch (error) {
      console.log("❌ Reverse geocoding failed (Pressed Location):", error);
      setSelectedLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name: "Unknown Location",
      });
    }
  };

  const handleApplyFilter = () => {
    if (!selectedLocation) {
      console.log("⚠️ No location selected, cannot apply.");
      return;
    }
    console.log("✅ Applying selected location:", selectedLocation);

    if (home) {
      dispatch(selectLocation(selectedLocation));
      console.log("📤 Dispatched selectLocation");
    } else {
      dispatch(setLocation(selectedLocation));
      console.log("📤 Dispatched setLocation");
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            console.log("🔙 Back button pressed");
            navigation.goBack();
          }}
          style={[styles.backButton, { backgroundColor: theme.white }]}
        >
          <AntDesign
            name="arrowleft"
            size={RFPercentage(2.7)}
            color={theme.grey}
          />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            placeholder={t("location.placholder")}
            fetchDetails={true}
            onPress={(data, details = null) => {
              console.log("🔍 Place selected:", data);
              console.log("📍 Place details:", details);

              const location = details.geometry.location;
              const coordinate = {
                latitude: location.lat,
                longitude: location.lng,
                name: data.description,
              };

              mapRef.current.animateToRegion({
                ...coordinate,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });

              setMarker(coordinate);
              setSelectedLocation(coordinate);

              console.log("✅ Location set from search:", coordinate);
            }}
            query={{
              key: key,
              language: "en",
            }}
            styles={{
              poweredContainer: { backgroundColor: theme.white },
              textInput: {
                height: RFPercentage(6),
                fontSize: RFPercentage(1.8),
                fontFamily: "Poppins_400Regular",
                backgroundColor: theme.white,
                color: theme.black,
              },
              listView: { backgroundColor: theme.white },
              row: { backgroundColor: theme.white },
              description: { color: theme.black },
              container: { flex: 1 },
            }}
            textInputProps={{
              placeholderTextColor: theme.grey,
              onChangeText: (text) => {
                console.log("⌨️ Search input:", text);
              },
            }}
          />
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={handleMapPress}
      >
        {marker && (
          <Marker
            coordinate={marker}
            title={selectedLocation?.name || "Selected Location"}
          />
        )}
      </MapView>

      {/* Apply Button */}
      {selectedLocation && (
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleApplyFilter}
            style={[styles.applyButton, { backgroundColor: Colors.primary }]}
          >
            <Text style={styles.applyButtonText}>{t("location.apply")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  topRow: {
    position: "absolute",
    top: Platform.OS === "ios" ? RFPercentage(8) : RFPercentage(2),
    flexDirection: "row",
    width: "90%",
    alignSelf: "center",
    zIndex: 10,
  },
  backButton: {
    width: RFPercentage(5.3),
    height: RFPercentage(5.3),
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    marginRight: RFPercentage(1),
    top: RFPercentage(0.3),
  },
  searchContainer: { flex: 1 },
  buttonWrapper: {
    position: "absolute",
    bottom: RFPercentage(5),
    alignSelf: "center",
  },
  applyButton: {
    paddingHorizontal: RFPercentage(2.4),
    paddingVertical: RFPercentage(1.5),
    borderRadius: RFPercentage(10),
    justifyContent: "center",
    alignItems: "center",
  },
  applyButtonText: {
    color: "white",
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
  },
});
