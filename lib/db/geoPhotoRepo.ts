import { db } from "./db";

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
