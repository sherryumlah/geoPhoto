import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocation } from "../../hooks/useLocation";

export default function HomeScreen() {
  const { location, loading, errorMsg } = useLocation();

  let content = null;

  if (loading) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.text}>Getting your location…</Text>
      </View>
    );
  } else if (errorMsg) {
    content = (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMsg}</Text>
        <Text style={styles.text}>
          Enable location for geoPhoto in your phone settings.
        </Text>
      </View>
    );
  } else if (location) {
    content = (
      <View style={styles.center}>
        <Text style={styles.title}>Your location</Text>
        <Text style={styles.coord}>
          Latitude: {location.coords.latitude.toFixed(5)}
        </Text>
        <Text style={styles.coord}>
          Longitude: {location.coords.longitude.toFixed(5)}
        </Text>
        <Text style={styles.coord}>
          Accuracy: {location.coords.accuracy.toFixed(2)} m
        </Text>
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
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  coord: {
    fontSize: 16,
    color: "#333",
  },
  text: {
    color: "#333",
    textAlign: "center",
  },
  error: {
    color: "red",
    fontWeight: "500",
    textAlign: "center",
  },
});
