import React, { useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { AntDesign } from "@expo/vector-icons";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useDispatch } from "react-redux";
import { selectLocation, setLocation } from "../redux/Actions";
import axios from "axios";

export default function Location({ navigation, route }) {
  const { home } = route.params;
  const mapRef = useRef(null);
  const [marker, setMarker] = useState(null);
  const dispatch = useDispatch();

  const handleMapPress = async (event) => {
    const coordinate = event.nativeEvent.coordinate;
    setMarker(coordinate);

    mapRef.current.animateToRegion({
      ...coordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=AIzaSyD6oYSzWEiXZcVyKmeVZkB4ipevidlFDUo`);
      const results = response.data.results;
      const address = results[0]?.formatted_address || "Selected Location";

      if (home) {
        dispatch(
          selectLocation({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            name: address,
          })
        );
      } else {
        dispatch(
          setLocation({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
            name: address,
          })
        );
      }

    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      dispatch(
        setLocation({
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          name: "Unknown Location",
        })
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={RFPercentage(2.7)} color="black" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            placeholder="Search for a location"
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

              if (home) {
                dispatch(selectLocation(coordinate));
              } else {
                dispatch(setLocation(coordinate));
              }
            }}
            query={{
              key: "AIzaSyD6oYSzWEiXZcVyKmeVZkB4ipevidlFDUo",
              language: "en",
            }}
            styles={{
              textInput: {
                height: RFPercentage(6),
                fontSize: RFPercentage(1.8),
                fontFamily: "Poppins_400Regular",
              },
              listView: {
                backgroundColor: "white",
              },
              container: {
                flex: 1,
              },
            }}
          />
        </View>
      </View>

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
        {marker && <Marker coordinate={marker} title="Selected Location" />}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    position: "absolute",
    top: RFPercentage(2),
    flexDirection: "row",
    width: "90%",
    alignSelf: "center",
    zIndex: 10,
    // alignItems: "center",
  },
  backButton: {
    width: RFPercentage(5.3),
    height: RFPercentage(5.3),
    backgroundColor: "white",
    borderRadius: RFPercentage(100),
    alignItems: "center",
    justifyContent: "center",
    marginRight: RFPercentage(1),
  },
  searchContainer: {
    flex: 1,
  },
});
