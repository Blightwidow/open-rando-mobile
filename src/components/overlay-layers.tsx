import { useMemo } from "react";
import MapLibreGL from "@maplibre/maplibre-react-native";
import type { MapStyle } from "@/lib/map-style";
import {
  OVERLAY_SOURCE_ID,
  getOverlayGroups,
  toCamelCaseKeys,
  type OverlayGroupKey,
  type OverlayLayerSpec,
} from "@/lib/overlay";
import { useOverlayStore } from "@/stores/overlay-store";
import { getOverlaySourceUrl } from "@/services/overlay-offline";
import { overlayIconImages } from "./overlay-icon-assets";

function OverlayLayer({ spec, visible }: { spec: OverlayLayerSpec; visible: boolean }) {
  const style = {
    ...toCamelCaseKeys(spec.layout ?? {}),
    ...toCamelCaseKeys(spec.paint ?? {}),
    visibility: visible ? "visible" : "none",
  } as never;
  const common = {
    id: spec.id,
    sourceLayerID: spec.sourceLayer,
    minZoomLevel: spec.minzoom,
    filter: spec.filter as never,
    style,
  };
  if (spec.type === "circle") return <MapLibreGL.CircleLayer {...common} />;
  if (spec.type === "line") return <MapLibreGL.LineLayer {...common} />;
  return <MapLibreGL.SymbolLayer {...common} />;
}

interface OverlayLayersProps {
  theme: MapStyle;
}

/**
 * The hiking overlay as children of the map view. Add it before the trail layers so they draw on
 * top. Hidden groups keep their layers with `visibility: none`, so a toggle is a style change and
 * never reloads the map style.
 */
export function OverlayLayers({ theme }: OverlayLayersProps) {
  const enabled = useOverlayStore((state) => state.enabled);
  const visibleGroups = useOverlayStore((state) => state.visibleGroups);
  // Read again when the offline file is downloaded or removed.
  const offlineRevision = useOverlayStore((state) => state.offlineRevision);
  const groups = useMemo(() => getOverlayGroups(theme), [theme]);
  const sourceUrl = useMemo(
    () => getOverlaySourceUrl(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [offlineRevision],
  );
  const visibleSet = useMemo(
    () => new Set<OverlayGroupKey>(visibleGroups ?? []),
    [visibleGroups],
  );

  if (!enabled) return null;

  return (
    <>
      <MapLibreGL.Images images={overlayIconImages(theme)} />
      <MapLibreGL.VectorSource id={OVERLAY_SOURCE_ID} url={sourceUrl}>
        {groups.flatMap((group) =>
          group.layers.map((spec) => (
            <OverlayLayer key={spec.id} spec={spec} visible={visibleSet.has(group.key)} />
          )),
        )}
      </MapLibreGL.VectorSource>
    </>
  );
}
