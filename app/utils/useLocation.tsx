import { useEffect, useState } from "react";
import * as Location from "expo-location";
import axios from "axios";
import { saveLocationToSecureStore, getLocationFromSecureStore } from "../services/Auth.service";

export function useLocation() {
  const [location, setLocation] = useState(null);
  const key = process.env.EXPO_PUBLIC_LOCATION_NAME;

  // Function to extract address components
  const extractAddressInfo = (addressComponents) => {
    if (!addressComponents) return {};
    
    const countryComponent = addressComponents.find(component =>
      component.types.includes("country")
    );
    const localityComponent = addressComponents.find(component =>
      component.types.includes("locality")
    );
    const administrativeAreaComponent = addressComponents.find(component =>
      component.types.includes("administrative_area_level_1")
    );
    
    return {
      countryCode: countryComponent?.short_name || null,
      country: countryComponent?.long_name || null,
      city: localityComponent?.long_name || null,
      state: administrativeAreaComponent?.long_name || null,
    };
  };

  // Function to get detailed location info from coordinates
  const getDetailedLocationInfo = async (coords) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${key}`
      );
      
      const results = response.data.results;
      if (results && results.length > 0) {
        const address = results[0]?.formatted_address || "Current Location";
        const addressComponents = results[0]?.address_components;
        
        const addressInfo = extractAddressInfo(addressComponents);

        return {
          latitude: coords.latitude,
          longitude: coords.longitude,
          name: address,
          countryCode: addressInfo.countryCode,
          country: addressInfo.country,
          city: addressInfo.city,
          state: addressInfo.state,
        };
      }
    } catch (error) {
      console.log("Error getting detailed location info:", error);
    }

    // Fallback if geocoding fails
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      name: "Current Location",
      countryCode: null,
      country: null,
      city: null,
      state: null,
    };
  };

  // Ask permission & fetch once with detailed info
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return null;
      }
      
      const loc = await Location.getCurrentPositionAsync({});
      const basicCoords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      // Get detailed location information
      const detailedLocation = await getDetailedLocationInfo(basicCoords);
      
      await saveLocationToSecureStore(detailedLocation);
      setLocation(detailedLocation);
      return detailedLocation;
    } catch (error) {
      console.log("Error getting current location:", error);
      return null;
    }
  };

  // Start watching with detailed info
  useEffect(() => {
    let subscription;
    const startWatching = async () => {
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 50,
        },
        async (loc) => {
          const basicCoords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          
          // Get detailed location information
          const detailedLocation = await getDetailedLocationInfo(basicCoords);
          
          setLocation(detailedLocation);
          await saveLocationToSecureStore(detailedLocation);
        }
      );
    };
    startWatching();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  // Load from storage initially
  useEffect(() => {
    (async () => {
      const stored = await getLocationFromSecureStore();
      if (stored) {
        setLocation(stored);
      } else {
        await getCurrentLocation();
      }
    })();
  }, []);

  return { location, getCurrentLocation };
}