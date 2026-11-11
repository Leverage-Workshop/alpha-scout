// Verifies the database is reachable and timescaledb is enabled. Exits non-zero otherwise.
import pg from "pg";
import { buildPoolConfig } from "../src/lib/db/config.ts";
import { checkTimescale } from "../src/lib/db/timescale.ts";

const client = new pg.Client(buildPoolConfig());
await client.connect();
try {
  const status = await checkTimescale(client);
  console.log(JSON.stringify(status));
  if (!status.ok) process.exitCode = 1;
} finally {
  await client.end();
}
