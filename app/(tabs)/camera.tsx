import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocation } from "../../hooks/useLocation";

type GeoPhoto = {
  uri: string;
  latitude: number | null;
  longitude: number | null;
  takenAt: string; 
}

export default function CameraScreen() {
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  // get current location (could be loading)
  const { location, loading: locLoading, errorMsg: locError } = useLocation();

  // local list of photos we’ve taken this session
  const [photos, setPhotos] = useState<GeoPhoto[]>([]);

  // 1) still loading camera permissions
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Checking camera permissions…</Text>
      </View>
    );
  }

  // 2) user has not granted camera permissions
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>
          We need your permission to use the camera.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function takePhoto() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync();

    // location might still be loading or might have failed
    const lat = location ? location.coords.latitude : null;
    const lon = location ? location.coords.longitude : null;

    const newGeoPhoto: GeoPhoto = {
      uri: photo.uri,
      latitude: lat,
      longitude: lon,
      takenAt: new Date().toISOString(),
    };

    setPhotos((prev) => [newGeoPhoto, ...prev]);
  }

  function toggleCameraFacing() {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      />

      {/* camera controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.smallButton} onPress={toggleCameraFacing}>
          <Text style={styles.buttonText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.shutter,
            // if location is still loading, give visual hint (dim button)
            locLoading ? { opacity: 0.5 } : null,
          ]}
          onPress={takePhoto}
          disabled={locLoading} // we can choose to disable until we have a fix
        />
      </View>

      {/* status strip for location */}
      <View style={styles.statusBar}>
        {locLoading && <Text style={styles.statusText}>Getting GPS…</Text>}
        {locError && <Text style={styles.statusError}>No location: {locError}</Text>}
        {!locLoading && !locError && location && (
          <Text style={styles.statusText}>
            {location.coords.latitude.toFixed(5)}, {location.coords.longitude.toFixed(5)}
          </Text>
        )}
      </View>

      {/* simple list of captured geo-photos */}
      {photos.length > 0 && (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Recent geo photos</Text>
          <ScrollView style={styles.scroll}>
            {photos.map((p, idx) => (
              <View key={idx} style={styles.photoRow}>
                <Text numberOfLines={1} style={styles.photoText}>
                  {p.uri}
                </Text>
                <Text style={styles.photoMeta}>
                  {p.latitude && p.longitude
                    ? `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`
                    : "No GPS"}
                </Text>
                <Text style={styles.photoMeta}>
                  {new Date(p.takenAt).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
  },
  text: {
    color: "#222",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  smallButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  shutter: {
    width: 70,
    height: 70,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statusBar: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  statusText: {
    color: "#fff",
    fontSize: 13,
  },
  statusError: {
    color: "#fca5a5",
    fontSize: 13,
  },
  listContainer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    maxHeight: 150,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  listTitle: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 6,
  },
  scroll: {
    maxHeight: 120,
  },
  photoRow: {
    marginBottom: 6,
  },
  photoText: {
    color: "#fff",
    fontSize: 11,
  },
  photoMeta: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
  },
});
