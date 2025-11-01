import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { db } from "./db";
import { emit } from "./eventBus";

export type GeoPhotoRow = {
  id?: number;
  uri: string;
  taken_at: string;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  note?: string | null;
  media_asset_id?: string | null;
};

export async function getRecentGeoPhotos(limit = 50): Promise<GeoPhotoRow[]> {
  const rows = await db.getAllAsync<GeoPhotoRow>(
    `SELECT * FROM geo_photos 
     ORDER BY datetime(taken_at) DESC 
     LIMIT ?;`,
    [limit]
  );
  return rows;
}

export async function insertGeoPhoto(entry: GeoPhotoRow): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO geo_photos 
      (uri, taken_at, latitude, longitude, city, region, country, note, media_asset_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      entry.uri,
      entry.taken_at,
      entry.latitude ?? null,
      entry.longitude ?? null,
      entry.city ?? null,
      entry.region ?? null,
      entry.country ?? null,
      entry.note ?? null,
      entry.media_asset_id ?? null,   // 👈 store it
    ]
  );

  return result.lastInsertRowId as number;
}

export async function updateGeoPhotoNote(
  id: number,
  note: string
): Promise<void> {
  await db.runAsync(`UPDATE geo_photos SET note = ? WHERE id = ?;`, [note, id]);
  emit("geoPhoto:updated", { id, note });
}

export async function listGeoPhotos(): Promise<GeoPhotoRow[]> {
  const rows = await db.getAllAsync<GeoPhotoRow>(
    `SELECT * FROM geo_photos ORDER BY datetime(taken_at) DESC;`
  );
  return rows;
}

export async function deleteGeoPhotoAndFile(row: GeoPhotoRow) {
  if (!row.id) {
    console.warn("deleteGeoPhotoAndFile called without id", row);
    return;
  }

  // 1) delete DB row first
  await db.runAsync("DELETE FROM geo_photos WHERE id = ?", [row.id]);

  // 2) try to delete the media asset AND the original file
  await deletePhysicalFile(row.uri, row.media_asset_id ?? null);

  // 3) tell the UI
  emit("geoPhoto:deleted", { id: row.id });
}

async function deletePhysicalFile(uri: string, mediaAssetId: string | null) {
  // A) try to delete media-library asset (the one in "geoPhoto - ...")
  if (mediaAssetId) {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === "granted") {
        await MediaLibrary.deleteAssetsAsync([mediaAssetId]);
      } else {
        console.warn("MediaLibrary permission not granted; cannot delete asset", mediaAssetId);
      }
    } catch (err) {
      console.warn("MediaLibrary delete failed:", err);
    }
  }

  // B) separately, try to delete the original file:// the camera produced
  if (uri?.startsWith("file://")) {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (err) {
      console.warn("FileSystem delete failed:", err);
    }
  }
}