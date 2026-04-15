const WEB_HOST = "rando.dammaretz.fr";
const APP_SCHEME = "trainrando:";

interface ParsedSection {
  slug: string;
  fromKm?: number;
  toKm?: number;
}

export function extractSlugAndSection(data: string): ParsedSection | null {
  const trimmed = data.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const isAppLink = url.protocol === APP_SCHEME;
    const isWebLink =
      (url.protocol === "https:" || url.protocol === "http:") &&
      url.hostname === WEB_HOST;

    if (!isAppLink && !isWebLink) return null;

    // Custom scheme: trainrando://route/gr-137 → hostname="route", pathname="/gr-137"
    // Web URL: https://rando.dammaretz.fr/routes/gr-137 → pathname="/routes/gr-137"
    let slug: string | null = null;
    if (isAppLink) {
      const pathSegments = url.pathname.split("/").filter(Boolean);
      slug = pathSegments.length >= 1 ? pathSegments[pathSegments.length - 1] : null;
    } else {
      const pathSegments = url.pathname.split("/").filter(Boolean);
      slug = pathSegments.length >= 2 ? pathSegments[pathSegments.length - 1] : null;
    }
    if (!slug) return null;

    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    const fromKm = fromParam !== null ? parseFloat(fromParam) : undefined;
    const toKm = toParam !== null ? parseFloat(toParam) : undefined;

    if (fromKm !== undefined && isNaN(fromKm)) return null;
    if (toKm !== undefined && isNaN(toKm)) return null;

    return { slug, fromKm, toKm };
  } catch {
    // Not a URL — try bare slug
    if (/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(trimmed)) {
      return { slug: trimmed };
    }
    return null;
  }
}

export function buildSectionId(
  routeId: string,
  fromKm: number,
  toKm: number,
): string {
  return `${routeId}:${fromKm.toFixed(2)}:${toKm.toFixed(2)}`;
}
