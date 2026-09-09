import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const SESSION_SECONDS = 15 * 60;
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-voting-session" : "voting-session";

export class VotingError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "VotingError";
  }
}

export function votingSecret() {
  const secret = process.env.VOTING_SECRET;
  if (!secret || secret.length < 32) throw new VotingError(503, "Layanan voting belum dikonfigurasi oleh panitia.");
  return secret;
}

export function configuredOrigin() {
  const value = process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL;
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || !["http:", "https:"].includes(url.protocol)) return null;
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Exact origin + a non-simple custom header prevent cross-site form/fetch CSRF. */
export function requireSameOrigin(request: NextRequest) {
  const expected = configuredOrigin() || (process.env.NODE_ENV !== "production" ? request.nextUrl.origin : null);
  if (!expected) throw new VotingError(503, "Origin aplikasi voting belum dikonfigurasi.");
  if (request.headers.get("origin") !== expected || request.headers.get("x-voting-request") !== "1") {
    throw new VotingError(403, "Permintaan tidak berasal dari halaman voting ini.");
  }
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") throw new VotingError(403, "Permintaan lintas situs ditolak.");
}

export async function readJson(request: NextRequest, maxBytes = 4096): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new VotingError(415, "Gunakan format JSON.");
  }
  // Bound the stream, including chunked requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new VotingError(400, "Permintaan kosong.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new VotingError(413, "Permintaan terlalu besar.");
      }
      chunks.push(value);
    }
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("object required");
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof VotingError) throw error;
    throw new VotingError(400, "Data permintaan tidak valid.");
  } finally {
    reader.releaseLock();
  }
}

export function uuid(value: unknown) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new VotingError(400, "Identitas pemilihan atau kandidat tidak valid.");
  }
  return value;
}

export function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function privateDigest(value: string) {
  return createHmac("sha256", votingSecret()).update(value).digest("hex");
}

export function newSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function sessionToken(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

export function userAgentHash(request: NextRequest) {
  return privateDigest(`ua:${(request.headers.get("user-agent") || "").slice(0, 1024)}`);
}

/** Enable only behind an ingress that overwrites this header; never trust arbitrary proxy headers. */
export function clientAddressHash(request: NextRequest) {
  const header = process.env.VOTING_IP_HEADER?.toLowerCase();
  if (!header || !["cf-connecting-ip", "x-real-ip", "x-forwarded-for"].includes(header)) return null;
  const address = request.headers.get(header)?.split(",")[0]?.trim();
  return address && address.length <= 64 ? privateDigest(`ip:${address}`) : null;
}

export function json<T>(body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, private, max-age=0",
      "Pragma": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Vary": "Cookie, Authorization",
    },
  });
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || Boolean(configuredOrigin()?.startsWith("https://")),
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
    priority: "high",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || Boolean(configuredOrigin()?.startsWith("https://")),
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof VotingError) {
    const response = json({ error: error.message }, error.status);
    if (error.status === 429) response.headers.set("Retry-After", "60");
    return response;
  }
  // Never return or log request bodies, NIMs, access codes, tokens, or database errors.
  return json({ error: "Layanan voting sedang tidak tersedia. Silakan coba kembali." }, 503);
}
