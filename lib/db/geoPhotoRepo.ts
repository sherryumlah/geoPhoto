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

  // Scrub rows whose file is gone from the media library
  const cleaned: GeoPhotoRow[] = [];

  for (const row of rows) {
    if (row.uri?.startsWith("file://")) {
      try {
        const info = await FileSystem.getInfoAsync(row.uri);
        if (!info.exists) {
          // file was deleted outside the app (e.g. by Photos / cloud)
          if (row.id) {
            await db.runAsync("DELETE FROM geo_photos WHERE id = ?", [row.id]);
            emit("geoPhoto:deleted", { id: row.id });
          }
          continue;
        }
      } catch (err) {
        console.warn("Could not stat file for geo photo", row.uri, err);
      }
    }

    cleaned.push(row);
  }

  return cleaned;
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
      entry.media_asset_id ?? null, // 👈 store it
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
    return { ok: false, reason: "no-id" };
  }

  // 1) try to delete media/file FIRST
  const fileResult = await deletePhysicalFile(row);

  // 👇 NEW: if we could NOT delete the actual media/file, DO NOT delete from DB
  if (!fileResult.ok) {
    // we keep the row, so the UI stays truthful
    return fileResult;
  }

  // 2) now it's safe to delete from DB
  await db.runAsync("DELETE FROM geo_photos WHERE id = ?", [row.id]);

  // 3) Emit event for refreshing gallery
  emit("geoPhoto:deleted", { id: row.id });

  return { ok: true };
}

async function deletePhysicalFile(
  row: GeoPhotoRow
): Promise<{ ok: boolean; reason?: string }> {
  const { uri, media_asset_id, country, region, taken_at } = row;

  // Ask for media permission
  const mediaPerm = await MediaLibrary.requestPermissionsAsync();
  const canUseMedia = mediaPerm.granted;

  // we’ll collect asset IDs we want to delete
  const assetIdsToDelete: string[] = [];

  // 1. if we have a stored media_asset_id, try that first
  if (canUseMedia && media_asset_id) {
    assetIdsToDelete.push(media_asset_id);
  }

  // Find the asset in the album we originally created
  if (canUseMedia) {
    const albumName = buildAlbumNameFromRow(country, region, taken_at);
    if (albumName) {
      const album = await MediaLibrary.getAlbumAsync(albumName);
      if (album) {
        // pull a reasonable number; your album per month won’t be huge
        const assetsInAlbum = await MediaLibrary.getAssetsAsync({
          album,
          first: 200, // bump if you need
          mediaType: ["photo"],
        });

        // try to match by uri filename
        const wantedFilename = uri ? uri.split("/").pop() : null;

        const matched = assetsInAlbum.assets.find((a) => {
          // 1) exact uri match (sometimes matches)
          if (a.uri === uri) return true;
          // 2) filename match
          if (wantedFilename && a.filename === wantedFilename) return true;
          return false;
        });

        if (matched && !assetIdsToDelete.includes(matched.id)) {
          assetIdsToDelete.push(matched.id);
        }
      }
    }
  }

  // Delete the media assets we found
  if (!canUseMedia && (media_asset_id || uri)) {
    console.warn(
      "MediaLibrary permission not granted; cannot delete from Photos. " +
        "Go to Android Settings → Apps → your app → Photos & videos → Allow all."
    );
    return { ok: false, reason: "permission-denied" };
  }

  if (canUseMedia && assetIdsToDelete.length > 0) {
    try {
      await MediaLibrary.deleteAssetsAsync(assetIdsToDelete);
    } catch (err: any) {
      console.warn("MediaLibrary delete failed:", err);

      // 👇 try to detect the specific "user didn't grant write permission" case
      const message = typeof err?.message === "string" ? err.message : "";
      if (
        message.includes("didn't grant write permission") ||
        message.includes("User didn't grant write permission")
      ) {
        return { ok: false, reason: "permission-denied" };
      }

      // generic media delete failure
      return { ok: false, reason: "media-delete-failed" };
    }
  }

  // Always try to delete the original file:// too
  if (uri?.startsWith("file://")) {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (err) {
      console.warn("FileSystem delete failed:", err);
      // we won't fail the whole thing for this
    }
  }

  return { ok: true };
}

// helper to rebuild the album name exactly the way you created it in the camera
function buildAlbumNameFromRow(
  country?: string | null,
  region?: string | null,
  taken_at?: string | null
): string | null {
  const c = country && country.trim().length ? country : "Unknown Country";
  const r = region && region.trim().length ? region : "Unknown Region";

  if (!taken_at) {
    return `geoPhoto - ${c} - ${r}`; // fallback
  }

  const d = new Date(taken_at);
  if (Number.isNaN(d.getTime())) {
    return `geoPhoto - ${c} - ${r}`;
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `geoPhoto - ${c} - ${r} - ${year}-${month}`;
}
