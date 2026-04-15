import { Paths, File } from "expo-file-system";
import { shareAsync } from "expo-sharing";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  tag: string;
  message: string;
}

const MAX_ENTRIES = 500;
const buffer: LogEntry[] = [];

function log(level: LogLevel, tag: string, message: string): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    tag,
    message,
  };

  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) {
    buffer.shift();
  }

  const formatted = `[${entry.timestamp}] [${level.toUpperCase()}] [${tag}] ${message}`;
  switch (level) {
    case "debug":
      console.debug(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

export function logDebug(tag: string, message: string): void {
  log("debug", tag, message);
}

export function logInfo(tag: string, message: string): void {
  log("info", tag, message);
}

export function logWarn(tag: string, message: string): void {
  log("warn", tag, message);
}

export function logError(tag: string, message: string): void {
  log("error", tag, message);
}

export function getLogEntries(): readonly LogEntry[] {
  return [...buffer];
}

export function clearLog(): void {
  buffer.length = 0;
}

function exportLogToString(): string {
  if (buffer.length === 0) return "No log entries.";

  return buffer
    .map(
      (entry) =>
        `[${entry.timestamp}] [${entry.level.toUpperCase().padEnd(5)}] [${entry.tag}] ${entry.message}`,
    )
    .join("\n");
}

export async function shareLog(): Promise<void> {
  const logFile = new File(Paths.cache, "debug-log.txt");
  if (!logFile.exists) {
    logFile.create();
  }
  logFile.write(exportLogToString());
  await shareAsync(logFile.uri, {
    mimeType: "text/plain",
    dialogTitle: "Export Debug Log",
  });
}
