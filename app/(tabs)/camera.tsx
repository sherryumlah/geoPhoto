import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import * as MediaLibrary from "expo-media-library";
import React, { useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GeoPhotoStrip } from "../../components/GeoPhotoStrip";
import { useLocation } from "../../hooks/useLocation";
import {
  insertGeoPhoto,
  updateGeoPhotoNote,
} from "../../lib/db/geoPhotoRepo";

type GeoPhoto = {
  uri: string;
  latitude: number | null;
  longitude: number | null;
  takenAt: string;
  city?: string;
  region?: string;
  country?: string;
  note?: string | null;
};

export default function CameraScreen() {
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  const {
    location,
    address,
    loading: locLoading,
    errorMsg: locError,
    refetchLocation,
  } = useLocation();

  const [photos, setPhotos] = useState<GeoPhoto[]>([]);
  const [mediaPermissionResponse, requestMediaPermission] =
    MediaLibrary.usePermissions();

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  // 🆕 note modal state
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [lastInsertedId, setLastInsertedId] = useState<number | null>(null);
  const [lastCapturedUri, setLastCapturedUri] = useState<string | null>(null);

  const isRunningInExpoGo =
    Constants.appOwnership === "expo" ||
    Constants.executionEnvironment === "storeClient";

  // no permission yet
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Checking camera permissions…</Text>
      </View>
    );
  }

  // user denied permission
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>We need your permission to use the camera.</Text>
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

  function buildAlbumName() {
    const country = address?.country || "Unknown Country";
    const region = address?.region || "Unknown Region";

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    return `geoPhoto - ${country} - ${region} - ${year}-${month}`;
  }

  async function takePhoto() {
    if (!cameraRef.current || !isCameraReady) {
      console.log("Camera not ready yet");
      return;
    }

    // Prevent double taps
    if (isTakingPhoto) return;
    setIsTakingPhoto(true);

    try {
      // 1. Capture
      const photo = await cameraRef.current.takePictureAsync({
        exif: true,
        quality: 1,
        skipProcessing: false,
      });

      // 2. Save to gallery (outside Expo Go on Android)
      if (!(Platform.OS === "android" && isRunningInExpoGo)) {
        const canSave = await ensureMediaPermission();
        if (!canSave) {
          Alert.alert(
            "Storage permission needed",
            "We couldn't save the photo to your gallery. Enable Photos/Media access in Settings."
          );
        } else {
          try {
            const asset = await MediaLibrary.createAssetAsync(photo.uri);
            const albumName = buildAlbumName();
            let album = await MediaLibrary.getAlbumAsync(albumName);
            if (!album) {
              await MediaLibrary.createAlbumAsync(albumName, asset, false);
            } else {
              await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }
          } catch (err) {
            console.warn("Could not save to media library", err);
          }
        }
      } else {
        Alert.alert(
          "Gallery save not available in Expo Go",
          "This is an Android 13+ limitation in Expo Go. Build a dev client to test gallery saves."
        );
      }

      // 3. build in-app record
      const lat = location ? location.coords.latitude : null;
      const lon = location ? location.coords.longitude : null;

      const newGeoPhoto: GeoPhoto = {
        uri: photo.uri,
        latitude: lat,
        longitude: lon,
        takenAt: new Date().toISOString(),
        city: address?.city,
        region: address?.region,
        country: address?.country,
        note: null,
      };

      // 4. persist to SQLite
      let insertedId: number | null = null;
      try {
        insertedId = await insertGeoPhoto({
          uri: newGeoPhoto.uri,
          taken_at: newGeoPhoto.takenAt,
          latitude: newGeoPhoto.latitude,
          longitude: newGeoPhoto.longitude,
          city: newGeoPhoto.city ?? null,
          region: newGeoPhoto.region ?? null,
          country: newGeoPhoto.country ?? null,
          note: null,
        });
      } catch (dbErr) {
        console.warn("Could not insert photo into SQLite", dbErr);
      }

      // 5. update UI immediately
      setPhotos((prev) => [newGeoPhoto, ...prev]);

      // 6. if we have a row id, open note modal
      if (insertedId) {
        setLastInsertedId(insertedId);
        setLastCapturedUri(newGeoPhoto.uri);
        setNoteText("");
        setNoteModalVisible(true);
      }
    } catch (err: any) {
      console.warn("Failed to capture image:", err);
      Alert.alert("Camera", "Failed to capture image. Try again.");
    } finally {
      setIsTakingPhoto(false);
    }
  }

  async function handleSaveNote() {
    // user hit Save in modal
    if (!lastInsertedId) {
      setNoteModalVisible(false);
      return;
    }

    const trimmed = noteText.trim();

    try {
      await updateGeoPhotoNote(lastInsertedId, trimmed);
    } catch (err) {
      console.warn("Could not update note in SQLite", err);
    }

    // also update the in-memory list
    if (lastCapturedUri) {
      setPhotos((prev) =>
        prev.map((p) =>
          p.uri === lastCapturedUri ? { ...p, note: trimmed } : p
        )
      );
    }

    setNoteModalVisible(false);
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
        onCameraReady={() => {
          setIsCameraReady(true);
        }}
      />

      {/* GPS + address status */}
      <View style={styles.statusBar}>
        <View style={styles.statusTextWrap}>
          {locLoading && <Text style={styles.statusText}>Getting GPS…</Text>}
          {locError && <Text style={styles.statusError}>No location: {locError}</Text>}
          {!locLoading && !locError && (location || address) && (
            <Text style={styles.statusText}>
              {address?.city ? `${address.city}, ` : ""}
              {address?.region ? `${address.region}, ` : ""}
              {address?.country ?? ""}
            </Text>
          )}
        </View>

        {/* refresh location */}
        <TouchableOpacity style={styles.refreshBtn} onPress={refetchLocation}>
          <Ionicons name="location" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* photo strip */}
      <View style={styles.photoStripContainer}>
        <GeoPhotoStrip photos={photos} />
      </View>

      {/* controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.smallButton} onPress={toggleCameraFacing}>
          <Text style={styles.buttonText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.shutter,
            locLoading || !isCameraReady || isTakingPhoto ? { opacity: 0.4 } : null,
          ]}
          onPress={takePhoto}
          disabled={locLoading || !isCameraReady || isTakingPhoto}
        />
      </View>

      {/* NOTE MODAL */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add a journal note</Text>
            <TextInput
              style={styles.input}
              placeholder="What do you want to remember about this place?"
              value={noteText}
              onChangeText={setNoteText}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#ddd" }]}
                onPress={() => setNoteModalVisible(false)}
              >
                <Text>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#2563eb" }]}
                onPress={handleSaveNote}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
  },
  text: { color: "#222", textAlign: "center" },
  button: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  statusBar: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusText: { color: "#fff", fontSize: 13 },
  statusError: { color: "#fca5a5", fontSize: 13 },
  refreshBtn: {
    backgroundColor: "rgba(0,0,0,0.45)",
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  photoStripContainer: {
    position: "absolute",
    bottom: 120,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
