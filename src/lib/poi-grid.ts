import type { PoiGridDefinition } from "@/lib/types";

/** [column, row] of one square of the POI grid. */
export type PoiSquare = [number, number];

/** Same margin as the backend's candidate zone (processors/link.py CANDIDATE_BUFFER_DEGREES). */
export const POI_SQUARE_MARGIN_DEGREES = 0.07;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function squareKey([column, row]: PoiSquare): string {
  return `${column}_${row}`;
}

/** Squares intersecting bbox ([lonMin, latMin, lonMax, latMax]) widened by a margin. */
export function squaresForBoundingBox(
  grid: PoiGridDefinition,
  bbox: [number, number, number, number],
  marginDegrees = POI_SQUARE_MARGIN_DEGREES,
): PoiSquare[] {
  const [gridLonMin, gridLatMin, gridLonMax, gridLatMax] = grid.bbox;
  const lonMin = Math.max(bbox[0] - marginDegrees, gridLonMin);
  const latMin = Math.max(bbox[1] - marginDegrees, gridLatMin);
  const lonMax = Math.min(bbox[2] + marginDegrees, gridLonMax);
  const latMax = Math.min(bbox[3] + marginDegrees, gridLatMax);
  if (lonMin > lonMax || latMin > latMax) return [];

  const lonStep = (gridLonMax - gridLonMin) / grid.cols;
  const latStep = (gridLatMax - gridLatMin) / grid.rows;
  // Clamp both ends: a point on the outer edge belongs to the last square
  const firstColumn = clamp(
    Math.floor((lonMin - gridLonMin) / lonStep),
    0,
    grid.cols - 1,
  );
  const lastColumn = Math.min(Math.floor((lonMax - gridLonMin) / lonStep), grid.cols - 1);
  const firstRow = clamp(Math.floor((latMin - gridLatMin) / latStep), 0, grid.rows - 1);
  const lastRow = Math.min(Math.floor((latMax - gridLatMin) / latStep), grid.rows - 1);

  const squares: PoiSquare[] = [];
  for (let row = firstRow; row <= lastRow; row += 1) {
    for (let column = firstColumn; column <= lastColumn; column += 1) {
      squares.push([column, row]);
    }
  }
  return squares;
}
