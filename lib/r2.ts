import { S3Client } from "@aws-sdk/client-s3";

function cleanValue(value: string | undefined): string {
  return value?.trim().replace(/^["']|["']$/g, "").trim() || "";
}

export const R2_BUCKET_NAME = cleanValue(process.env.R2_BUCKET_NAME);
export const R2_PUBLIC_URL = cleanValue(process.env.R2_PUBLIC_URL);

/** Credentials must be explicitly provisioned; missing or malformed values fail closed. */
export function getR2Client() {
  const accountId = cleanValue(process.env.R2_ACCOUNT_ID);
  const endpoint = cleanValue(process.env.R2_ENDPOINT) || (/^[a-f0-9]{32}$/i.test(accountId) ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  const accessKeyId = cleanValue(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = cleanValue(process.env.R2_SECRET_ACCESS_KEY);

  if (!/^[a-f0-9]{32}$/i.test(accessKeyId) || !/^[a-f0-9]{64}$/i.test(secretAccessKey)) {
    throw new Error("R2_ACCESS_KEY_ID dan R2_SECRET_ACCESS_KEY harus dikonfigurasi dengan kredensial R2 yang valid.");
  }
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(R2_BUCKET_NAME)) {
    throw new Error("R2_BUCKET_NAME belum dikonfigurasi dengan nama bucket yang valid.");
  }

  let parsed: URL;
  try { parsed = new URL(endpoint); }
  catch { throw new Error("Konfigurasikan R2_ENDPOINT HTTPS atau R2_ACCOUNT_ID yang valid."); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname !== "/" && parsed.pathname !== "")) {
    throw new Error("R2_ENDPOINT harus origin HTTPS tanpa kredensial, path, query, atau fragment.");
  }

  return new S3Client({
    region: "auto",
    endpoint: parsed.origin,
    credentials: { accessKeyId, secretAccessKey },
  });
}
