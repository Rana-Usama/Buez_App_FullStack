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

  useEffect(() => {
    const fetchUserLocation = async () => {
      const loc = await getCurrentLocation();
      if (loc) {
        try {
          // Reverse geocode current location to get a name
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.latitude},${loc.longitude}&key=${key}`
          );
          const results = response.data.results;
          const address = results[0]?.formatted_address || "Current Location";

          setMarker(loc);
          setSelectedLocation({
            ...loc,
            name: address, // set the actual location name
          });

          mapRef.current?.animateToRegion({
            ...loc,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } catch (error) {
          console.log("Reverse geocoding failed:", error);
          setMarker(loc);
          setSelectedLocation({
            ...loc,
            name: "Current Location",
          });
        }
      } else {
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
    setMarker(coordinate);

    mapRef.current.animateToRegion({
      ...coordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${key}`
      );
      const results = response.data.results;
      const address = results[0]?.formatted_address || "Selected Location";

      setSelectedLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name: address,
      });
    } catch (error) {
      console.log("Reverse geocoding failed:", error);
      setSelectedLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name: "Unknown Location",
      });
    }
  };

  const handleApplyFilter = () => {
    if (!selectedLocation) return;
    if (home) {
      dispatch(selectLocation(selectedLocation));
    } else {
      dispatch(setLocation(selectedLocation));
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
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
