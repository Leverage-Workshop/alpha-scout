import type { PoolConfig } from "pg";

/**
 * Builds a pg PoolConfig from environment variables.
 *
 * When DATABASE_CA_CERT is set (Aiven), TLS is verified against that CA and any
 * `sslmode` in the URL is dropped so pg doesn't override the explicit `ssl` option.
 */
type DbEnv = Partial<Record<"DATABASE_URL" | "DATABASE_CA_CERT", string>> & Record<string, string | undefined>;

export function buildPoolConfig(env: DbEnv = process.env): PoolConfig {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const ca = env.DATABASE_CA_CERT?.trim();
  if (!ca) {
    return { connectionString: url, max: 5 };
  }

  const parsed = new URL(url);
  parsed.searchParams.delete("sslmode");
  return {
    connectionString: parsed.toString(),
    ssl: { ca: ca.replace(/\\n/g, "\n"), rejectUnauthorized: true },
    max: 5,
  };
}
