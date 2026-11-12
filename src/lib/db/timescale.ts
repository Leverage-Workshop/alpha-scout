export type TimescaleStatus =
  | { ok: true; postgresVersion: string; timescaleVersion: string }
  | { ok: false; postgresVersion: string; error: string };

type Queryable = {
  query: (sql: string) => Promise<{ rows: Record<string, unknown>[] }>;
};

/** Confirms the timescaledb extension is enabled in the connected database. */
export async function checkTimescale(db: Queryable): Promise<TimescaleStatus> {
  const { rows } = await db.query(
    `SELECT current_setting('server_version') AS postgres_version,
            (SELECT extversion FROM pg_extension WHERE extname = 'timescaledb') AS timescale_version`,
  );
  const row = rows[0] ?? {};
  const postgresVersion = String(row.postgres_version ?? "unknown");
  const timescaleVersion = row.timescale_version;

  if (typeof timescaleVersion !== "string") {
    return { ok: false, postgresVersion, error: "timescaledb extension is not enabled" };
  }
  return { ok: true, postgresVersion, timescaleVersion };
}
