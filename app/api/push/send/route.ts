/**
 * app/api/push/send/route.ts
 * 100% PURE FIREBASE CLOUD MESSAGING (FCM) BROADCAST ENGINE
 * 
 * Mengirim notifikasi push ke semua token perangkat yang terdaftar di tabel `fcm_tokens`
 * menggunakan Google Firebase Cloud Messaging HTTP v1 API.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import https from "https";
import crypto from "crypto";

// Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper Google OAuth2 Access Token
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify(claim)).toString("base64url");
  const signingInput = `${header}.${payload}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(serviceAccount.private_key, "base64url");

  const jwt = `${signingInput}.${signature}`;
  const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;

  return new Promise((resolve, reject) => {
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
            reject(new Error(parsed.error_description || parsed.error || data));
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

function getServiceAccount() {
  const scriptsDir = path.join(process.cwd(), "scripts");
  try {
    const files = fs.readdirSync(scriptsDir);
    const found = files.find(
      (f) => f.endsWith(".json") && (f.includes("firebase-adminsdk") || f.includes("serviceaccount"))
    );
    if (found) {
      return JSON.parse(fs.readFileSync(path.join(scriptsDir, found), "utf-8"));
    }
  } catch {}
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, url, icon, tag, isTest, testToken } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Judul dan pesan notifikasi wajib diisi." },
        { status: 400 }
      );
    }

    const serviceAccount = getServiceAccount();
    if (!serviceAccount) {
      return NextResponse.json(
        { error: "Firebase Service Account key tidak ditemukan di server (folder scripts/)." },
        { status: 500 }
      );
    }

    const accessToken = await getGoogleAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id || "imo-info";

    // Ambil daftar token FCM dari Supabase
    let tokens: string[] = [];

    if (isTest && testToken) {
      tokens = [testToken];
    } else {
      const { data, error } = await supabaseAdmin
        .from("fcm_tokens")
        .select("token");

      if (error) {
        return NextResponse.json(
          { error: "Gagal membaca database token: " + error.message },
          { status: 500 }
        );
      }

      tokens = (data || []).map((row) => row.token).filter(Boolean);
    }

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: "Tidak ada perangkat terdaftar yang berlangganan notifikasi FCM.",
      });
    }

    let successCount = 0;
    let failedCount = 0;
    const expiredTokens: string[] = [];

    // Kirim notifikasi secara batch ke FCM HTTP v1 API
    await Promise.all(
      tokens.map(async (token) => {
        const payload = {
          message: {
            token,
            notification: {
              title,
              body: message,
            },
            webpush: {
              headers: {
                Urgency: "high",
              },
              notification: {
                title,
                body: message,
                icon: icon || "/Brighton.svg",
                badge: "/Brighton.svg",
                tag: tag || "imo-broadcast-notif",
                requireInteraction: true,
                renotify: true,
              },
              fcm_options: {
                link: url || "/info",
              },
            },
            data: {
              url: url || "/info",
              title,
              body: message,
            },
          },
        };

        const postData = JSON.stringify(payload);

        try {
          const res = await new Promise<any>((resolve, reject) => {
            const options = {
              hostname: "fcm.googleapis.com",
              path: `/v1/projects/${projectId}/messages:send`,
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(postData),
              },
            };

            const req = https.request(options, (fcmRes) => {
              let resData = "";
              fcmRes.on("data", (chunk) => (resData += chunk));
              fcmRes.on("end", () => {
                resolve({ statusCode: fcmRes.statusCode, body: resData });
              });
            });

            req.on("error", reject);
            req.write(postData);
            req.end();
          });

          if (res.statusCode === 200) {
            successCount++;
          } else {
            failedCount++;
            // Token sudah expired / uninstalled
            if (res.body?.includes("UNREGISTERED") || res.body?.includes("INVALID_ARGUMENT")) {
              expiredTokens.push(token);
            }
          }
        } catch {
          failedCount++;
        }
      })
    );

    // Hapus token yang sudah expired secara otomatis
    if (expiredTokens.length > 0) {
      await supabaseAdmin.from("fcm_tokens").delete().in("token", expiredTokens);
    }

    return NextResponse.json({
      success: true,
      sentCount: successCount,
      failedCount,
      totalCount: tokens.length,
      message: `Berhasil mengirim ${successCount} notifikasi FCM ke perangkat pengguna.`,
    });
  } catch (err: any) {
    console.error("FCM Send API Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengirim push notification FCM" },
      { status: 500 }
    );
  }
}
