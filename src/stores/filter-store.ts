import { create } from "zustand";
import type { Terrain } from "@/lib/types";

interface FilterState {
  regions: string[];
  terrains: Terrain[];
  setRegions: (regions: string[]) => void;
  setTerrains: (terrains: Terrain[]) => void;
  toggleRegion: (region: string) => void;
  toggleTerrain: (terrain: Terrain) => void;
  clearAll: () => void;
  activeFilterCount: () => number;
}

export const useFilterStore = create<FilterState>()((set, get) => ({
  regions: [],
  terrains: [],
  setRegions: (regions: string[]) => set({ regions }),
  setTerrains: (terrains: Terrain[]) => set({ terrains }),
  toggleRegion: (region: string) => {
    const current = get().regions;
    if (current.includes(region)) {
      set({ regions: current.filter((item) => item !== region) });
    } else {
      set({ regions: [...current, region] });
    }
  },
  toggleTerrain: (terrain: Terrain) => {
    const current = get().terrains;
    if (current.includes(terrain)) {
      set({ terrains: current.filter((item) => item !== terrain) });
    } else {
      set({ terrains: [...current, terrain] });
    }
  },
  clearAll: () => set({ regions: [], terrains: [] }),
  activeFilterCount: () => {
    const state = get();
    return state.regions.length + state.terrains.length;
  },
}));
