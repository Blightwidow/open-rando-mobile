import * as SQLite from "expo-sqlite";
import type { Hike } from "@/lib/types";

let database: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) return database;
  database = await SQLite.openDatabaseAsync("openrando.db");
  await initializeDatabase(database);
  return database;
}

async function initializeDatabase(
  database: SQLite.SQLiteDatabase,
): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hikes (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      data TEXT NOT NULL,
      difficulty TEXT,
      distance_km REAL,
      estimated_duration_min INTEGER,
      elevation_gain_m INTEGER,
      region TEXT,
      departement TEXT,
      step_count INTEGER,
      path_ref TEXT,
      last_updated TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_hikes_difficulty ON hikes(difficulty);
    CREATE INDEX IF NOT EXISTS idx_hikes_region ON hikes(region);
    CREATE INDEX IF NOT EXISTS idx_hikes_distance ON hikes(distance_km);
  `);
}

export async function getMetadataValue(key: string): Promise<string | null> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM metadata WHERE key = ?",
    [key],
  );
  return result?.value ?? null;
}

export async function setMetadataValue(
  key: string,
  value: string,
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
    [key, value],
  );
}

export async function upsertHikes(hikes: Hike[]): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    for (const hike of hikes) {
      await database.runAsync(
        `INSERT OR REPLACE INTO hikes (
          id, slug, data, difficulty, distance_km,
          estimated_duration_min, elevation_gain_m, region,
          departement, step_count, path_ref, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          hike.id,
          hike.slug,
          JSON.stringify(hike),
          hike.difficulty,
          hike.distance_km,
          hike.estimated_duration_min,
          hike.elevation_gain_m,
          hike.region,
          hike.departement,
          hike.step_count,
          hike.path_ref,
          hike.last_updated,
        ],
      );
    }
  });
}

export async function getAllHikes(): Promise<Hike[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ data: string }>(
    "SELECT data FROM hikes ORDER BY path_ref, distance_km",
  );
  return rows.map((row) => JSON.parse(row.data) as Hike);
}

export async function getHikeBySlug(slug: string): Promise<Hike | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ data: string }>(
    "SELECT data FROM hikes WHERE slug = ?",
    [slug],
  );
  return row ? (JSON.parse(row.data) as Hike) : null;
}

export async function getHikeById(hikeId: string): Promise<Hike | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ data: string }>(
    "SELECT data FROM hikes WHERE id = ?",
    [hikeId],
  );
  return row ? (JSON.parse(row.data) as Hike) : null;
}

export async function getHikeCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM hikes",
  );
  return result?.count ?? 0;
}
