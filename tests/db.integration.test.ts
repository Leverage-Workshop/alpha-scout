// Runs only when DATABASE_URL is set (e.g. against the local Docker DB after `npm run db:migrate`).
import pg from "pg";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { buildPoolConfig } from "@/lib/db/config";
import { checkTimescale } from "@/lib/db/timescale";

describe.skipIf(!process.env.DATABASE_URL)("database (integration)", () => {
  let client: pg.Client;

  beforeAll(async () => {
    client = new pg.Client(buildPoolConfig());
    await client.connect();
  });

  afterAll(async () => {
    await client?.end();
  });

  test("timescaledb is enabled", async () => {
    const status = await checkTimescale(client);
    expect(status.ok).toBe(true);
  });

  test("hypertables can be created", async () => {
    await client.query("BEGIN");
    try {
      await client.query("CREATE TABLE hypertable_probe (ts timestamptz NOT NULL, v double precision)");
      const { rows } = await client.query(
        "SELECT created FROM create_hypertable('hypertable_probe', by_range('ts'))",
      );
      expect(rows[0]?.created).toBe(true);
    } finally {
      await client.query("ROLLBACK");
    }
  });
});
