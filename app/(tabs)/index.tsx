import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // 1. ask for permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLoading(false);
        return;
      }

      // 2. get current position
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setLoading(false);
    })();
  }, []);

  let content = null;

  if (loading) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text>Getting your location…</Text>
      </View>
    );
  } else if (errorMsg) {
    content = (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMsg}</Text>
        <Text>Enable location for geoPhoto in your phone settings.</Text>
      </View>
    );
  } else if (location) {
    content = (
      <View style={styles.center}>
        <Text style={styles.title}>Your location</Text>
        <Text>Latitude: {location.coords.latitude}</Text>
        <Text>Longitude: {location.coords.longitude}</Text>
        <Text>Accuracy: {location.coords.accuracy} m</Text>
      </View>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  error: {
    color: "red",
    fontWeight: "500",
  },
});
