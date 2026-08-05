import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
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

async function testGet() {
  try {
    const key = "idcard-psd/1785846222396_Untitled-1.psd";
    console.log("Fetching key from R2 via S3 SDK:", key);
    const command = new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME || "imotemplate",
      Key: key,
    });
    const res = await s3Client.send(command);
    console.log("Success! ContentType:", res.ContentType, "ContentLength:", res.ContentLength);
  } catch (e) {
    console.error("GetObject failed:", e);
  }
}
testGet();
