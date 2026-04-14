import { describe, expect, it, beforeEach } from "vitest";
import { useFilterStore } from "@/stores/filter-store";

describe("filter-store", () => {
  beforeEach(() => {
    useFilterStore.getState().clearAll();
  });

  it("starts with empty filters", () => {
    const state = useFilterStore.getState();
    expect(state.regions).toEqual([]);
    expect(state.terrains).toEqual([]);
    expect(state.activeFilterCount()).toBe(0);
  });

  it("toggles a region on", () => {
    useFilterStore.getState().toggleRegion("Bretagne");
    expect(useFilterStore.getState().regions).toEqual(["Bretagne"]);
    expect(useFilterStore.getState().activeFilterCount()).toBe(1);
  });

  it("toggles a region off", () => {
    useFilterStore.getState().toggleRegion("Bretagne");
    useFilterStore.getState().toggleRegion("Bretagne");
    expect(useFilterStore.getState().regions).toEqual([]);
  });

  it("toggles multiple regions", () => {
    useFilterStore.getState().toggleRegion("Bretagne");
    useFilterStore.getState().toggleRegion("Provence");
    expect(useFilterStore.getState().regions).toEqual(["Bretagne", "Provence"]);
    expect(useFilterStore.getState().activeFilterCount()).toBe(2);
  });

  it("toggles a terrain on", () => {
    useFilterStore.getState().toggleTerrain("mountain");
    expect(useFilterStore.getState().terrains).toEqual(["mountain"]);
  });

  it("toggles a terrain off", () => {
    useFilterStore.getState().toggleTerrain("mountain");
    useFilterStore.getState().toggleTerrain("mountain");
    expect(useFilterStore.getState().terrains).toEqual([]);
  });

  it("counts regions and terrains together", () => {
    useFilterStore.getState().toggleRegion("Bretagne");
    useFilterStore.getState().toggleTerrain("coastal");
    useFilterStore.getState().toggleTerrain("forest");
    expect(useFilterStore.getState().activeFilterCount()).toBe(3);
  });

  it("clearAll resets all filters", () => {
    useFilterStore.getState().toggleRegion("Bretagne");
    useFilterStore.getState().toggleTerrain("mountain");
    useFilterStore.getState().clearAll();
    expect(useFilterStore.getState().regions).toEqual([]);
    expect(useFilterStore.getState().terrains).toEqual([]);
    expect(useFilterStore.getState().activeFilterCount()).toBe(0);
  });

  it("setRegions replaces all regions", () => {
    useFilterStore.getState().toggleRegion("Bretagne");
    useFilterStore.getState().setRegions(["Provence", "Corse"]);
    expect(useFilterStore.getState().regions).toEqual(["Provence", "Corse"]);
  });

  it("setTerrains replaces all terrains", () => {
    useFilterStore.getState().toggleTerrain("mountain");
    useFilterStore.getState().setTerrains(["coastal", "plains"]);
    expect(useFilterStore.getState().terrains).toEqual(["coastal", "plains"]);
  });
});
