import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET_NAME } from "@/lib/r2";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
}

function sortTemplatesNatural<T extends { name: string }>(items: T[]): T[] {
  const extractNum = (str: string) => {
    const kMatch = str.match(/kelompok\s*(\d+)/i);
    if (kMatch) return parseInt(kMatch[1], 10);

    const allMatches = str.match(/\d+/g);
    if (allMatches && allMatches.length > 0) {
      if (allMatches.length > 1 && allMatches[0] === '2026') {
        return parseInt(allMatches[1], 10);
      }
      return parseInt(allMatches[allMatches.length - 1], 10);
    }
    return Number.MAX_SAFE_INTEGER;
  };

  return [...items].sort((a, b) => {
    const numA = extractNum(a.name);
    const numB = extractNum(b.name);

    if (numA !== numB) {
      return numA - numB;
    }

    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
}

// GET: Fetch list of ID card templates
export async function GET() {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("id_card_templates")
      .select("*")
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch templates DB error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedData = (data || []).map((t) => {
      // 1. If background_url is already a public HTTP/HTTPS URL (e.g. Supabase Storage CDN), use it directly!
      if (t.background_url && (t.background_url.startsWith("http://") || t.background_url.startsWith("https://"))) {
        return {
          ...t,
          layout_json: {
            ...t.layout_json,
            psd_url: t.background_url,
          },
        };
      }

      const storagePath = t.layout_json?.storage_path;
      if (storagePath) {
        // 2. If it's stored in Supabase Storage, retrieve direct public CDN URL
        if (t.layout_json?.storage_type === "supabase" || storagePath.startsWith("idcard-psd/")) {
          const { data: pubUrl } = supabase.storage.from("idcard_templates").getPublicUrl(storagePath);
          return {
            ...t,
            background_url: pubUrl.publicUrl,
            layout_json: {
              ...t.layout_json,
              psd_url: pubUrl.publicUrl,
            },
          };
        }

        // 3. Legacy fallback: R2 proxy
        const proxyUrl = `/api/id-card-templates/file?key=${encodeURIComponent(storagePath)}`;
        return {
          ...t,
          background_url: proxyUrl,
          layout_json: {
            ...t.layout_json,
            psd_url: proxyUrl,
          },
        };
      }
      return t;
    });

    const sortedData = sortTemplatesNatural(formattedData);
    return NextResponse.json({ templates: sortedData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch templates" }, { status: 500 });
  }
}

// POST: Admin save a new PSD template (supports both JSON direct upload & multipart fallback)
export async function POST(req: Request) {
  try {
    const supabase = getAdminSupabase();
    const contentTypeHeader = req.headers.get("content-type") || "";

    // CASE A: Client performed direct storage upload and is posting JSON metadata
    if (contentTypeHeader.includes("application/json")) {
      const body = await req.json();
      const { name, description, is_default, is_active, background_url, layout_json } = body;

      const publicUrl = background_url || layout_json?.psd_url;
      if (!publicUrl) {
        return NextResponse.json({ error: "URL file templat PSD wajib disertakan." }, { status: 400 });
      }

      const isActive = is_active !== false;
      const isDefault = is_default === true;

      // If set as default, reset other defaults first
      if (isDefault) {
        await supabase
          .from("id_card_templates")
          .update({ is_default: false })
          .neq("id", "00000000-0000-0000-0000-000000000000");
      }

      const { data: inserted, error: insertError } = await supabase
        .from("id_card_templates")
        .insert([
          {
            name: name || "Template ID Card PSD",
            description: description || "",
            background_url: publicUrl,
            layout_json: {
              ...layout_json,
              psd_url: publicUrl,
              storage_type: "supabase",
              uploaded_at: layout_json?.uploaded_at || new Date().toISOString(),
            },
            is_active: isActive,
            is_default: isDefault,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error("DB Insert Error:", insertError);
        return NextResponse.json({ error: `Gagal menyimpan ke database: ${insertError.message}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, template: inserted });
    }

    // CASE B: Legacy multipart/form-data upload fallback
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || "Template ID Card PSD";
    const description = (formData.get("description") as string) || "";
    const isActive = formData.get("is_active") !== "false";
    const isDefault = formData.get("is_default") === "true";

    if (!file) {
      return NextResponse.json({ error: "File .PSD wajib diunggah." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".psd")) {
      return NextResponse.json({ error: "File harus berformat .PSD (Photoshop Document)." }, { status: 400 });
    }

    const sanitizeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const filePath = `idcard-psd/${Date.now()}_${sanitizeName}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const contentType = file.type || "image/vnd.adobe.photoshop";

    // Upload to Supabase Storage bucket 'idcard_templates'
    const { error: uploadError } = await supabase.storage
      .from("idcard_templates")
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      return NextResponse.json(
        { error: `Gagal mengunggah file ke Supabase Storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("idcard_templates")
      .getPublicUrl(filePath);

    const publicPsdUrl = publicUrlData.publicUrl;

    if (isDefault) {
      await supabase
        .from("id_card_templates")
        .update({ is_default: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");
    }

    const { data: inserted, error: insertError } = await supabase
      .from("id_card_templates")
      .insert([
        {
          name,
          description,
          background_url: publicPsdUrl,
          layout_json: {
            psd_url: publicPsdUrl,
            file_name: file.name,
            storage_path: filePath,
            storage_type: "supabase",
            uploaded_at: new Date().toISOString(),
          },
          is_active: isActive,
          is_default: isDefault,
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("DB Insert Error:", insertError);
      return NextResponse.json({ error: `Gagal menyimpan ke database: ${insertError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, template: inserted });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Gagal memproses templat PSD" }, { status: 500 });
  }
}

// DELETE: Remove a template
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID templat wajib disertakan" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    // Fetch storage path if available to clean up file
    const { data: template } = await supabase
      .from("id_card_templates")
      .select("layout_json")
      .eq("id", id)
      .single();

    const storagePath = template?.layout_json?.storage_path;
    if (storagePath) {
      // 1. Remove from Supabase Storage bucket 'idcard_templates'
      try {
        await supabase.storage.from("idcard_templates").remove([storagePath]);
      } catch (sbErr) {
        console.warn("Failed to remove from Supabase Storage:", sbErr);
      }

      // 2. Remove from R2 if legacy template was stored there
      try {
        const s3Client = getR2Client();
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: storagePath,
          })
        );
      } catch (r2Err) {
        // Ignore if file doesn't exist in R2
      }
    }

    const { error } = await supabase.from("id_card_templates").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menghapus templat" }, { status: 500 });
  }
}

// PATCH: Toggle active status or default status
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, is_active, is_default } = body;

    if (!id) {
      return NextResponse.json({ error: "ID templat wajib disertakan" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    if (is_default) {
      await supabase.from("id_card_templates").update({ is_default: false }).neq("id", id);
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof is_active === "boolean") updateData.is_active = is_active;
    if (typeof is_default === "boolean") updateData.is_default = is_default;

    const { data, error } = await supabase
      .from("id_card_templates")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, template: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memperbarui templat" }, { status: 500 });
  }
}
