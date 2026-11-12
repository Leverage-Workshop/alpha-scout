// Applies db/migrations/*.sql in filename order, once each, recording them in schema_migrations.
// Usage: npm run db:migrate   (reads DATABASE_URL / DATABASE_CA_CERT from env or .env.local)
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { buildPoolConfig } from "../src/lib/db/config.ts";

const dir = path.join(import.meta.dirname, "..", "db", "migrations");
const client = new pg.Client(buildPoolConfig());
await client.connect();

try {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const { rows } = await client.query<{ name: string }>("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(dir, file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`applied ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`migration ${file} failed`, { cause: err });
    }
  }
  console.log("migrations up to date");
} finally {
  await client.end();
}
