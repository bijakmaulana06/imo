import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/utils/supabase/server";

export interface GroupTaskStatus {
  taskId: string;
  taskName: string;
  taskType: "kelompok" | "individu";
  isCompleted: boolean;
  driveLink?: string;
  fileName?: string;
  lastUpdated?: string;
  deadline?: string;
}

function extractFolderId(inputStr?: string | null): string {
  if (!inputStr) return "";
  const match = inputStr.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return inputStr.trim();
}

const CACHE_TTL_MS = 5 * 60 * 1000; // Cache 5 menit

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupName = searchParams.get("groupName") || searchParams.get("group") || "";
  const forceRefresh = searchParams.get("refresh") === "true";

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

  const cacheKey = `drive_cache_kelompok_${groupName.toLowerCase().replace(/\s+/g, "_")}`;
  let supabase: any = null;

  try {
    supabase = await createClient();
  } catch (err) {
    console.warn("Notice: Failed initializing Supabase for caching:", err);
  }

  // 1. CEK CACHE SUPABASE SANGAT CEPAT (jika tidak force refresh)
  if (supabase && !forceRefresh) {
    try {
      const { data: cachedRow } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", cacheKey)
        .maybeSingle();

      if (cachedRow && cachedRow.value) {
        const parsed = typeof cachedRow.value === "string" ? JSON.parse(cachedRow.value) : cachedRow.value;
        const cacheAge = Date.now() - (parsed.cachedAt || 0);

        if (cacheAge < CACHE_TTL_MS && parsed.data) {
          return NextResponse.json({
            ...parsed.data,
            isCached: true,
            cacheAgeSeconds: Math.round(cacheAge / 1000)
          }, {
            headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" }
          });
        }
      }
    } catch (cacheErr) {
      console.warn("Failed reading Supabase cache:", cacheErr);
    }
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

  let taskDefinitions: { id: string; name: string; type: "kelompok" | "individu"; keyword: string; deadline?: string }[] = [];

  if (supabase) {
    try {
      const { data: settingData } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "gdrive_parent_folder")
        .maybeSingle();

      if (settingData && settingData.value) {
        const extractedId = extractFolderId(settingData.value);
        if (extractedId) {
          folderId = extractedId;
        }
      }

      const { data: tasksData } = await supabase
        .from("task_definitions")
        .select("id, name, keyword, is_active, deadline")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (tasksData && tasksData.length > 0) {
        taskDefinitions = tasksData.map((t: any) => ({
          id: t.id,
          name: t.name,
          type: "kelompok" as const,
          keyword: t.keyword.toLowerCase(),
          deadline: t.deadline || undefined,
        }));
      }
    } catch (dbErr) {
      console.warn("Notice: Fetching dynamic tasks/settings from DB failed, using defaults.", dbErr);
    }
  }

  // Jika Kredensial Google Drive API sudah ada
  if (clientEmail && privateKey && folderId) {
    try {
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      const drive = google.drive({ version: "v3", auth });

      // 1. Cari folder kelompok di dalam Parent Folder
      const groupFolderRes = await drive.files.list({
        q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name contains '${groupName}' and trashed = false`,
        fields: "files(id, name, webViewLink)",
      });

      const groupFolders = groupFolderRes.data.files || [];
      let targetGroupFolder = groupFolders[0];

      if (!targetGroupFolder || !targetGroupFolder.id) {
        try {
          const newFolderRes = await drive.files.create({
            requestBody: {
              name: groupName,
              mimeType: "application/vnd.google-apps.folder",
              parents: [folderId],
            },
            fields: "id, name, webViewLink",
          });
          targetGroupFolder = newFolderRes.data;
        } catch (createErr) {
          console.warn("Gagal membuat folder kelompok baru di Google Drive:", createErr);
        }
      }

      if (!targetGroupFolder || !targetGroupFolder.id) {
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
          summary: { completed: 0, total: pendingStatus.length }
        });
      }

      // 2. Baca semua berkas di dalam folder kelompok
      const filesRes = await drive.files.list({
        q: `'${targetGroupFolder.id}' in parents and trashed = false`,
        fields: "files(id, name, webViewLink, modifiedTime)",
      });

      const files = filesRes.data.files || [];

      // 3. Cocokkan setiap tugas dengan berkas yang ada
      let completedCount = 0;
      const scannedTasks: GroupTaskStatus[] = taskDefinitions.map((t) => {
        if (t.type === "individu") {
          completedCount++;
          return {
            taskId: t.id,
            taskName: t.name,
            taskType: t.type,
            isCompleted: true,
            driveLink: "/id-card",
            fileName: "Dibuat via Client-Side Generator",
          };
        }

        const foundFile = files.find((f) =>
          f.name?.toLowerCase().includes(t.keyword)
        );

        if (foundFile) {
          completedCount++;
        }

        return {
          taskId: t.id,
          taskName: t.name,
          taskType: t.type,
          isCompleted: !!foundFile,
          driveLink: foundFile?.webViewLink || targetGroupFolder.webViewLink || undefined,
          fileName: foundFile?.name || undefined,
          lastUpdated: foundFile?.modifiedTime || undefined,
          deadline: t.deadline,
        };
      });

      const finalResponseData = {
        groupName,
        folderFound: true,
        folderLink: targetGroupFolder.webViewLink,
        isRealDrive: true,
        tasks: scannedTasks,
        summary: {
          completed: completedCount,
          total: scannedTasks.length
        }
      };

      // SIMPAN KE CACHE SUPABASE
      if (supabase) {
        try {
          await supabase.from("system_settings").upsert(
            {
              key: cacheKey,
              value: JSON.stringify({
                cachedAt: Date.now(),
                data: finalResponseData
              })
            },
            { onConflict: "key" }
          );
        } catch (saveCacheErr) {
          console.warn("Notice: Failed saving cache to Supabase:", saveCacheErr);
        }
      }

      return NextResponse.json({
        ...finalResponseData,
        isCached: false
      });

    } catch (err: any) {
      console.error("Google Drive API Error:", err);

      // FALLBACK CACHE
      if (supabase) {
        try {
          const { data: cachedRow } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", cacheKey)
            .maybeSingle();

          if (cachedRow && cachedRow.value) {
            const parsed = typeof cachedRow.value === "string" ? JSON.parse(cachedRow.value) : cachedRow.value;
            if (parsed.data) {
              return NextResponse.json({
                ...parsed.data,
                isCached: true,
                staleFallback: true
              });
            }
          }
        } catch {}
      }

      return NextResponse.json(
        { error: "Gagal terhubung ke Google Drive API: " + err.message },
        { status: 500 }
      );
    }
  }

  // Return clean empty result if Google Drive credentials are not active
  return NextResponse.json({
    groupName,
    folderFound: false,
    isRealDrive: false,
    tasks: [],
    summary: {
      completed: 0,
      total: 0
    }
  });
}
