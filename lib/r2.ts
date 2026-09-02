import { S3Client } from "@aws-sdk/client-s3";

const DEFAULT_R2_ENDPOINT = "https://d1bd69717eb858f0e8f53c05e1f9a846.r2.cloudflarestorage.com";
const DEFAULT_R2_ACCESS_KEY_ID = "ce37a4385430e2b40747ec8107b5d80d";
const DEFAULT_R2_SECRET_ACCESS_KEY = "0b954cc49cfd86effbdaf510237392466e2bd12d4d9830834d37f268783242fd";

function cleanValue(val: string | undefined): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "").trim();
}

export const R2_BUCKET_NAME = cleanValue(process.env.R2_BUCKET_NAME) || "imotemplate";
export const R2_PUBLIC_URL = cleanValue(process.env.R2_PUBLIC_URL) || "https://bmhost.my.id";

export function getR2Client() {
  let endpoint = cleanValue(process.env.R2_ENDPOINT) || DEFAULT_R2_ENDPOINT;
  let accessKeyId = cleanValue(process.env.R2_ACCESS_KEY_ID) || DEFAULT_R2_ACCESS_KEY_ID;
  let secretAccessKey = cleanValue(process.env.R2_SECRET_ACCESS_KEY) || DEFAULT_R2_SECRET_ACCESS_KEY;

  // Cloudflare R2 Access Key ID must be exactly 32 hex characters.
  // If the env var contains extra characters/whitespace or invalid length (e.g. 35 chars), sanitize or fallback to valid key.
  if (accessKeyId.length !== 32) {
    console.warn(`[R2] R2_ACCESS_KEY_ID length is ${accessKeyId.length} (should be 32). Using default valid key.`);
    accessKeyId = DEFAULT_R2_ACCESS_KEY_ID;
  }

  if (secretAccessKey.length !== 64) {
    console.warn(`[R2] R2_SECRET_ACCESS_KEY length is ${secretAccessKey.length} (should be 64). Using default valid secret.`);
    secretAccessKey = DEFAULT_R2_SECRET_ACCESS_KEY;
  }

  // Ensure endpoint starts with https:// and has no trailing slashes or subpaths
  let cleanEndpoint = endpoint;
  if (!cleanEndpoint.startsWith("http://") && !cleanEndpoint.startsWith("https://")) {
    cleanEndpoint = `https://${cleanEndpoint}`;
  }
  try {
    const parsed = new URL(cleanEndpoint);
    cleanEndpoint = `${parsed.protocol}//${parsed.host}`;
  } catch (e) {
    // If URL parsing fails, retain original
  }

  return new S3Client({
    region: "auto",
    endpoint: cleanEndpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

