import Constants from "expo-constants";

interface BuildInfoInputs {
  version: string | undefined;
  versionCode: number | undefined;
  commitSha: string | undefined;
}

export function describeBuild({
  version,
  versionCode,
  commitSha,
}: BuildInfoInputs): string {
  const versionLabel = version ?? "unknown";
  const codeLabel = versionCode === undefined ? "" : ` (code ${versionCode})`;
  // CI stamps the commit; a local build has none
  const commitLabel = commitSha ? commitSha.slice(0, 7) : "local";
  return `version ${versionLabel}${codeLabel}, commit ${commitLabel}`;
}

export function getBuildDescription(): string {
  return describeBuild({
    version: Constants.expoConfig?.version,
    versionCode: Constants.expoConfig?.android?.versionCode,
    commitSha: process.env.EXPO_PUBLIC_BUILD_SHA,
  });
}
