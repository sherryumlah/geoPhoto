import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocation } from "../../hooks/useLocation";

export default function HomeScreen() {
  const { location, address, loading, errorMsg, refetchLocation } = useLocation();

  useFocusEffect(
    useCallback(() => {
      refetchLocation();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.text}>Getting your location…</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      {address && (
        <>
          <Text style={styles.title}>You are in:</Text>
          <Text style={styles.location}>
            {address.city}, {address.region}, {address.country}
          </Text>
        </>
      )}
      {location && (
        <Text style={styles.coords}>
          {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  text: { color: "#333" },
  title: { fontSize: 18, fontWeight: "600" },
  location: { fontSize: 16, color: "#2563eb", fontWeight: "500" },
  coords: { fontSize: 14, color: "#555" },
  error: { color: "red" },
});
