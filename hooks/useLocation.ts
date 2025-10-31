import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<{
    city?: string;
    region?: string;
    country?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);

      const geo = await Location.reverseGeocodeAsync(loc.coords);
      if (geo.length > 0) {
        const { city, region, country } = geo[0];
        setAddress({ city, region, country });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to get location");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { location, address, loading, errorMsg, refetchLocation: fetchLocation };
}
