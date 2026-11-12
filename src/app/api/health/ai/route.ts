import { checkGateway } from "@/lib/ai/gateway";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await checkGateway();
  return Response.json(status, { status: status.ok ? 200 : 503 });
}
