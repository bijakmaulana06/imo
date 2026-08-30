import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@/utils/supabase/server";

function extractFolderId(inputStr?: string | null): string {
  if (!inputStr) return "";
  const match = inputStr.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return inputStr.trim();
}

export async function POST(request: NextRequest) {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

  let totalGroupsCount = 20;
  let groupPrefix = "Kelompok";

  try {
    const reqBody = await request.json();
    if (reqBody && typeof reqBody.totalGroups === "number" && reqBody.totalGroups > 0) {
      totalGroupsCount = reqBody.totalGroups;
    }
    if (reqBody && typeof reqBody.prefix === "string" && reqBody.prefix.trim()) {
      groupPrefix = reqBody.prefix.trim();
    }
  } catch {
    // Body is optional
  }

  try {
    const supabase = await createClient();

    // 1. Fetch system_settings for gdrive_parent_folder, total_groups_count & group_names
    const { data: settingData } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["gdrive_parent_folder", "total_groups_count", "group_names"]);

    let customGroupNamesMap: Record<string, string> = {};

    if (settingData && settingData.length > 0) {
      const gdriveSetting = settingData.find((s: any) => s.key === "gdrive_parent_folder");
      if (gdriveSetting && gdriveSetting.value) {
        const extractedId = extractFolderId(gdriveSetting.value);
        if (extractedId) {
          folderId = extractedId;
        }
      }

      const countSetting = settingData.find((s: any) => s.key === "total_groups_count");
      if (countSetting && countSetting.value && !isNaN(Number(countSetting.value))) {
        if (!request.body) {
          totalGroupsCount = Number(countSetting.value);
        }
      }

      const namesSetting = settingData.find((s: any) => s.key === "group_names");
      if (namesSetting && namesSetting.value) {
        try {
          customGroupNamesMap = typeof namesSetting.value === "string" ? JSON.parse(namesSetting.value) : namesSetting.value;
        } catch {}
      }
    }

    if (!clientEmail || !privateKey || !folderId) {
      return NextResponse.json(
        { error: "Kredensial Google Drive Service Account atau Parent Folder ID belum disetel." },
        { status: 400 }
      );
    }

    // 2. Build complete list of groups (using custom names formatted as "{namacustom} (Kelompok {nomor})")
    const groupNamesSet = new Set<string>();

    for (let i = 1; i <= totalGroupsCount; i++) {
      const rawCustom = customGroupNamesMap[String(i)] || customGroupNamesMap[`Kelompok ${i}`];
      let folderName = `${groupPrefix} ${i}`;

      if (rawCustom && rawCustom.trim()) {
        const trimmed = rawCustom.trim();
        if (new RegExp(`\\(${groupPrefix}\\s*${i}\\)`, "i").test(trimmed)) {
          folderName = trimmed;
        } else if (new RegExp(`\\b${groupPrefix}\\s*${i}\\b`, "i").test(trimmed)) {
          folderName = trimmed.replace(new RegExp(`\\s*\\(?${groupPrefix}\\s*${i}\\)?`, "i"), ` (${groupPrefix} ${i})`);
        } else if (new RegExp(`^${groupPrefix}\\s+\\d+$`, "i").test(trimmed)) {
          folderName = trimmed;
        } else {
          folderName = `${trimmed} (${groupPrefix} ${i})`;
        }
      }

      groupNamesSet.add(folderName);
    }

    const { data: contactsData } = await supabase
      .from("contact_persons")
      .select("group_name");

    if (contactsData && contactsData.length > 0) {
      contactsData.forEach((c: any) => {
        if (c.group_name) groupNamesSet.add(c.group_name.trim());
      });
    }

    const groupList = Array.from(groupNamesSet).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

    // 3. Connect to Google Drive API
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    // 4. List all existing subfolders in Parent Folder
    const existingFoldersRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name, webViewLink)",
      pageSize: 200,
    });

    const existingFolders = existingFoldersRes.data.files || [];

    let existingCount = 0;
    let createdCount = 0;
    const details: { groupName: string; status: "existing" | "created"; link?: string }[] = [];

    // 5. Loop through each group, create group folder & subfolder 'Individu' if missing
    for (const groupName of groupList) {
      let targetGroupFolder = existingFolders.find(
        (f) => f.name?.toLowerCase().trim() === groupName.toLowerCase().trim()
      );

      if (targetGroupFolder && targetGroupFolder.id) {
        existingCount++;
        details.push({
          groupName,
          status: "existing",
          link: targetGroupFolder.webViewLink || undefined,
        });
      } else {
        // Create new group folder
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
          createdCount++;
          details.push({
            groupName,
            status: "created",
            link: newFolderRes.data.webViewLink || undefined,
          });
        } catch (err: any) {
          console.error(`Gagal membuat folder untuk ${groupName}:`, err);
        }
      }

      // Pastikan subfolder 'Individu' juga ada di dalam folder kelompok tersebut
      if (targetGroupFolder && targetGroupFolder.id) {
        try {
          const checkIndividu = await drive.files.list({
            q: `'${targetGroupFolder.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and (name = 'Individu' or name = 'individu') and trashed = false`,
            fields: "files(id, name)",
          });

          if (!checkIndividu.data.files || checkIndividu.data.files.length === 0) {
            await drive.files.create({
              requestBody: {
                name: "Individu",
                mimeType: "application/vnd.google-apps.folder",
                parents: [targetGroupFolder.id],
              },
              fields: "id, name",
            });
          }
        } catch (subFolderErr) {
          console.warn(`Notice: Gagal memastikan folder Individu di ${groupName}:`, subFolderErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi folder selesai untuk ${groupList.length} kelompok (${groupPrefix} 1 - ${totalGroupsCount}). Sub-folder "Individu" dipastikan tersedia di semua kelompok.`,
      totalGroups: groupList.length,
      existingFoldersCount: existingCount,
      createdFoldersCount: createdCount,
      details,
    });
  } catch (err: any) {
    console.error("Sync Folders Error:", err);
    return NextResponse.json(
      { error: "Gagal melakukan sinkronisasi folder: " + err.message },
      { status: 500 }
    );
  }
}
