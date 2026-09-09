import { createHmac, randomBytes } from "node:crypto";

import { normalizeNim, normalizeAccessCode } from "./identity.mjs";
export { normalizeNim, normalizeAccessCode } from "./identity.mjs";

function hash(value, secret) {
  if (typeof secret !== "string" || secret.length < 32) throw new Error("VOTING_SECRET harus berisi minimal 32 karakter.");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function hashNim(nim, secret) {
  return hash(`nim:${normalizeNim(nim)}`, secret);
}

export function hashAccessCode(code, secret) {
  return hash(`access:${normalizeAccessCode(code)}`, secret);
}

export function generateAccessCode() {
  return randomBytes(24).toString("base64url");
}
