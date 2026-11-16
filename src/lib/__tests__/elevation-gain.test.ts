import { describe, expect, it } from "vitest";
import { computeGainLoss } from "@/lib/elevation-gain";

describe("computeGainLoss", () => {
  it("counts a steady climb in full", () => {
    expect(computeGainLoss([0, 10, 20, 30])).toEqual({ gain: 30, loss: 0 });
  });

  it("counts a climb then a descent", () => {
    expect(computeGainLoss([0, 20, 40, 10])).toEqual({ gain: 40, loss: 30 });
  });

  it("ignores oscillation below the noise threshold", () => {
    expect(computeGainLoss([100, 102, 100, 102, 100])).toEqual({ gain: 0, loss: 0 });
  });

  it("returns zero for fewer than two samples", () => {
    expect(computeGainLoss([100])).toEqual({ gain: 0, loss: 0 });
  });
});
