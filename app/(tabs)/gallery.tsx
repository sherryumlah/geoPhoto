import { getRecentGeoPhotos, type GeoPhotoRow } from "@/lib/db/geoPhotoRepo";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

export default function ExploreScreen() {
  const [photos, setPhotos] = useState<GeoPhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GeoPhotoRow | null>(null);

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await getRecentGeoPhotos(60);
      setPhotos(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
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

      <PhotoDetailsModal photo={selected} onClose={() => setSelected(null)} />
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
}: {
  photo: GeoPhotoRow | null;
  onClose: () => void;
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

          {(photo?.city || photo?.country) ? (
            <>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>
                {[photo.city, photo.region, photo.country].filter(Boolean).join(", ")}
              </Text>
            </>
          ) : null}

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
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
  closeBtn: {
    marginTop: 16,
    alignSelf: "flex-end",
    backgroundColor: "#111",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeText: {
    color: "#fff",
    fontWeight: "500",
  },
});
