import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { on } from "../../lib/db/eventBus";
import {
  deleteGeoPhotoAndFile,
  getRecentGeoPhotos,
  type GeoPhotoRow,
} from "../../lib/db/geoPhotoRepo";

export default function GalleryScreen() {
  const [photos, setPhotos] = useState<GeoPhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GeoPhotoRow | null>(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getRecentGeoPhotos(60);
      setPhotos(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = (photo: GeoPhotoRow) => {
    Alert.alert(
      "Delete photo?",
      "This will remove it from your device's photos (if allowed).",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const res = await deleteGeoPhotoAndFile(photo);

            if (!res?.ok) {
              // don't close, tell user why
              Alert.alert(
                "Couldn't delete photo",
                "Android didn't give permission to delete this photo from the media library. You can change this in Settings."
              );
              return;
            }

            // success → close modal
            setSelected(null);
          },
        },
      ]
    );
  };


  // initial load
  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // refresh when created OR deleted
  useEffect(() => {
    const offCreated = on("geoPhoto:created", () => {
      loadPhotos();
    });

    const offDeleted = on("geoPhoto:deleted", () => {
      loadPhotos();
    });

    const offUpdated = on("geoPhoto:updated", () => {
      loadPhotos();
    });

    return () => {
      offCreated();
      offDeleted();
      offUpdated();
    };
  }, [loadPhotos]);

  const renderItem = ({ item }: { item: GeoPhotoRow }) => (
    <PhotoTile photo={item} onPress={() => setSelected(item)} />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Gallery</Text>

      {loading ? (
        <ActivityIndicator />
      ) : photos.length === 0 ? (
        <Text style={styles.empty}>No photos yet. Go capture one.</Text>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
        />
      )}

      <PhotoDetailsModal
        photo={selected}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
      />
    </View>
  );
}

function PhotoTile({
  photo,
  onPress,
}: {
  photo: GeoPhotoRow;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tile}>
      <Image source={{ uri: photo.uri }} style={styles.image} />
    </Pressable>
  );
}

function PhotoDetailsModal({
  photo,
  onClose,
  onDelete,
}: {
  photo: GeoPhotoRow | null;
  onClose: () => void;
  onDelete: (photo: GeoPhotoRow) => void;
}) {
  return (
    <Modal visible={!!photo} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Photo details</Text>

          {photo?.uri ? (
            <Image source={{ uri: photo.uri }} style={styles.modalImage} />
          ) : null}

          <Text style={styles.label}>Note</Text>
          <Text style={styles.value}>
            {photo?.note && photo.note.trim().length > 0
              ? photo.note
              : "No note saved for this photo."}
          </Text>

          {photo?.taken_at ? (
            <>
              <Text style={styles.label}>Taken at</Text>
              <Text style={styles.value}>
                {new Date(photo.taken_at).toLocaleString()}
              </Text>
            </>
          ) : null}

          {photo && (photo.city || photo.country) ? (
            <>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>
                {[photo.city, photo.region, photo.country]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </>
          ) : null}

          {/* 2) render actions together */}
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>

            {photo ? (
              <Pressable onPress={() => onDelete(photo)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const TILE_SIZE = 110;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 22,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingTop: 46,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 40,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: "#eee",
    borderRadius: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  empty: {
    padding: 16,
    textAlign: "center",
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 8,
    color: "#555",
  },
  value: {
    fontSize: 14,
    color: "#111",
    marginTop: 2,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  closeBtn: {
    backgroundColor: "#111",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeText: {
    color: "#fff",
    fontWeight: "500",
  },
  deleteBtn: {
    backgroundColor: "#c62828",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "500",
  },
});
