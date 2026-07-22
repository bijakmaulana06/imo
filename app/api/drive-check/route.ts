import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// Define Task list interface
export interface GroupTaskStatus {
  taskId: string;
  taskName: string;
  taskType: "kelompok" | "individu";
  isCompleted: boolean;
  driveLink?: string;
  fileName?: string;
  lastUpdated?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupName = searchParams.get("groupName") || searchParams.get("group") || "";

  if (!groupName) {
    return NextResponse.json(
      { error: "Parameter group/groupName (Nama Kelompok) wajib diisi." },
      { 
        status: 400,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=59"
        }
      }
    );
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // Daftar Tugas IMO 2026 yang dikontrol sistem
  const taskDefinitions = [
    { id: "task-1", name: "Video Yel-Yel Kelompok", type: "kelompok" as const, keyword: "yel-yel" },
    { id: "task-2", name: "Dokumen Jargon & Tagline", type: "kelompok" as const, keyword: "jargon" },
    { id: "task-3", name: "Rekaman Gerakan Flashmob", type: "kelompok" as const, keyword: "flashmob" },
    { id: "task-4", name: "Berkas Pengunggah Tugas Kelompok", type: "kelompok" as const, keyword: "tugas" },
    { id: "task-5", name: "ID Card & Twibbon (Individu)", type: "individu" as const, keyword: "idcard" },
  ];

  // Jika Kredensial Google Drive API sudah ada di .env.local
  if (clientEmail && privateKey && folderId) {
    try {
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });

      const drive = google.drive({ version: "v3", auth });

      // 1. Cari folder kelompok di dalam Parent Folder IMO 2026
      const groupFolderRes = await drive.files.list({
        q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name contains '${groupName}' and trashed = false`,
        fields: "files(id, name, webViewLink)",
      });

      const groupFolders = groupFolderRes.data.files || [];
      const targetGroupFolder = groupFolders[0];

      if (!targetGroupFolder || !targetGroupFolder.id) {
        // Folder kelompok belum dibuat atau belum ada berkas sama sekali
        const pendingStatus: GroupTaskStatus[] = taskDefinitions.map((t) => ({
          taskId: t.id,
          taskName: t.name,
          taskType: t.type,
          isCompleted: false,
        }));

        return NextResponse.json({
          groupName,
          folderFound: false,
          isRealDrive: true,
          tasks: pendingStatus,
        });
      }

      // 2. Jika folder kelompok ditemukan, baca semua berkas di dalam folder kelompok tersebut
      const filesRes = await drive.files.list({
        q: `'${targetGroupFolder.id}' in parents and trashed = false`,
        fields: "files(id, name, webViewLink, modifiedTime)",
      });

      const files = filesRes.data.files || [];

      // 3. Cocokkan setiap tugas dengan berkas yang ada
      const scannedTasks: GroupTaskStatus[] = taskDefinitions.map((t) => {
        if (t.type === "individu") {
          return {
            taskId: t.id,
            taskName: t.name,
            taskType: t.type,
            isCompleted: true,
            driveLink: "/id-card",
            fileName: "Dibuat via Client-Side Generator",
          };
        }

        const foundFile = files.find(
          (f) =>
            f.name?.toLowerCase().includes(t.keyword) ||
            f.name?.toLowerCase().includes(groupName.toLowerCase())
        );

        return {
          taskId: t.id,
          taskName: t.name,
          taskType: t.type,
          isCompleted: !!foundFile,
          driveLink: foundFile?.webViewLink || targetGroupFolder.webViewLink || undefined,
          fileName: foundFile?.name || undefined,
          lastUpdated: foundFile?.modifiedTime || undefined,
        };
      });

      return NextResponse.json({
        groupName,
        folderFound: true,
        folderLink: targetGroupFolder.webViewLink,
        isRealDrive: true,
        tasks: scannedTasks,
      });

    } catch (err: any) {
      console.error("Google Drive API Error:", err);
      return NextResponse.json(
        { error: "Gagal terhubung ke Google Drive API: " + err.message },
        { status: 500 }
      );
    }
  }

  // FALLBACK DEMO MODE (Jika Service Account belum dimasukkan di .env.local)
  // Simulasi berdasarkan angka kelompok untuk keperluan pengujian visual pengguna
  const isDemoCompleted = groupName.toLowerCase().includes("1") || groupName.toLowerCase().includes("demo");

  const demoTasks: GroupTaskStatus[] = taskDefinitions.map((t, idx) => ({
    taskId: t.id,
    taskName: t.name,
    taskType: t.type,
    isCompleted: t.type === "individu" ? true : idx % 2 === 0 ? isDemoCompleted : false,
    driveLink: isDemoCompleted ? "https://drive.google.com" : undefined,
    fileName: isDemoCompleted ? `${t.name}_${groupName}.pdf` : undefined,
    lastUpdated: new Date().toISOString(),
  }));

  return NextResponse.json({
    groupName,
    folderFound: isDemoCompleted,
    isRealDrive: false,
    demoNotice: "Google Drive Service Account belum disetel di .env.local. Menampilkan mode simulasi.",
    tasks: demoTasks,
  });
}
