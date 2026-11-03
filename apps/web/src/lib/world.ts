import "server-only";
import { buildSampleWorld, type SampleWorld } from "@sigil/core";

// One in-memory sample world per server process (keys are fresh on every start; all data is Sample).
const g = globalThis as unknown as { __sigilWorld?: SampleWorld };

export function sampleWorld(): SampleWorld {
  g.__sigilWorld ??= buildSampleWorld({ audience: process.env.SIGIL_AUDIENCE ?? "http://localhost:3000" });
  return g.__sigilWorld;
}
