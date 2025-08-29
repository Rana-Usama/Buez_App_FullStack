import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { saveLocationToSecureStore, getLocationFromSecureStore } from "../services/Auth.service";

export function useLocation() {
  const [location, setLocation] = useState(null);

  // Ask permission & fetch once
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Location permission denied");
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
    await saveLocationToSecureStore(coords);
    setLocation(coords);
    return coords;
  };

  // Start watching
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
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setLocation(coords);
          await saveLocationToSecureStore(coords);
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
