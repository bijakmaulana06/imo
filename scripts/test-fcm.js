#!/usr/bin/env node
/**
 * scripts/test-fcm.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Script testing FCM (Firebase Cloud Messaging) untuk project imo-info.
 *
 * CARA PAKAI:
 *   node scripts/test-fcm.js                      → jalankan semua tes
 *   node scripts/test-fcm.js --check              → cek konfigurasi saja
 *   node scripts/test-fcm.js --send <fcm-token>   → kirim notif ke satu token
 *   node scripts/test-fcm.js --send-all           → kirim ke semua token di DB
 *   node scripts/test-fcm.js --list               → list FCM token di DB
 *
 * REQUIREMENTS:
 *   - Isi .env.local dengan NEXT_PUBLIC_FIREBASE_* yang lengkap
 *   - Pastikan sudah punya service account key untuk project imo-info
 *     (letakkan di: scripts/imo-info-serviceaccount.json)
 *   - node scripts/test-fcm.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Load .env.local ─────────────────────────────────────────────────────────
const fs = require("fs");
const path = require("path");
const https = require("https");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ File .env.local tidak ditemukan!");
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

// ─── Konfigurasi ─────────────────────────────────────────────────────────────
const CONFIG = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "imo-info",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1061088435535",
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  // Path ke service account — auto-detect nama file firebase-adminsdk di folder scripts/
  serviceAccountPath: (() => {
    const scriptsDir = __dirname;
    // Cari file apapun yang namanya mengandung "firebase-adminsdk" atau "imo-info-serviceaccount"
    try {
      const files = fs.readdirSync(scriptsDir);
      const found = files.find(
        (f) => f.endsWith(".json") && (f.includes("firebase-adminsdk") || f.includes("serviceaccount"))
      );
      if (found) return path.join(scriptsDir, found);
    } catch {}
    return path.join(__dirname, "imo-info-serviceaccount.json"); // fallback
  })(),
};

// ─── Warna CLI ────────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};
const ok = (msg) => console.log(`  ${C.green}✓${C.reset} ${msg}`);
const fail = (msg) => console.log(`  ${C.red}✗${C.reset} ${msg}`);
const warn = (msg) => console.log(`  ${C.yellow}⚠${C.reset} ${msg}`);
const info = (msg) => console.log(`  ${C.cyan}ℹ${C.reset} ${msg}`);
const section = (title) => {
  console.log(`\n${C.bold}${C.cyan}══════ ${title} ══════${C.reset}`);
};

// ─── 1. CHECK CONFIG ─────────────────────────────────────────────────────────
async function checkConfig() {
  section("1. Cek Konfigurasi Firebase");

  let allOk = true;

  const checks = [
    ["NEXT_PUBLIC_FIREBASE_API_KEY", CONFIG.apiKey, "Wajib! Ambil dari Firebase Console"],
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", CONFIG.projectId, ""],
    ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", CONFIG.messagingSenderId, ""],
    ["NEXT_PUBLIC_FIREBASE_APP_ID", CONFIG.appId, "Wajib! Ambil dari Firebase Console"],
    ["NEXT_PUBLIC_FIREBASE_VAPID_KEY", CONFIG.vapidKey, ""],
    ["NEXT_PUBLIC_SUPABASE_URL", CONFIG.supabaseUrl, ""],
    ["SUPABASE_SERVICE_ROLE_KEY", CONFIG.supabaseServiceKey ? "[tersedia]" : "", ""],
  ];

  for (const [key, val, hint] of checks) {
    if (val && val !== "") {
      ok(`${key} = ${val.slice(0, 30)}${val.length > 30 ? "..." : ""}`);
    } else {
      fail(`${key} = (kosong)${hint ? " ← " + hint : ""}`);
      allOk = false;
    }
  }

  // Cek firebase-messaging-sw.js
  section("2. Cek Service Worker FCM");
  const swPath = path.join(__dirname, "..", "public", "firebase-messaging-sw.js");
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, "utf-8");
    const hasApiKey = swContent.includes("apiKey:") && !swContent.includes('apiKey: "",');
    const hasAppId = swContent.includes("appId:") && !swContent.includes('appId: "",');

    if (hasApiKey) {
      ok("firebase-messaging-sw.js: apiKey terisi");
    } else {
      fail('firebase-messaging-sw.js: apiKey masih KOSONG → isi baris: apiKey: "AIzaSy..."');
      allOk = false;
    }

    if (hasAppId) {
      ok("firebase-messaging-sw.js: appId terisi");
    } else {
      fail('firebase-messaging-sw.js: appId masih KOSONG → isi baris: appId: "1:106...:web:..."');
      allOk = false;
    }
  } else {
    fail("public/firebase-messaging-sw.js tidak ditemukan!");
    allOk = false;
  }

  // Cek service account untuk imo-info
  section("3. Cek Service Account (untuk kirim FCM)");
  if (fs.existsSync(CONFIG.serviceAccountPath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(CONFIG.serviceAccountPath, "utf-8"));
      if (sa.project_id === CONFIG.projectId) {
        ok(`Service account untuk project: ${sa.project_id}`);
        ok(`Client email: ${sa.client_email}`);
      } else {
        warn(`Service account project_id="${sa.project_id}" BEDA dengan Firebase project "${CONFIG.projectId}"`);
        warn("Untuk mengirim FCM ke project imo-info, butuh service account dari project imo-info");
        allOk = false;
      }
    } catch (e) {
      fail("Gagal parse service account JSON: " + e.message);
      allOk = false;
    }
  } else {
    warn(`Service account tidak ditemukan di: ${CONFIG.serviceAccountPath}`);
    warn("Download dari: Firebase Console → Project Settings → Service Accounts → Generate new private key");
    warn("Simpan sebagai: scripts/imo-info-serviceaccount.json");
    allOk = false;
  }

  return allOk;
}

// ─── 2. TEST KONEKSI FIREBASE ─────────────────────────────────────────────────
async function testFirebaseConnection() {
  section("4. Test Koneksi ke Firebase");

  // Test apakah project Firebase bisa diakses via REST API
  return new Promise((resolve) => {
    const url = `https://firebaseremoteconfig.googleapis.com/v1/projects/${CONFIG.projectId}/remoteConfig`;
    const req = https.get(url, (res) => {
      if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 403) {
        // 401/403 = Firebase ada, tapi tidak ada auth — normal untuk test tanpa token
        ok(`Firebase project "${CONFIG.projectId}" dapat dijangkau (HTTP ${res.statusCode})`);
        resolve(true);
      } else if (res.statusCode === 404) {
        fail(`Firebase project "${CONFIG.projectId}" tidak ditemukan (404)`);
        resolve(false);
      } else {
        warn(`Respons tidak terduga: HTTP ${res.statusCode}`);
        resolve(false);
      }
      // Drain response body agar socket ditutup & timeout tidak tembak setelah resolve
      res.resume();
    });
    req.on("error", (err) => {
      if (!resolved) {
        fail(`Koneksi ke Firebase gagal: ${err.message}`);
        warn("Pastikan koneksi internet aktif dan tidak ada firewall yang memblokir googleapis.com");
        resolve(false);
      }
    });

    // Guard agar timeout tidak menembak setelah promise sudah resolve
    let resolved = false;
    const _origResolve = resolve;
    resolve = (val) => { resolved = true; _origResolve(val); };

    req.setTimeout(10000, () => {
      if (!resolved) {
        req.destroy();
        fail("Timeout koneksi ke Firebase (10 detik)");
        resolve(false);
      }
    });
  });
}

// ─── 3. AMBIL ACCESS TOKEN (dari Service Account) ─────────────────────────────
async function getAccessToken() {
  if (!fs.existsSync(CONFIG.serviceAccountPath)) {
    throw new Error("Service account tidak tersedia. Lihat instruksi di bagian 3.");
  }

  const serviceAccount = JSON.parse(fs.readFileSync(CONFIG.serviceAccountPath, "utf-8"));

  // Buat JWT secara manual (tanpa google-auth-library)
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Encode JWT header & payload
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claim)).toString("base64url");
  const signingInput = `${header}.${payload}`;

  // Sign dengan private key menggunakan built-in crypto
  const crypto = require("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(serviceAccount.private_key, "base64url");

  const jwt = `${signingInput}.${signature}`;

  // Exchange JWT untuk access token
  return new Promise((resolve, reject) => {
    const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const options = {
      hostname: "oauth2.googleapis.com",
      path: "/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            resolve(parsed.access_token);
          } else {
            const errMsg = parsed.error_description || parsed.error || JSON.stringify(parsed);
            reject(new Error(`OAuth2 error: ${errMsg}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

// ─── 4. KIRIM NOTIF FCM VIA HTTP v1 API ──────────────────────────────────────
async function sendFcmNotification(fcmToken, title, body, data = {}) {
  section(`5. Kirim Notifikasi FCM`);
  info(`Target token: ${fcmToken.slice(0, 30)}...`);
  info(`Judul: ${title}`);
  info(`Pesan: ${body}`);

  let accessToken;
  try {
    info("Mengambil OAuth2 access token dari service account...");
    accessToken = await getAccessToken();
    ok("Access token berhasil didapat");
  } catch (e) {
    fail("Gagal mendapat access token: " + e.message);
    return false;
  }

  const messagePayload = JSON.stringify({
    message: {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          title,
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "imo-test-fcm",
          renotify: true,
          requireInteraction: true,
        },
        fcm_options: {
          link: data.url || "/info",
        },
      },
      data: {
        url: data.url || "/info",
        tag: "imo-test-fcm",
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      },
    },
  });

  return new Promise((resolve) => {
    const options = {
      hostname: "fcm.googleapis.com",
      path: `/v1/projects/${CONFIG.projectId}/messages:send`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(messagePayload),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => (responseData += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode === 200 && parsed.name) {
            ok(`Notifikasi berhasil dikirim!`);
            ok(`Message ID: ${parsed.name}`);
            resolve(true);
          } else {
            fail(`FCM error (HTTP ${res.statusCode}):`);
            console.log(`     ${C.dim}${JSON.stringify(parsed, null, 2)}${C.reset}`);
            resolve(false);
          }
        } catch (e) {
          fail("Gagal parse response FCM: " + e.message);
          resolve(false);
        }
      });
    });

    req.on("error", (err) => {
      fail("Koneksi ke FCM API gagal: " + err.message);
      resolve(false);
    });

    req.write(messagePayload);
    req.end();
  });
}

// ─── 5. AMBIL TOKEN DARI SUPABASE ────────────────────────────────────────────
async function listFcmTokensFromDB() {
  section("6. FCM Token di Database Supabase");

  if (!CONFIG.supabaseUrl || !CONFIG.supabaseServiceKey) {
    fail("Supabase URL atau Service Role Key tidak tersedia");
    return [];
  }

  return new Promise((resolve) => {
    const url = new URL(`${CONFIG.supabaseUrl}/rest/v1/fcm_tokens?select=id,token,user_agent,created_at,updated_at&order=updated_at.desc&limit=10`);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "GET",
      headers: {
        apikey: CONFIG.supabaseServiceKey,
        Authorization: `Bearer ${CONFIG.supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const tokens = JSON.parse(data);
            if (tokens.length === 0) {
              warn("Belum ada FCM token tersimpan di database.");
              warn("→ Buka browser, izinkan notifikasi, lalu jalankan script ini lagi");
            } else {
              ok(`Ditemukan ${tokens.length} FCM token:`);
              tokens.forEach((t, i) => {
                console.log(`\n  ${C.bold}[${i + 1}]${C.reset}`);
                console.log(`     Token  : ${C.dim}${t.token.slice(0, 40)}...${C.reset}`);
                console.log(`     ID     : ${t.id}`);
                console.log(`     UA     : ${(t.user_agent || "-").slice(0, 60)}`);
                console.log(`     Updated: ${t.updated_at}`);
              });
            }
            resolve(tokens);
          } catch (e) {
            fail("Gagal parse respons Supabase: " + e.message);
            resolve([]);
          }
        } else if (res.statusCode === 404 || (res.statusCode === 400 && data.includes("does not exist"))) {
          fail('Tabel "fcm_tokens" belum ada di database!');
          warn("→ Jalankan migration: scripts/migrations/fcm_tokens.sql di Supabase SQL Editor");
          resolve([]);
        } else {
          fail(`Supabase error HTTP ${res.statusCode}: ${data.slice(0, 200)}`);
          resolve([]);
        }
      });
    });

    req.on("error", (err) => {
      fail("Koneksi ke Supabase gagal: " + err.message);
      resolve([]);
    });

    req.end();
  });
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${C.bold}${C.cyan}╔══════════════════════════════════════════════╗`);
  console.log(`║   FCM Integration Test — IMO Info Project    ║`);
  console.log(`╚══════════════════════════════════════════════╝${C.reset}`);
  console.log(`${C.dim}  Firebase Project: ${CONFIG.projectId}${C.reset}`);
  console.log(`${C.dim}  Sender ID       : ${CONFIG.messagingSenderId}${C.reset}`);
  console.log(`${C.dim}  Waktu           : ${new Date().toLocaleString("id-ID")}${C.reset}`);

  const args = process.argv.slice(2);

  // ─── Mode: --check ────────────────────────────────────────────────────────
  if (args.includes("--check") || args.length === 0) {
    const configOk = await checkConfig();
    await testFirebaseConnection();

    console.log(`\n${C.bold}══════ Ringkasan ══════${C.reset}`);
    if (configOk) {
      console.log(`  ${C.green}${C.bold}✓ Konfigurasi lengkap! Siap untuk testing.${C.reset}`);
    } else {
      console.log(`  ${C.red}${C.bold}✗ Ada konfigurasi yang belum diisi. Lihat detail di atas.${C.reset}`);
    }
  }

  // ─── Mode: --list ─────────────────────────────────────────────────────────
  if (args.includes("--list")) {
    await listFcmTokensFromDB();
  }

  // ─── Mode: --send <token> ─────────────────────────────────────────────────
  const sendIdx = args.indexOf("--send");
  if (sendIdx >= 0) {
    const token = args[sendIdx + 1];
    if (!token || token.startsWith("--")) {
      fail("Gunakan: node scripts/test-fcm.js --send <fcm-token>");
      process.exit(1);
    }
    await sendFcmNotification(
      token,
      "🔔 Test FCM — IMO 2026",
      "Ini adalah notifikasi test dari script test-fcm.js. Jika Anda melihat ini, FCM berfungsi dengan baik! 🎉",
      { url: "/info", source: "test-script" }
    );
  }

  // ─── Mode: --send-all ─────────────────────────────────────────────────────
  if (args.includes("--send-all")) {
    const tokens = await listFcmTokensFromDB();
    if (tokens.length === 0) {
      warn("Tidak ada token untuk dikirim notifikasi.");
    } else {
      info(`Mengirim ke ${tokens.length} perangkat...`);
      let successCount = 0;
      for (const t of tokens) {
        const ok = await sendFcmNotification(
          t.token,
          "🔔 Test Broadcast FCM — IMO 2026",
          "Ini adalah notifikasi broadcast test. Semua perangkat terdaftar menerima ini.",
          { url: "/info" }
        );
        if (ok) successCount++;
      }
      console.log(`\n  ${C.bold}Hasil: ${successCount}/${tokens.length} berhasil dikirim${C.reset}`);
    }
  }

  // ─── Mode: tidak ada flag valid ───────────────────────────────────────────
  if (args.length === 0) {
    // Default: jalankan check + list
    await testFirebaseConnection();
    await listFcmTokensFromDB();

    console.log(`\n${C.bold}══════ Perintah Tersedia ══════${C.reset}`);
    console.log(`  ${C.cyan}node scripts/test-fcm.js --check${C.reset}             → Cek konfigurasi`);
    console.log(`  ${C.cyan}node scripts/test-fcm.js --list${C.reset}              → List token di DB`);
    console.log(`  ${C.cyan}node scripts/test-fcm.js --send <token>${C.reset}      → Kirim ke 1 token`);
    console.log(`  ${C.cyan}node scripts/test-fcm.js --send-all${C.reset}          → Kirim ke semua token`);
  }

  console.log();
}

main().catch((err) => {
  console.error(`\n${C.red}Fatal error: ${err.message}${C.reset}`);
  process.exit(1);
});
