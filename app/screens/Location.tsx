import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  Text,
  Alert,
  StatusBar,
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

  // Function to extract country code from Google Geocoding response
  const extractCountryCode = (addressComponents) => {
    if (!addressComponents) return null;

    const countryComponent = addressComponents.find((component) =>
      component.types.includes("country")
    );

    if (countryComponent) {
      return countryComponent.short_name; // Returns ISO 3166-1 alpha-2 country code (e.g., "US", "DE", "FR")
    }

    return null;
  };

  // Function to extract address components
  const extractAddressInfo = (addressComponents) => {
    if (!addressComponents) return {};

    const countryComponent = addressComponents.find((component) =>
      component.types.includes("country")
    );
    const localityComponent = addressComponents.find((component) =>
      component.types.includes("locality")
    );
    const administrativeAreaComponent = addressComponents.find((component) =>
      component.types.includes("administrative_area_level_1")
    );

    return {
      countryCode: countryComponent?.short_name || null,
      country: countryComponent?.long_name || null,
      city: localityComponent?.long_name || null,
      state: administrativeAreaComponent?.long_name || null,
    };
  };

  useEffect(() => {
    const fetchUserLocation = async () => {
      const loc = await getCurrentLocation();
      if (loc) {
        try {
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${loc.latitude},${loc.longitude}&key=${key}`
          );
          const results = response.data.results;
          const address = results[0]?.formatted_address || "Current Location";
          const addressComponents = results[0]?.address_components;

          const addressInfo = extractAddressInfo(addressComponents);

          setMarker(loc);
          setSelectedLocation({
            ...loc,
            name: address,
            countryCode: addressInfo.countryCode,
            country: addressInfo.country,
            city: addressInfo.city,
            state: addressInfo.state,
          });

          mapRef.current?.animateToRegion({
            ...loc,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } catch (error) {
          setMarker(loc);
          setSelectedLocation({
            ...loc,
            name: "Current Location",
            countryCode: null,
            country: null,
            city: null,
            state: null,
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
    console.log("🖱️ Map Pressed at:", coordinate);

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
      const addressComponents = results[0]?.address_components;

      const addressInfo = extractAddressInfo(addressComponents);

      const locationData = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name: address,
        countryCode: addressInfo.countryCode,
        country: addressInfo.country,
        city: addressInfo.city,
        state: addressInfo.state,
      };

      setSelectedLocation(locationData);

      console.log("📍 Selected Location:", locationData);
    } catch (error) {
      setSelectedLocation({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        name: "Unknown Location",
        countryCode: null,
        country: null,
        city: null,
        state: null,
      });
    }
  };

  const handleApplyFilter = () => {
    if (!selectedLocation) {
      return;
    }

    // Prepare location data for dispatch
    const locationData = {
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      name: selectedLocation.name,
      countryCode: selectedLocation.countryCode,
      country: selectedLocation.country,
      city: selectedLocation.city,
      state: selectedLocation.state,
    };

    if (home) {
      dispatch(selectLocation(locationData));
    } else {
      dispatch(setLocation(locationData));
    }

    console.log("📍 Dispatching location:", locationData);
    navigation.goBack();
  };

  // Handle Google Places selection with country code extraction
  const handlePlaceSelect = async (data, details = null) => {
    const location = details.geometry.location;

    try {
      // Get detailed address information using reverse geocoding
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${key}`
      );

      const results = response.data.results;
      const address = data.description;
      const addressComponents = results[0]?.address_components;

      const addressInfo = extractAddressInfo(addressComponents);

      const coordinate = {
        latitude: location.lat,
        longitude: location.lng,
        name: address,
        countryCode: addressInfo.countryCode,
        country: addressInfo.country,
        city: addressInfo.city,
        state: addressInfo.state,
      };

      mapRef.current.animateToRegion({
        ...coordinate,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      setMarker(coordinate);
      setSelectedLocation(coordinate);

      console.log("📍 Place selected:", coordinate);
    } catch (error) {
      // Fallback if reverse geocoding fails
      const coordinate = {
        latitude: location.lat,
        longitude: location.lng,
        name: data.description,
        countryCode: null,
        country: null,
        city: null,
        state: null,
      };

      mapRef.current.animateToRegion({
        ...coordinate,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      setMarker(coordinate);
      setSelectedLocation(coordinate);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
        backgroundColor={"transparent"}
        translucent
      />
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
            onPress={handlePlaceSelect}
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

          {/* Show location details for debugging */}
          {selectedLocation.countryCode && (
            <Text style={[styles.locationDetails, { color: theme.darkGrey }]}>
              {selectedLocation.city && `${selectedLocation.city}, `}
              {selectedLocation.country} ({selectedLocation.countryCode})
            </Text>
          )}
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
    top: Platform.OS === "ios" ? RFPercentage(8) : RFPercentage(5),
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
    alignItems: "center",
  },
  applyButton: {
    paddingHorizontal: RFPercentage(2.4),
    paddingVertical: RFPercentage(1.6),
    borderRadius: RFPercentage(10),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: RFPercentage(1),
  },
  applyButtonText: {
    color: "white",
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_500Medium",
    lineHeight: RFPercentage(2),
  },
  locationDetails: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    opacity: 1,
    width: "90%",
  },
});
