import * as Location from "expo-location";
import { useEffect, useState } from "react";

type UseLocationResult = {
  location: Location.LocationObject | null;
  loading: boolean;
  errorMsg: string | null;
};

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // ask for permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied. Please grant permission for the app to locate you.");
        setLoading(false);
        return;
      }

      // get current position
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setLoading(false);
    })();
  }, []);

  return {
    location,
    loading,
    errorMsg,
  };
}
