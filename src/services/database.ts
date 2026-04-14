import * as SQLite from "expo-sqlite";
import type { Route } from "@/lib/types";

let database: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) return database;
  database = await SQLite.openDatabaseAsync("openrando.db");
  await initializeDatabase(database);
  return database;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    DROP TABLE IF EXISTS hikes;

    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      data TEXT NOT NULL,
      difficulty TEXT,
      distance_km REAL,
      elevation_gain_m INTEGER,
      region TEXT,
      departement TEXT,
      path_ref TEXT,
      last_updated TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_routes_difficulty ON routes(difficulty);
    CREATE INDEX IF NOT EXISTS idx_routes_region ON routes(region);
    CREATE INDEX IF NOT EXISTS idx_routes_distance ON routes(distance_km);
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

export async function setMetadataValue(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync("INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)", [
    key,
    value,
  ]);
}

export async function upsertRoutes(routes: Route[]): Promise<void> {
  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    for (const route of routes) {
      await database.runAsync(
        `INSERT OR REPLACE INTO routes (
          id, slug, data, difficulty, distance_km,
          elevation_gain_m, region, departement, path_ref, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          route.id,
          route.slug,
          JSON.stringify(route),
          route.difficulty,
          route.distance_km,
          route.elevation_gain_m,
          route.region,
          route.departement,
          route.path_ref,
          route.last_updated,
        ],
      );
    }
  });
}

export async function getAllRoutes(): Promise<Route[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ data: string }>(
    "SELECT data FROM routes ORDER BY path_ref, distance_km",
  );
  return rows.map((row) => JSON.parse(row.data) as Route);
}

export async function getRouteBySlug(slug: string): Promise<Route | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ data: string }>(
    "SELECT data FROM routes WHERE slug = ?",
    [slug],
  );
  return row ? (JSON.parse(row.data) as Route) : null;
}

export async function getRouteById(routeId: string): Promise<Route | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ data: string }>(
    "SELECT data FROM routes WHERE id = ?",
    [routeId],
  );
  return row ? (JSON.parse(row.data) as Route) : null;
}

export async function getRouteCount(): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM routes",
  );
  return result?.count ?? 0;
}

export interface FilterParams {
  regions: string[];
}

export function buildFilterQuery(filters: FilterParams): {
  sql: string;
  params: (string | number)[];
} {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.regions.length > 0) {
    const placeholders = filters.regions.map(() => "?").join(", ");
    conditions.push(`region IN (${placeholders})`);
    params.push(...filters.regions);
  }

  const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  const sql = `SELECT data FROM routes${whereClause} ORDER BY path_ref, distance_km`;

  return { sql, params };
}

export async function getFilteredRoutes(filters: FilterParams): Promise<Route[]> {
  const database = await getDatabase();
  const { sql, params } = buildFilterQuery(filters);
  const rows = await database.getAllAsync<{ data: string }>(sql, params);
  return rows.map((row) => JSON.parse(row.data) as Route);
}

export async function getDistinctRegions(): Promise<string[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ region: string }>(
    "SELECT DISTINCT region FROM routes WHERE region IS NOT NULL ORDER BY region",
  );
  return rows.map((row) => row.region);
}
