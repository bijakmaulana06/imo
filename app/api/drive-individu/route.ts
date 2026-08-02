import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/utils/supabase/server";

export interface IndividuFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
}

export interface IndividuTaskDef {
  id: string;
  name: string;
  keyword: string;
  is_active: boolean;
  deadline?: string;
}

export interface PersonTaskStatus {
  taskId: string;
  taskName: string;
  isCompleted: boolean;
  fileId?: string;
  fileName?: string;
  driveLink?: string;
  mimeType?: string;
  size?: string;
  modifiedTime?: string;
}

export interface PersonGroupedData {
  personName: string;
  submittedCount: number;
  totalRequired: number;
  completionPercentage: number;
  tasks: PersonTaskStatus[];
  allFiles: IndividuFileItem[];
}

function extractFolderId(inputStr?: string | null): string {
  if (!inputStr) return "";
  const match = inputStr.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return inputStr.trim();
}

// Helper untuk mengekstrak Nama Orang dari Nama File
function extractPersonName(filename: string, taskDefs: IndividuTaskDef[]): string {
  // 1. Hapus ekstensi file
  let nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  
  // 2. Ganti separator _ dan - dengan spasi
  let cleaned = nameWithoutExt.replace(/[_]/g, " ").replace(/-/g, " ");

  // 3. Hapus kata kunci tugas dari nama file
  taskDefs.forEach((t) => {
    if (t.keyword) {
      const regKw = new RegExp(t.keyword, "gi");
      cleaned = cleaned.replace(regKw, "");
    }
    if (t.name) {
      const regName = new RegExp(t.name, "gi");
      cleaned = cleaned.replace(regName, "");
    }
  });

  // 4. Hapus kata-kata umum seperti Kelompok X, Tugas, Berkas, dll.
  cleaned = cleaned
    .replace(/kelompok\s*\d+/gi, "")
    .replace(/tugas/gi, "")
    .replace(/berkas/gi, "")
    .replace(/dokumen/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Kapitalisasi Nama
  if (cleaned.length >= 2) {
    return cleaned
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  // Fallback jika tidak terdeteksi spesifik
  const parts = nameWithoutExt.split(/[-_]/);
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }

  return "Anggota (Tidak Teridentifikasi)";
}

const CACHE_TTL_MS = 5 * 60 * 1000; // Cache 5 menit

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const groupName = searchParams.get("groupName") || searchParams.get("group") || "";
  const forceRefresh = searchParams.get("refresh") === "true";

  if (!groupName) {
    return NextResponse.json(
      { error: "Parameter group/groupName wajib diisi." },
      { status: 400 }
    );
  }

  const cacheKey = `drive_cache_individu_${groupName.toLowerCase().replace(/\s+/g, "_")}`;
  let supabase: any = null;

  try {
    supabase = await createClient();
  } catch (err) {
    console.warn("Notice: Failed to initialize Supabase client for caching:", err);
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

  let targetMembersCount = 10;
  let taskDefs: IndividuTaskDef[] = [
    { id: "ind-1", name: "Jurnal Harian & Resume", keyword: "jurnal", is_active: true },
    { id: "ind-2", name: "Berkas Administrasi Mandiri", keyword: "administrasi", is_active: true },
    { id: "ind-3", name: "Twibbon & ID Card", keyword: "twibbon", is_active: true },
  ];

  if (supabase) {
    try {
      const { data: settingData } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", ["gdrive_parent_folder", "target_members_per_group", "task_definitions_individu"]);

      if (settingData && settingData.length > 0) {
        const folderSetting = settingData.find((s: any) => s.key === "gdrive_parent_folder");
        if (folderSetting && folderSetting.value) {
          const extractedId = extractFolderId(folderSetting.value);
          if (extractedId) folderId = extractedId;
        }

        const membersSetting = settingData.find((s: any) => s.key === "target_members_per_group");
        if (membersSetting && membersSetting.value && !isNaN(Number(membersSetting.value))) {
          targetMembersCount = Number(membersSetting.value);
        }

        const individuTasksSetting = settingData.find((s: any) => s.key === "task_definitions_individu");
        if (individuTasksSetting && individuTasksSetting.value) {
          try {
            const parsedDefs = JSON.parse(individuTasksSetting.value);
            if (Array.isArray(parsedDefs) && parsedDefs.length > 0) {
              taskDefs = parsedDefs.filter((t: any) => t.is_active !== false);
            }
          } catch {}
        }
      }
    } catch (dbErr) {
      console.warn("Notice: Fetching settings from DB failed, using default env.", dbErr);
    }
  }

  // Jika Google Drive Service Account siap
  if (clientEmail && privateKey && folderId) {
    try {
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      const drive = google.drive({ version: "v3", auth });

      // 1. Cari folder kelompok di parent folder
      const groupFolderRes = await drive.files.list({
        q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name contains '${groupName}' and trashed = false`,
        fields: "files(id, name, webViewLink)",
      });

      const groupFolders = groupFolderRes.data.files || [];
      let targetGroupFolder = groupFolders[0];

      if (!targetGroupFolder || !targetGroupFolder.id) {
        try {
          const newGroupFolderRes = await drive.files.create({
            requestBody: {
              name: groupName,
              mimeType: "application/vnd.google-apps.folder",
              parents: [folderId],
            },
            fields: "id, name, webViewLink",
          });
          targetGroupFolder = newGroupFolderRes.data;
        } catch (createGroupErr) {
          console.warn("Gagal membuat folder kelompok otomatis:", createGroupErr);
        }
      }

      if (!targetGroupFolder || !targetGroupFolder.id) {
        const resData = {
          groupName,
          folderFound: false,
          individuFolderFound: false,
          taskDefinitions: taskDefs,
          persons: [],
          files: [],
          summary: { targetMembers: targetMembersCount, submittedPersonsCount: 0, completionPercentage: 0 }
        };
        return NextResponse.json(resData);
      }

      // 2. Cari subfolder 'Individu'
      const individuFolderRes = await drive.files.list({
        q: `'${targetGroupFolder.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and (name = 'Individu' or name = 'individu') and trashed = false`,
        fields: "files(id, name, webViewLink)",
      });

      let individuFolder = (individuFolderRes.data.files || [])[0];

      if (!individuFolder || !individuFolder.id) {
        try {
          const newIndividuRes = await drive.files.create({
            requestBody: {
              name: "Individu",
              mimeType: "application/vnd.google-apps.folder",
              parents: [targetGroupFolder.id],
            },
            fields: "id, name, webViewLink",
          });
          individuFolder = newIndividuRes.data;
        } catch (createIndividuErr) {
          console.warn(`Gagal membuat folder "Individu" otomatis di ${groupName}:`, createIndividuErr);
        }
      }

      if (!individuFolder || !individuFolder.id) {
        const resData = {
          groupName,
          groupFolderLink: targetGroupFolder.webViewLink,
          folderFound: true,
          individuFolderFound: false,
          taskDefinitions: taskDefs,
          persons: [],
          files: [],
          summary: { targetMembers: targetMembersCount, submittedPersonsCount: 0, completionPercentage: 0 }
        };
        return NextResponse.json(resData);
      }

      // 3. Ambil semua berkas di folder 'Individu'
      const filesRes = await drive.files.list({
        q: `'${individuFolder.id}' in parents and trashed = false`,
        fields: "files(id, name, mimeType, webViewLink, modifiedTime, size)",
        orderBy: "name asc"
      });

      const filesList: IndividuFileItem[] = (filesRes.data.files || []).map((f) => ({
        id: f.id || "",
        name: f.name || "File Tanpa Nama",
        mimeType: f.mimeType || "application/octet-stream",
        webViewLink: f.webViewLink || undefined,
        modifiedTime: f.modifiedTime || undefined,
        size: f.size || undefined
      }));

      // 4. KELOMPOKKAN FILE BERDASARKAN NAMA ANGGOTA (PERSON)
      const personMap = new Map<string, IndividuFileItem[]>();

      filesList.forEach((file) => {
        const personName = extractPersonName(file.name, taskDefs);
        if (!personMap.has(personName)) {
          personMap.set(personName, []);
        }
        personMap.get(personName)!.push(file);
      });

      // 5. EVALUASI DEFINISI TUGAS KELOMPOK UNTUK TIAP ORANG
      const groupedPersons: PersonGroupedData[] = Array.from(personMap.entries()).map(([personName, userFiles]) => {
        let submittedCount = 0;
        const taskStatuses: PersonTaskStatus[] = taskDefs.map((def) => {
          const matchedFile = userFiles.find((f) =>
            f.name.toLowerCase().includes(def.keyword.toLowerCase()) ||
            f.name.toLowerCase().includes(def.name.toLowerCase())
          );

          if (matchedFile) {
            submittedCount++;
            return {
              taskId: def.id,
              taskName: def.name,
              isCompleted: true,
              fileId: matchedFile.id,
              fileName: matchedFile.name,
              driveLink: matchedFile.webViewLink,
              mimeType: matchedFile.mimeType,
              size: matchedFile.size,
              modifiedTime: matchedFile.modifiedTime
            };
          }

          return {
            taskId: def.id,
            taskName: def.name,
            isCompleted: false
          };
        });

        const completionPct = Math.round((submittedCount / (taskDefs.length || 1)) * 100);

        return {
          personName,
          submittedCount,
          totalRequired: taskDefs.length,
          completionPercentage: completionPct,
          tasks: taskStatuses,
          allFiles: userFiles
        };
      });

      const submittedPersonsCount = groupedPersons.length;
      const groupCompletionPercentage = Math.min(100, Math.round((submittedPersonsCount / (targetMembersCount || 1)) * 100));

      const finalResponseData = {
        groupName,
        groupFolderLink: targetGroupFolder.webViewLink,
        individuFolderLink: individuFolder.webViewLink,
        folderFound: true,
        individuFolderFound: true,
        taskDefinitions: taskDefs,
        persons: groupedPersons,
        files: filesList,
        totalFiles: filesList.length,
        summary: {
          targetMembers: targetMembersCount,
          submittedPersonsCount,
          completionPercentage: groupCompletionPercentage
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
      console.error("Google Drive API Error (Individu):", err);

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
        { error: "Gagal memindai folder Individu: " + err.message },
        { status: 500 }
      );
    }
  }

  // FALLBACK DEMO MODE DENGAN PENGELOMPOKAN ANGGOTA (PERSON TREE)
  const demoPersons: PersonGroupedData[] = [
    {
      personName: "Ahmad Fauzi",
      submittedCount: 2,
      totalRequired: taskDefs.length,
      completionPercentage: 67,
      tasks: [
        { taskId: taskDefs[0]?.id || "1", taskName: taskDefs[0]?.name || "Jurnal Harian", isCompleted: true, fileName: `Jurnal_Harian_Ahmad_Fauzi.pdf`, driveLink: "https://drive.google.com", mimeType: "application/pdf", size: "1200000" },
        { taskId: taskDefs[1]?.id || "2", taskName: taskDefs[1]?.name || "Resume Materi", isCompleted: true, fileName: `Resume_Materi_Ahmad_Fauzi.pdf`, driveLink: "https://drive.google.com", mimeType: "application/pdf", size: "950000" },
        { taskId: taskDefs[2]?.id || "3", taskName: taskDefs[2]?.name || "Twibbon & ID Card", isCompleted: false }
      ],
      allFiles: [
        { id: "d1", name: `Jurnal_Harian_Ahmad_Fauzi.pdf`, mimeType: "application/pdf", webViewLink: "https://drive.google.com", size: "1200000" },
        { id: "d2", name: `Resume_Materi_Ahmad_Fauzi.pdf`, mimeType: "application/pdf", webViewLink: "https://drive.google.com", size: "950000" }
      ]
    },
    {
      personName: "Budi Santoso",
      submittedCount: 3,
      totalRequired: taskDefs.length,
      completionPercentage: 100,
      tasks: [
        { taskId: taskDefs[0]?.id || "1", taskName: taskDefs[0]?.name || "Jurnal Harian", isCompleted: true, fileName: `Jurnal_Harian_Budi_Santoso.pdf`, driveLink: "https://drive.google.com", mimeType: "application/pdf", size: "1500000" },
        { taskId: taskDefs[1]?.id || "2", taskName: taskDefs[1]?.name || "Resume Materi", isCompleted: true, fileName: `Resume_Materi_Budi_Santoso.pdf`, driveLink: "https://drive.google.com", mimeType: "application/pdf", size: "890000" },
        { taskId: taskDefs[2]?.id || "3", taskName: taskDefs[2]?.name || "Twibbon & ID Card", isCompleted: true, fileName: `Twibbon_Budi_Santoso.png`, driveLink: "https://drive.google.com", mimeType: "image/png", size: "2100000" }
      ],
      allFiles: [
        { id: "d3", name: `Jurnal_Harian_Budi_Santoso.pdf`, mimeType: "application/pdf", webViewLink: "https://drive.google.com", size: "1500000" },
        { id: "d4", name: `Resume_Materi_Budi_Santoso.pdf`, mimeType: "application/pdf", webViewLink: "https://drive.google.com", size: "890000" },
        { id: "d5", name: `Twibbon_Budi_Santoso.png`, mimeType: "image/png", webViewLink: "https://drive.google.com", size: "2100000" }
      ]
    }
  ];

  const demoSubmittedPersons = demoPersons.length;
  const demoCompletion = Math.min(100, Math.round((demoSubmittedPersons / targetMembersCount) * 100));

  return NextResponse.json({
    groupName,
    groupFolderLink: "https://drive.google.com",
    individuFolderLink: "https://drive.google.com",
    folderFound: true,
    individuFolderFound: true,
    isDemoMode: true,
    taskDefinitions: taskDefs,
    persons: demoPersons,
    files: demoPersons.flatMap((p) => p.allFiles),
    totalFiles: demoPersons.reduce((acc, p) => acc + p.allFiles.length, 0),
    summary: {
      targetMembers: targetMembersCount,
      submittedPersonsCount: demoSubmittedPersons,
      completionPercentage: demoCompletion
    }
  });
}
