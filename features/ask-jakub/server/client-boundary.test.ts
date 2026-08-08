import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOTS = ["app", "components", "data", "features", "lib"];
const SERVER_IMPORT =
  /(?:@\/features\/ask-jakub\/server|(?:\.\.\/|\.\/)server(?:\/|["']))/;

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

describe("Ask Jakub server-only boundary", () => {
  it("keeps every server implementation import out of client-capable source", async () => {
    const files = (
      await Promise.all(SOURCE_ROOTS.map((root) => sourceFiles(root)))
    ).flat();
    const offenders: string[] = [];

    for (const file of files) {
      const projectPath = relative(process.cwd(), file);
      if (
        projectPath.startsWith("features/ask-jakub/server/") ||
        projectPath === "app/api/ask-jakub/route.ts" ||
        /\.(?:test|spec)\.[jt]sx?$/.test(projectPath)
      ) {
        continue;
      }
      if (SERVER_IMPORT.test(await readFile(file, "utf8"))) {
        offenders.push(projectPath);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("keeps the shared wire contract free of provider and environment code", async () => {
    const contract = await readFile(
      join(process.cwd(), "features/ask-jakub/contract.ts"),
      "utf8",
    );

    expect(contract).not.toMatch(/process\.env|server\/|AnswerModelPort/);
  });

  it("keeps Groq configuration and endpoint markers out of client-capable source", async () => {
    const files = (
      await Promise.all(SOURCE_ROOTS.map((root) => sourceFiles(root)))
    ).flat();
    const offenders: string[] = [];

    for (const file of files) {
      const projectPath = relative(process.cwd(), file);
      if (
        projectPath.startsWith("features/ask-jakub/server/") ||
        projectPath === "app/api/ask-jakub/route.ts" ||
        /\.(?:test|spec)\.[jt]sx?$/.test(projectPath)
      ) {
        continue;
      }
      if (
        /GROQ_API_KEY|ASK_JAKUB_PROVIDER|api\.groq\.com|openai\/gpt-oss/.test(
          await readFile(file, "utf8"),
        )
      ) {
        offenders.push(projectPath);
      }
    }

    expect(offenders).toEqual([]);
  });
});
