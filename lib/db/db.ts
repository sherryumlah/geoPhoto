import * as SQLite from "expo-sqlite";

// use sync if available (newer Expo), otherwise fallback
export const db = (SQLite as any).openDatabaseSync
  ? (SQLite as any).openDatabaseSync("geophoto.db")
  : SQLite.openDatabase("geophoto.db");
