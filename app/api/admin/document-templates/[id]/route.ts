import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, serviceKey);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ error: "ID template wajib disertakan" }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("document_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Template dokumen tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/admin/document-templates/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal mengambil data template" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID template wajib disertakan" }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      description,
      fields_config,
      file_url,
      file_path,
      is_active,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Judul template tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (!Array.isArray(fields_config) || fields_config.length === 0) {
      return NextResponse.json(
        { error: "Minimal harus ada 1 konfigurasi field/tag" },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, any> = {
      title: title.trim(),
      description: description || "",
      fields_config,
      updated_at: new Date().toISOString(),
    };

    if (file_url) updatePayload.file_url = file_url;
    if (file_path) updatePayload.file_path = file_path;
    if (typeof is_active === "boolean") updatePayload.is_active = is_active;

    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("document_templates")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update template DB error:", error);
      return NextResponse.json(
        { error: `Gagal memperbarui template: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Template berhasil diperbarui", data },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("PUT /api/admin/document-templates/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memperbarui data template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID template wajib disertakan" }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { error } = await supabase.from("document_templates").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: `Gagal menghapus template: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Template berhasil dihapus" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE /api/admin/document-templates/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menghapus data template" },
      { status: 500 }
    );
  }
}
