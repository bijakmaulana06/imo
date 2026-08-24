import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET_NAME } from "@/lib/r2";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, key);
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
      const storagePath = t.layout_json?.storage_path;
      if (storagePath) {
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

    return NextResponse.json({ templates: formattedData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch templates" }, { status: 500 });
  }
}

// POST: Admin upload a new PSD template
export async function POST(req: Request) {
  try {
    const supabase = getAdminSupabase();

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

    // 1. Upload PSD file to Supabase Storage bucket 'idcard_templates'
    const sanitizeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const filePath = `idcard-psd/${Date.now()}_${sanitizeName}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const contentType = file.type || "application/octet-stream";

    try {
      const s3Client = getR2Client();
      await s3Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: filePath,
          Body: fileBuffer,
          ContentType: contentType,
        })
      );
    } catch (storageError: any) {
      console.error("R2 Storage Upload Error:", storageError);
      return NextResponse.json(
        { error: `Gagal mengunggah file ke Storage R2: ${storageError.message}` },
        { status: 500 }
      );
    }

    // 2. Get Proxy URL for the uploaded file
    const publicPsdUrl = `/api/id-card-templates/file?key=${encodeURIComponent(filePath)}`;

    // 3. If set as default, reset other defaults first
    if (isDefault) {
      await supabase.from("id_card_templates").update({ is_default: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    }

    // 4. Insert template record into id_card_templates table
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

    if (template?.layout_json?.storage_path) {
      try {
        const s3Client = getR2Client();
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: template.layout_json.storage_path,
          })
        );
      } catch (err) {
        console.error("Failed to delete from R2", err);
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
