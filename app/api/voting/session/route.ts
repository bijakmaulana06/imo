import { NextRequest } from "next/server";
import { deleteVoterSession, getVoterSession, startVoterSession } from "@/lib/voting/server";
import { clearSessionCookie, errorResponse, json, readJson, requireSameOrigin, setSessionCookie } from "@/lib/voting/security";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getVoterSession(request);
    const response = json(session);
    if (!session.verified) clearSessionCookie(response);
    return response;
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    requireSameOrigin(request);
    const { session, token } = await startVoterSession(request, await readJson(request));
    const response = json(session);
    setSessionCookie(response, token);
    return response;
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    requireSameOrigin(request);
    await deleteVoterSession(request);
    const response = json({ verified: false });
    clearSessionCookie(response);
    return response;
  } catch (error) { return errorResponse(error); }
}
