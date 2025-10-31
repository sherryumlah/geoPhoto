import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocation } from "../../hooks/useLocation";

export default function HomeScreen() {
  const { location, address, loading, errorMsg, refetchLocation } = useLocation();

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.text}>Getting your location…</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.center}>
          <Text style={styles.error}>{errorMsg}</Text>
        </View>
      ) : (
        <View style={styles.center}>
          {address && (
            <>
              <Text style={styles.title}>Last Known Location:</Text>
              <Text style={styles.location}>
                {address.city}, {address.region}, {address.country}
              </Text>
            </>
          )}
          {location && (
            <Text style={styles.coords}>
              {location.coords.latitude.toFixed(5)},{" "}
              {location.coords.longitude.toFixed(5)}
            </Text>
          )}
        </View>
      )}

      {/* Refresh button */}
      <TouchableOpacity style={styles.refreshBtn} onPress={refetchLocation}>
        <Text style={styles.refreshText}>Refresh Location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  text: { color: "#333" },
  title: { fontSize: 18, fontWeight: "600", color: "#fff" },
  location: { fontSize: 16, color: "#2563eb", fontWeight: "500", textAlign: "center" },
  coords: { fontSize: 14, color: "#ddd" },
  error: { color: "red" },
  refreshBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 30,
  },
  refreshText: { color: "#fff", fontWeight: "600" },
});
