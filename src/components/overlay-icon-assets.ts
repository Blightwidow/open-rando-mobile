import type { ImageSourcePropType } from "react-native";
import type { MapStyle } from "@/lib/map-style";
import { overlayIconImageId, type OverlayIconName } from "@/lib/overlay";

// Static requires: Metro resolves them at build time. Files are 48 px with an @2x suffix,
// so they draw at 24 px, as on the web. Rendered from the web project's `overlay-icons.ts`.
const ICON_SOURCES: Record<MapStyle, Record<OverlayIconName, ImageSourcePropType>> = {
  light: {
    peak: require("../../assets/overlay/peak-light@2x.png"),
    pass: require("../../assets/overlay/pass-light@2x.png"),
    hut: require("../../assets/overlay/hut-light@2x.png"),
    shelter: require("../../assets/overlay/shelter-light@2x.png"),
    water: require("../../assets/overlay/water-light@2x.png"),
    spring: require("../../assets/overlay/spring-light@2x.png"),
    viewpoint: require("../../assets/overlay/viewpoint-light@2x.png"),
    waterfall: require("../../assets/overlay/waterfall-light@2x.png"),
    cave: require("../../assets/overlay/cave-light@2x.png"),
    ford: require("../../assets/overlay/ford-light@2x.png"),
    toilets: require("../../assets/overlay/toilets-light@2x.png"),
    church: require("../../assets/overlay/church-light@2x.png"),
    cemetery: require("../../assets/overlay/cemetery-light@2x.png"),
    guidepost: require("../../assets/overlay/guidepost-light@2x.png"),
  },
  dark: {
    peak: require("../../assets/overlay/peak-dark@2x.png"),
    pass: require("../../assets/overlay/pass-dark@2x.png"),
    hut: require("../../assets/overlay/hut-dark@2x.png"),
    shelter: require("../../assets/overlay/shelter-dark@2x.png"),
    water: require("../../assets/overlay/water-dark@2x.png"),
    spring: require("../../assets/overlay/spring-dark@2x.png"),
    viewpoint: require("../../assets/overlay/viewpoint-dark@2x.png"),
    waterfall: require("../../assets/overlay/waterfall-dark@2x.png"),
    cave: require("../../assets/overlay/cave-dark@2x.png"),
    ford: require("../../assets/overlay/ford-dark@2x.png"),
    toilets: require("../../assets/overlay/toilets-dark@2x.png"),
    church: require("../../assets/overlay/church-dark@2x.png"),
    cemetery: require("../../assets/overlay/cemetery-dark@2x.png"),
    guidepost: require("../../assets/overlay/guidepost-dark@2x.png"),
  },
};

export function overlayIconSource(
  theme: MapStyle,
  name: OverlayIconName,
): ImageSourcePropType {
  return ICON_SOURCES[theme][name];
}

/** Every icon of a theme keyed by the image id the layers use, for `MapLibreGL.Images`. */
export function overlayIconImages(theme: MapStyle): Record<string, ImageSourcePropType> {
  const images: Record<string, ImageSourcePropType> = {};
  for (const name of Object.keys(ICON_SOURCES[theme]) as OverlayIconName[]) {
    images[overlayIconImageId(name)] = ICON_SOURCES[theme][name];
  }
  return images;
}
