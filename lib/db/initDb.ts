import { db } from "./db";

export function initDb() {
  db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS geo_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uri TEXT NOT NULL,
        taken_at TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        city TEXT,
        region TEXT,
        country TEXT,
        note TEXT
      );`
    );
  });
}