import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("project dependency boundaries", () => {
  it("does not add a Neo4j driver before a free-tier graph adapter decision", () => {
    const manifest = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const dependencies = { ...(manifest.dependencies ?? {}), ...(manifest.devDependencies ?? {}) };

    expect(Object.keys(dependencies)).not.toContain("neo4j-driver");
  });

  it("keeps the MVP free of paid news vendor SDKs", () => {
    const manifestText = readFileSync("package.json", "utf8").toLowerCase();

    expect(manifestText).not.toContain("bloomberg");
    expect(manifestText).not.toContain("refinitiv");
    expect(manifestText).not.toContain("factset");
  });
});
