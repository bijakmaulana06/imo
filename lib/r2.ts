import { S3Client } from "@aws-sdk/client-s3";

const DEFAULT_R2_ENDPOINT = "https://d1bd69717eb858f0e8f53c05e1f9a846.r2.cloudflarestorage.com";
const DEFAULT_R2_ACCESS_KEY_ID = "ce37a4385430e2b40747ec8107b5d80d";
const DEFAULT_R2_SECRET_ACCESS_KEY = "0b954cc49cfd86effbdaf510237392466e2bd12d4d9830834d37f268783242fd";

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "imotemplate";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://bmhost.my.id";

export function getR2Client() {
  const endpoint = (process.env.R2_ENDPOINT?.trim()) || DEFAULT_R2_ENDPOINT;
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID?.trim()) || DEFAULT_R2_ACCESS_KEY_ID;
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY?.trim()) || DEFAULT_R2_SECRET_ACCESS_KEY;

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
