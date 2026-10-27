import { File } from "expo-file-system";
import { readAsStringAsync } from "expo-file-system/legacy";
import { logInfo, logWarn } from "@/lib/logger";
import { buildImportedRoute, parseGpx, type ImportedGpxRoute } from "@/lib/gpx";

function fileNameWithoutExtension(uri: string): string {
  const decoded = decodeURIComponent(uri.split("?")[0]);
  const lastSegment = decoded.split("/").pop() ?? "";
  return lastSegment.replace(/\.gpx$/i, "") || "GPX";
}

async function readUriText(uri: string): Promise<string> {
  try {
    return await new File(uri).text();
  } catch (error) {
    // Some content:// providers (e.g. Slack's) are only readable through the legacy API
    logWarn("gpx-import", `File.text failed (${String(error)}), trying legacy read`);
    return readAsStringAsync(uri);
  }
}

/** Reads a GPX file (file:// or content:// URI) and converts it to an importable route. */
export async function readGpxRoute(uri: string): Promise<ImportedGpxRoute> {
  logInfo("gpx-import", `reading ${uri}`);
  const content = await readUriText(uri);
  logInfo("gpx-import", `read ${content.length} chars`);
  const parsed = parseGpx(content);
  return buildImportedRoute(
    parsed,
    fileNameWithoutExtension(uri),
    new Date().toISOString(),
  );
}
