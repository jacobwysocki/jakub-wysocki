import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { ASK_JAKUB_QUESTION_LIMIT } from "@/features/ask-jakub";

const SOURCE_ROOTS = ["app", "components", "data", "features", "lib"];

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
    }),
  );
  return nested.flat();
}

function isTestFile(path: string) {
  return /\.(?:test|spec)\.[jt]sx?$/.test(path);
}

describe("Ask Jakub public client boundary", () => {
  it("keeps the deterministic testing adapter out of production source", async () => {
    const files = (
      await Promise.all(SOURCE_ROOTS.map((root) => sourceFiles(root)))
    ).flat();
    const offenders: string[] = [];

    for (const file of files) {
      const projectPath = relative(process.cwd(), file);
      if (
        isTestFile(projectPath) ||
        projectPath === "features/ask-jakub/client/testing.tsx"
      ) {
        continue;
      }
      if (/client\/testing/.test(await readFile(file, "utf8"))) {
        offenders.push(projectPath);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("keeps ordinary callers on the public package entrypoint", async () => {
    const files = (
      await Promise.all(SOURCE_ROOTS.map((root) => sourceFiles(root)))
    ).flat();
    const offenders: string[] = [];

    for (const file of files) {
      const projectPath = relative(process.cwd(), file);
      if (
        isTestFile(projectPath) ||
        projectPath.startsWith("features/ask-jakub/")
      ) {
        continue;
      }
      if (
        /features\/ask-jakub\/(?:contract|client)(?:\/|["'])/.test(
          await readFile(file, "utf8"),
        )
      ) {
        offenders.push(projectPath);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("exports the UI-safe numeric question bound without exporting ASK_LIMITS", async () => {
    const entrypoint = await readFile(
      join(process.cwd(), "features/ask-jakub/index.tsx"),
      "utf8",
    );

    expect(ASK_JAKUB_QUESTION_LIMIT).toBe(600);
    expect(entrypoint).not.toMatch(
      /export\s+(?:const\s+ASK_LIMITS|\{[^}]*ASK_LIMITS)/,
    );
    expect(entrypoint).not.toMatch(
      /export\s+type\s+\{[^}]*(?:AskRequest|AskEvent)/,
    );
  });
});
