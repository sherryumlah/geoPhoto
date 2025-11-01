import { File } from "expo-file-system";
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
      (uri, taken_at, latitude, longitude, city, region, country, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      entry.uri,
      entry.taken_at,
      entry.latitude ?? null,
      entry.longitude ?? null,
      entry.city ?? null,
      entry.region ?? null,
      entry.country ?? null,
      entry.note ?? null,
    ]
  );

  // new API returns { lastInsertRowId, changes }
  return result.lastInsertRowId as number;
}

export async function updateGeoPhotoNote(id: number, note: string): Promise<void> {
  await db.runAsync(`UPDATE geo_photos SET note = ? WHERE id = ?;`, [note, id]);
}

export async function listGeoPhotos(): Promise<GeoPhotoRow[]> {
  const rows = await db.getAllAsync<GeoPhotoRow>(
    `SELECT * FROM geo_photos ORDER BY datetime(taken_at) DESC;`
  );
  return rows;
}

export async function deleteGeoPhotoAndFile(row: GeoPhotoRow) {
  // Remove the DB record
  await db.runAsync("DELETE FROM geo_photos WHERE id = ?", [row.id]);

  // Delete the local file, if applicable
  if (row.uri && row.uri.startsWith("file://")) {
    try {
      const file = File.fromURI(row.uri);
      await file.deleteAsync({ idempotent: true });
    } catch (e) {
      console.warn("Failed to delete file", e);
    }
  }

  // Emit an event so the gallery reloads
  emit("geoPhoto:deleted", { id: row.id });
}