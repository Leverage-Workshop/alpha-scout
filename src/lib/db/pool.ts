import "server-only";
import { Pool } from "pg";
import { buildPoolConfig } from "./config";

// Reuse one pool across hot reloads in dev and across invocations on a warm function.
const globalForDb = globalThis as unknown as { alphaScoutPool?: Pool };

export function getPool(): Pool {
  globalForDb.alphaScoutPool ??= new Pool(buildPoolConfig());
  return globalForDb.alphaScoutPool;
}
