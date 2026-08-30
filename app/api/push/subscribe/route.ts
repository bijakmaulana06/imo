/**
 * app/api/push/subscribe/route.ts
 * Endpoint kompatibilitas yang mengalihkan ke fcm_tokens
 */

import { NextRequest, NextResponse } from "next/server";
import { POST as saveFcmToken, DELETE as deleteFcmToken } from "@/app/api/push/fcm-token/route";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.token) {
      return saveFcmToken(request);
    }
    return NextResponse.json({ success: true, message: "Migrated to FCM tokens." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.token) {
      return deleteFcmToken(request);
    }
    return NextResponse.json({ success: true, message: "Unsubscribed." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
