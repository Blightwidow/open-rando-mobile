import { describe, expect, it } from "vitest";
import { bboxCenter } from "@/lib/geo";

describe("bboxCenter", () => {
  it("computes center of a bounding box", () => {
    expect(bboxCenter([0, 0, 4, 4])).toEqual([2, 2]);
  });

  it("handles negative coordinates", () => {
    expect(bboxCenter([-10, -20, 10, 20])).toEqual([0, 0]);
  });

  it("handles real-world France coordinates", () => {
    const [longitude, latitude] = bboxCenter([2.0, 48.0, 3.0, 49.0]);
    expect(longitude).toBeCloseTo(2.5);
    expect(latitude).toBeCloseTo(48.5);
  });
});
