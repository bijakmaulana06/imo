import { S3Client } from "@aws-sdk/client-s3";

export function getR2Client() {
  const endpoint = process.env.R2_ENDPOINT?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Cloudflare R2 environment variables (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are not properly configured in Vercel Environment Variables."
    );
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

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "imotemplate";
