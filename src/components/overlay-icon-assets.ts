import type { ImageSourcePropType } from "react-native";
import type { MapStyle } from "@/lib/map-style";
import { overlayIconImageId, type OverlayIconName } from "@/lib/overlay";

// Static requires: Metro resolves them at build time. Files are 48 px with an @2x suffix,
// so they draw at 24 px, as on the web. Rendered from the web project's `overlay-icons.ts`.
const ICON_SOURCES: Record<MapStyle, Record<OverlayIconName, ImageSourcePropType>> = {
  light: {
    peak: require("../../assets/overlay/peak-light.png"),
    pass: require("../../assets/overlay/pass-light.png"),
    hut: require("../../assets/overlay/hut-light.png"),
    shelter: require("../../assets/overlay/shelter-light.png"),
    water: require("../../assets/overlay/water-light.png"),
    spring: require("../../assets/overlay/spring-light.png"),
    viewpoint: require("../../assets/overlay/viewpoint-light.png"),
    waterfall: require("../../assets/overlay/waterfall-light.png"),
    cave: require("../../assets/overlay/cave-light.png"),
    ford: require("../../assets/overlay/ford-light.png"),
    toilets: require("../../assets/overlay/toilets-light.png"),
    church: require("../../assets/overlay/church-light.png"),
    cemetery: require("../../assets/overlay/cemetery-light.png"),
    guidepost: require("../../assets/overlay/guidepost-light.png"),
  },
  dark: {
    peak: require("../../assets/overlay/peak-dark.png"),
    pass: require("../../assets/overlay/pass-dark.png"),
    hut: require("../../assets/overlay/hut-dark.png"),
    shelter: require("../../assets/overlay/shelter-dark.png"),
    water: require("../../assets/overlay/water-dark.png"),
    spring: require("../../assets/overlay/spring-dark.png"),
    viewpoint: require("../../assets/overlay/viewpoint-dark.png"),
    waterfall: require("../../assets/overlay/waterfall-dark.png"),
    cave: require("../../assets/overlay/cave-dark.png"),
    ford: require("../../assets/overlay/ford-dark.png"),
    toilets: require("../../assets/overlay/toilets-dark.png"),
    church: require("../../assets/overlay/church-dark.png"),
    cemetery: require("../../assets/overlay/cemetery-dark.png"),
    guidepost: require("../../assets/overlay/guidepost-dark.png"),
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
