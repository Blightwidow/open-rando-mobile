import { File } from "expo-file-system";
import { buildImportedRoute, parseGpx, type ImportedGpxRoute } from "@/lib/gpx";

function fileNameWithoutExtension(uri: string): string {
  const decoded = decodeURIComponent(uri.split("?")[0]);
  const lastSegment = decoded.split("/").pop() ?? "";
  return lastSegment.replace(/\.gpx$/i, "") || "GPX";
}

/** Reads a GPX file (file:// or content:// URI) and converts it to an importable route. */
export async function readGpxRoute(uri: string): Promise<ImportedGpxRoute> {
  const content = await new File(uri).text();
  const parsed = parseGpx(content);
  return buildImportedRoute(
    parsed,
    fileNameWithoutExtension(uri),
    new Date().toISOString(),
  );
}
