import { describe, expect, it } from "vitest";
import { squareKey, squaresForBoundingBox } from "@/lib/poi-grid";
import type { PoiGridDefinition } from "@/lib/types";

const GRID: PoiGridDefinition = { bbox: [-5.5, 41.0, 10.0, 51.5], cols: 12, rows: 8 };

describe("squaresForBoundingBox", () => {
  it("returns the single square containing a point-sized bbox", () => {
    // lonStep = 15.5 / 12, latStep = 10.5 / 8
    expect(squaresForBoundingBox(GRID, [2.5, 48.5, 2.5, 48.5], 0)).toEqual([[6, 5]]);
  });

  it("includes neighbours when the margin crosses a square boundary", () => {
    // 2.2 sits 0.05° west of the column 6 boundary at -5.5 + 6 * 15.5 / 12 = 2.25
    const withoutMargin = squaresForBoundingBox(GRID, [2.2, 48.5, 2.2, 48.5], 0);
    const withMargin = squaresForBoundingBox(GRID, [2.2, 48.5, 2.2, 48.5], 0.07);
    expect(withoutMargin).toEqual([[5, 5]]);
    expect(withMargin).toEqual([
      [5, 5],
      [6, 5],
    ]);
  });

  it("covers every square of a wide bbox, row by row", () => {
    const squares = squaresForBoundingBox(GRID, [2.3, 48.0, 3.6, 49.2], 0);
    expect(squares).toEqual([
      [6, 5],
      [7, 5],
      [6, 6],
      [7, 6],
    ]);
  });

  it("clamps a bbox that overflows the grid", () => {
    const squares = squaresForBoundingBox(GRID, [-20, 30, 30, 60], 0);
    expect(squares).toHaveLength(GRID.cols * GRID.rows);
  });

  it("returns nothing for a bbox entirely outside the grid", () => {
    expect(squaresForBoundingBox(GRID, [20, 60, 21, 61], 0)).toEqual([]);
  });

  it("puts a point on the outer edge in the last square", () => {
    expect(squaresForBoundingBox(GRID, [10, 51.5, 10, 51.5], 0)).toEqual([[11, 7]]);
  });
});

describe("squareKey", () => {
  it("joins column and row with an underscore", () => {
    expect(squareKey([6, 5])).toBe("6_5");
  });
});
