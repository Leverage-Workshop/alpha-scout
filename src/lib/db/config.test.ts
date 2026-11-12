import { describe, expect, test } from "vitest";
import { buildPoolConfig } from "./config";

describe("buildPoolConfig", () => {
  test("throws without DATABASE_URL", () => {
    expect(() => buildPoolConfig({})).toThrow("DATABASE_URL");
  });

  test("passes the URL through when no CA is set", () => {
    const url = "postgresql://u:p@localhost:5432/db";
    expect(buildPoolConfig({ DATABASE_URL: url }).connectionString).toBe(url);
  });

  test("verifies TLS against the CA and drops sslmode", () => {
    const config = buildPoolConfig({
      DATABASE_URL: "postgresql://u:p@db.example.com:25664/defaultdb?sslmode=require",
      DATABASE_CA_CERT: "-----BEGIN CERTIFICATE-----\\nabc\\n-----END CERTIFICATE-----",
    });
    expect(config.connectionString).not.toContain("sslmode");
    expect(config.ssl).toEqual({
      ca: "-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----",
      rejectUnauthorized: true,
    });
  });
});
