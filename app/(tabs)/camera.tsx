import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CameraScreen() {
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);

  // 1) still loading permissions
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Checking camera permissions…</Text>
      </View>
    );
  }

  // 2) user has not granted permissions
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
    setLastPhotoUri(photo.uri);
    // later: also grab location here and save together
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

      <View style={styles.controls}>
        <TouchableOpacity style={styles.smallButton} onPress={toggleCameraFacing}>
          <Text style={styles.buttonText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shutter} onPress={takePhoto} />

        {lastPhotoUri ? (
          <View style={styles.previewBox}>
            <Text numberOfLines={1} style={styles.previewText}>
              Saved: {lastPhotoUri}
            </Text>
          </View>
        ) : null}
      </View>
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
  previewBox: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: "40%",
  },
  previewText: {
    color: "#fff",
    fontSize: 12,
  },
});
