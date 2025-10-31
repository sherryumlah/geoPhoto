import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import React, { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GeoPhotoStrip } from "../../components/GeoPhotoStrip";
import { useLocation } from "../../hooks/useLocation";

type GeoPhoto = {
  uri: string;
  latitude: number | null;
  longitude: number | null;
  takenAt: string;
};

export default function CameraScreen() {
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const { location, loading: locLoading, errorMsg: locError } = useLocation();

  const [photos, setPhotos] = useState<GeoPhoto[]>([]);

  const [mediaPermissionResponse, requestMediaPermission] = 
    MediaLibrary.usePermissions();

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Checking camera permissions…</Text>
      </View>
    );
  }

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

  async function ensureMediaPermission() {  
    if (!mediaPermissionResponse || !mediaPermissionResponse.granted) {
      const res = await requestMediaPermission();
      return res?.granted ?? false;
    }
    return true;
  }

  async function takePhoto() {
    if (!cameraRef.current) return;

    // 1. take the photo with the camera (Expo gives us a URI, e.g. file:///...)
    const photo = await cameraRef.current.takePictureAsync();

    // 2. try to save it to the device's media library
    const canSave = await ensureMediaPermission();
    if (!canSave) {
      Alert.alert(
        "Storage permission needed",
        "We couldn't save the photo to your gallery. You can enable Photos/Media access in Settings."
      );
    } else {
      try {
        // create an asset (photo) in the library
        const asset = await MediaLibrary.createAssetAsync(photo.uri);

        // OPTIONAL: put it in a custom album called "geoPhoto"
        const albumName = "geoPhoto";
        let album = await MediaLibrary.getAlbumAsync(albumName);
        if (!album) {
          // create the album and add the asset
          await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          // add to existing album
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch (err) {
        console.warn("Could not save to media library", err);
      }
    }
    
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
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

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

      {/* Recent GeoPhotos Strip */}
      <View style={styles.photoStripContainer}>
        <GeoPhotoStrip photos={photos} />
      </View>

      {/* Camera controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.smallButton} onPress={toggleCameraFacing}>
          <Text style={styles.buttonText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shutter, locLoading ? { opacity: 0.5 } : null]}
          onPress={takePhoto}
          disabled={locLoading}
        />
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

  /* NEW: wrap the photo strip and float it */
  photoStripContainer: {
    position: "absolute",
    bottom: 120, // above controls
    left: 0,
    right: 0,
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
});
