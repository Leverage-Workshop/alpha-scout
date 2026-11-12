import { describe, expect, test } from "vitest";
import { checkTimescale } from "./timescale";

const fakeDb = (row: Record<string, unknown>) => ({ query: async () => ({ rows: [row] }) });

describe("checkTimescale", () => {
  test("reports the enabled version", async () => {
    const status = await checkTimescale(
      fakeDb({ postgres_version: "18.6", timescale_version: "2.30.2" }),
    );
    expect(status).toEqual({ ok: true, postgresVersion: "18.6", timescaleVersion: "2.30.2" });
  });

  test("fails when the extension is missing", async () => {
    const status = await checkTimescale(fakeDb({ postgres_version: "18.6", timescale_version: null }));
    expect(status.ok).toBe(false);
  });
});
