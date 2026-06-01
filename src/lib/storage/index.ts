import { InMemoryAccuracyStore } from "./memory-accuracy-store";
import { NeonAccuracyStore } from "./neon-accuracy-store";
import type { AccuracyStore } from "./accuracy-store";

export function createAccuracyStore(connectionString = process.env.DATABASE_URL): AccuracyStore {
  if (connectionString) return new NeonAccuracyStore(connectionString);
  return new InMemoryAccuracyStore();
}

export type { AccuracyStore, AccuracyStoreStatus, SourceRunRecord, SourceRunStatus } from "./accuracy-store";
export { InMemoryAccuracyStore } from "./memory-accuracy-store";
export { NeonAccuracyStore } from "./neon-accuracy-store";
