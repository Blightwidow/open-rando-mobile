import { describe, expect, it, vi } from "vitest";
import { describeBuild } from "@/lib/build-info";

vi.mock("expo-constants", () => ({ default: { expoConfig: {} } }));

describe("describeBuild", () => {
  it("shortens the commit sha to seven characters", () => {
    expect(
      describeBuild({
        version: "1.0.0",
        versionCode: 3,
        commitSha: "39d1211abcdef0123456789",
      }),
    ).toBe("version 1.0.0 (code 3), commit 39d1211");
  });

  it("reports a local build when no commit was stamped", () => {
    expect(
      describeBuild({ version: "1.0.0", versionCode: undefined, commitSha: undefined }),
    ).toBe("version 1.0.0, commit local");
  });

  it("treats an empty commit as a local build", () => {
    expect(describeBuild({ version: "1.0.0", versionCode: 1, commitSha: "" })).toContain(
      "commit local",
    );
  });

  it("falls back when the version is unknown", () => {
    expect(
      describeBuild({ version: undefined, versionCode: undefined, commitSha: undefined }),
    ).toBe("version unknown, commit local");
  });
});
