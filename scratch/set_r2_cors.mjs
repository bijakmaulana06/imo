import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf8");
const env = {};
envFile.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
});

const s3Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const bucketName = env.R2_BUCKET_NAME || "imotemplate";

async function setCors() {
  try {
    console.log(`Setting CORS for bucket: ${bucketName}...`);
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "HEAD", "PUT", "POST", "DELETE"],
            AllowedOrigins: ["*"],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    });
    
    await s3Client.send(command);
    console.log("CORS configuration successfully updated on R2!");
  } catch (error) {
    console.error("Error setting CORS:", error);
  }
}

setCors();
