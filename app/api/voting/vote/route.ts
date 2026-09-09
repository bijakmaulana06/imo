import { NextRequest } from "next/server";
import { castVote } from "@/lib/voting/server";
import { errorResponse, json, readJson, requireSameOrigin } from "@/lib/voting/security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    return json(await castVote(request, await readJson(request)));
  } catch (error) { return errorResponse(error); }
}
