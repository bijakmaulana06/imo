import { GET } from "../app/api/id-card-templates/file/route.ts";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf8");
envFile.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[key] = val;
  }
});

async function testProxy() {
  const req = new Request("http://localhost:3000/api/id-card-templates/file?key=idcard-psd%2F1785846222396_Untitled-1.psd");
  const res = await GET(req);
  console.log("Proxy response status:", res.status);
  console.log("Content-Type:", res.headers.get("Content-Type"));
  console.log("Content-Length:", res.headers.get("Content-Length"));
}
testProxy();
