import { db } from "./db";

export async function initDb() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS geo_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uri TEXT NOT NULL,
      taken_at TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      city TEXT,
      region TEXT,
      country TEXT,
      note TEXT,
      media_asset_id TEXT
    );
  `);

  try {
    await db.execAsync(`ALTER TABLE geo_photos ADD COLUMN media_asset_id TEXT;`);
  } catch (e) {
    // ignore "duplicate column" errors
  }
}
