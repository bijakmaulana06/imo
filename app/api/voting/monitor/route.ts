import { getMonitorSnapshot } from "@/lib/voting/server";
import { errorResponse, json } from "@/lib/voting/security";

export const runtime = "nodejs";

export async function GET() {
  try { return json(await getMonitorSnapshot()); }
  catch (error) { return errorResponse(error); }
}
