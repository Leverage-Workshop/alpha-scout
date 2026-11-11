import { getPool } from "@/lib/db/pool";
import { checkTimescale } from "@/lib/db/timescale";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await checkTimescale(getPool());
    return Response.json(status, { status: status.ok ? 200 : 503 });
  } catch (err) {
    console.error("DB health check failed", err);
    return Response.json({ ok: false, error: "database unreachable" }, { status: 503 });
  }
}
