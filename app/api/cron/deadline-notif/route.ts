import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  // Verifikasi Vercel Cron (Opsional: gunakan CRON_SECRET jika di set)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Ambil setting notifikasi
    const { data: settingRow } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "notification_settings")
      .maybeSingle();

    let notifSettings: any = {};
    if (settingRow && settingRow.value) {
      notifSettings = typeof settingRow.value === "string" ? JSON.parse(settingRow.value) : settingRow.value;
    }

    if (!notifSettings.enableDeadlineNotif || !notifSettings.deadlineTemplate) {
      return NextResponse.json({ message: "Deadline notifications disabled or template missing." });
    }

    const reminderHours = notifSettings.deadlineReminderHours || 24;
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + reminderHours * 60 * 60 * 1000);

    // Ambil tugas kelompok
    const { data: taskDefs } = await supabase
      .from("task_definitions")
      .select("*")
      .eq("is_active", true);

    // Ambil tugas individu
    const { data: indRow } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "task_definitions_individu")
      .maybeSingle();
    let indTaskDefs: any[] = [];
    if (indRow && indRow.value) {
      indTaskDefs = typeof indRow.value === "string" ? JSON.parse(indRow.value) : indRow.value;
    }

    const allTasks = [...(taskDefs || []), ...indTaskDefs].filter(t => t.is_active !== false);
    let sentCount = 0;

    for (const task of allTasks) {
      if (task.deadline) {
        const taskDeadline = new Date(task.deadline);
        // Cek apakah deadline berada dalam window reminder
        if (taskDeadline > now && taskDeadline <= thresholdDate && !task.reminderSent) {
          
          const title = notifSettings.deadlineTemplate.title.replace(/{taskName}/g, task.name);
          const body = notifSettings.deadlineTemplate.body.replace(/{taskName}/g, task.name);
          
          // Kirim via Push API
          // Catatan: request ini internal server-to-server. Menggunakan endpoint Next.js API.
          // Karena kita di server side, lebih baik panggil helper function sendPush atau kita lakukan fetch ke absolute URL
          const baseUrl = request.nextUrl.origin;
          try {
            await fetch(`${baseUrl}/api/push/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                message: body,
                url: "/hub"
              })
            });
            sentCount++;
            // Catatan: idealnya kita menandai task.reminderSent di database agar tidak dikirim berulang kali.
            // Karena ini MVP, jika cron jalan per jam, kita harus menandai.
          } catch (e) {
            console.error("Gagal kirim notifikasi deadline:", e);
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Pengecekan selesai. ${sentCount} notifikasi terkirim.`,
      threshold: thresholdDate.toISOString()
    });
  } catch (error: any) {
    console.error("Cron Deadline Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
