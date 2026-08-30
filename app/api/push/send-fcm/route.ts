import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import https from "https";
import crypto from "crypto";

// Helper untuk ambil Google OAuth2 Access Token menggunakan service account JSON
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, title, message, url } = body;

    if (!token) {
      return NextResponse.json({ error: "FCM token required." }, { status: 400 });
    }

    // Cari file service account di folder scripts/
    const scriptsDir = path.join(process.cwd(), "scripts");
    let serviceAccountFile = "";
    try {
      const files = fs.readdirSync(scriptsDir);
      const found = files.find(
        (f) => f.endsWith(".json") && (f.includes("firebase-adminsdk") || f.includes("serviceaccount"))
      );
      if (found) {
        serviceAccountFile = path.join(scriptsDir, found);
      }
    } catch {}

    if (!serviceAccountFile || !fs.existsSync(serviceAccountFile)) {
      return NextResponse.json(
        { error: "Service account JSON tidak ditemukan di folder scripts/." },
        { status: 500 }
      );
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountFile, "utf-8"));
    const accessToken = await getGoogleAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id || "imo-info";

    const payload = {
      message: {
        token,
        notification: {
          title: title || "Notifikasi IMO 2026",
          body: message || "Ada pesan baru dari sistem IMO 2026.",
        },
        webpush: {
          headers: {
            Urgency: "high",
          },
          notification: {
            title: title || "Notifikasi IMO 2026",
            body: message || "Ada pesan baru dari sistem IMO 2026.",
            icon: "/Brighton.svg",
            badge: "/Brighton.svg",
            requireInteraction: true,
            renotify: true,
            tag: "imo-fcm-direct-test",
          },
          fcm_options: {
            link: url || "/info",
          },
        },
        data: {
          url: url || "/info",
          title: title || "Notifikasi IMO 2026",
          body: message || "Ada pesan baru dari sistem IMO 2026.",
        },
      },
    };

    const postData = JSON.stringify(payload);

    const fcmRes = await new Promise<any>((resolve, reject) => {
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

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ statusCode: res.statusCode, data });
          }
        });
      });

      req.on("error", reject);
      req.write(postData);
      req.end();
    });

    if (fcmRes.statusCode === 200) {
      return NextResponse.json({
        success: true,
        messageId: fcmRes.data.name,
      });
    } else {
      return NextResponse.json(
        { error: fcmRes.data?.error?.message || "FCM send error", details: fcmRes.data },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
