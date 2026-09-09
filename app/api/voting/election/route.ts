import { getElectionSnapshot } from "@/lib/voting/server";
import { errorResponse, json } from "@/lib/voting/security";

export const runtime = "nodejs";

export async function GET() {
  try { return json(await getElectionSnapshot()); }
  catch (error) { return errorResponse(error); }
}
