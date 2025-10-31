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

export function insertGeoPhoto(entry: GeoPhotoRow): Promise<number> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
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
        ],
        (_tx, result) => {
          resolve(result.insertId as number);
        },
        (_tx, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

export function updateGeoPhotoNote(id: number, note: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `UPDATE geo_photos SET note = ? WHERE id = ?;`,
        [note, id],
        () => resolve(),
        (_tx, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}

export function listGeoPhotos(): Promise<GeoPhotoRow[]> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM geo_photos ORDER BY datetime(taken_at) DESC;`,
        [],
        (_tx, { rows }) => {
          resolve(rows._array as GeoPhotoRow[]);
        },
        (_tx, err) => {
          reject(err);
          return false;
        }
      );
    });
  });
}