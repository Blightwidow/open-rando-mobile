import { logInfo } from "@/lib/logger";

const GPX_PATH_PATTERN = /\.gpx(\?.*)?$/i;

/**
 * Routes GPX files opened from other apps (Files, mail, "Open with") to the import screen.
 * Anything else falls through to Expo Router's default handling.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  logInfo("native-intent", `incoming path: ${path}`);
  const isFileUri = path.startsWith("file://") || path.startsWith("content://");
  if (isFileUri && (GPX_PATH_PATTERN.test(path) || path.startsWith("content://"))) {
    return `/saved/import?uri=${encodeURIComponent(path)}`;
  }
  return path;
}
