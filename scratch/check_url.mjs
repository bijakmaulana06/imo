import { createClient } from "@supabase/supabase-js";
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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from("id_card_templates").select("background_url").order("created_at", { ascending: false }).limit(1);
  if (error) {
    console.error("DB error:", error);
    return;
  }
  if (!data || data.length === 0) {
    console.log("No templates found in DB.");
    return;
  }
  const url = data[0].background_url;
  console.log("Latest template URL:", url);

  try {
    const res = await fetch(url, { method: "HEAD", headers: { Origin: "http://localhost:3000" } });
    console.log("HEAD Status:", res.status);
    console.log("CORS Allow Origin:", res.headers.get("Access-Control-Allow-Origin"));
    console.log("CORS Allow Methods:", res.headers.get("Access-Control-Allow-Methods"));
  } catch (e) {
    console.error("Fetch error:", e.message);
  }
}
check();
