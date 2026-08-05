import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
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

async function testList() {
  try {
    console.log("Listing objects in R2 bucket:", env.R2_BUCKET_NAME);
    const command = new ListObjectsV2Command({
      Bucket: env.R2_BUCKET_NAME || "imotemplate",
    });
    const res = await s3Client.send(command);
    console.log("Objects in bucket:");
    if (res.Contents) {
      res.Contents.forEach(obj => console.log(" - Key:", obj.Key, "Size:", obj.Size));
    } else {
      console.log("Bucket is empty!");
    }
  } catch (e) {
    console.error("ListObjects failed:", e);
  }
}
testList();
