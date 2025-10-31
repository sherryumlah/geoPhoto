import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

export type GeoPhoto = {
  uri: string;
  latitude: number | null;
  longitude: number | null;
  takenAt: string;
};

type GeoPhotoStripProps = {
  photos: GeoPhoto[];
};

const THUMB_SIZE = 80;

export function GeoPhotoStrip({ photos }: GeoPhotoStripProps) {
  if (photos.length === 0) return null;

  return (
    <View style={styles.listContainer}>
      <Text style={styles.listTitle}>Recent GeoPhotos</Text>
      <ScrollView
        style={styles.scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {photos.map((p, idx) => (
          <View key={idx} style={styles.photoCard}>
            <Image source={{ uri: p.uri }} style={styles.photoThumb} />
            <Text style={styles.photoMeta} numberOfLines={1}>
              {p.latitude && p.longitude
                ? `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`
                : "No GPS"}
            </Text>
            <Text style={styles.photoTime}>
              {new Date(p.takenAt).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  listTitle: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 6,
  },
  scroll: {
    maxHeight: THUMB_SIZE + 30,
  },
  photoCard: {
    marginRight: 10,
    alignItems: "center",
    width: THUMB_SIZE + 10,
  },
  photoThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    backgroundColor: "#111",
  },
  photoMeta: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    marginTop: 4,
  },
  photoTime: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
  },
});
