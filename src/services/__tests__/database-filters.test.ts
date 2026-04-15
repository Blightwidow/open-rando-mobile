import { describe, expect, it, vi } from "vitest";
import { buildFilterQuery } from "@/services/database";

vi.mock("expo-sqlite", () => ({
  openDatabaseAsync: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logDebug: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

describe("buildFilterQuery", () => {
  it("returns no WHERE clause when no filters active", () => {
    const { sql, params } = buildFilterQuery({ regions: [] });
    expect(sql).toBe("SELECT data FROM routes ORDER BY path_ref, distance_km");
    expect(params).toEqual([]);
  });

  it("filters by single region", () => {
    const { sql, params } = buildFilterQuery({ regions: ["Bretagne"] });
    expect(sql).toContain("WHERE region IN (?)");
    expect(params).toEqual(["Bretagne"]);
  });

  it("filters by multiple regions", () => {
    const { sql, params } = buildFilterQuery({ regions: ["Bretagne", "Provence"] });
    expect(sql).toContain("WHERE region IN (?, ?)");
    expect(params).toEqual(["Bretagne", "Provence"]);
  });

  it("always includes ORDER BY", () => {
    const { sql } = buildFilterQuery({ regions: ["Bretagne"] });
    expect(sql).toContain("ORDER BY path_ref, distance_km");
  });
});
