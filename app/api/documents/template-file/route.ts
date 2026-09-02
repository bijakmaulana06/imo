import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json({ error: "Missing template id" }, { status: 400 });
    }

    const supabase = await createClient();

    // Ambil metadata template
    const { data: template, error: dbError } = await supabase
      .from("document_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (dbError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    let fileBuffer: Buffer | null = null;
    const targetUrl = template.file_url || template.file_path || "";

    if (targetUrl.startsWith("http")) {
      try {
        const res = await fetch(targetUrl);
        if (res.ok) {
          fileBuffer = Buffer.from(await res.arrayBuffer());
        }
      } catch (e) {
        console.warn("Direct HTTP fetch template URL failed, trying Supabase storage...", e);
      }
    }

    if (!fileBuffer) {
      let relativePath = template.file_path || targetUrl;
      if (targetUrl.includes("/templates/")) {
        relativePath = targetUrl.split("/templates/").pop() || relativePath;
      } else if (targetUrl.includes("/document_templates/")) {
        relativePath = targetUrl.split("/document_templates/").pop() || relativePath;
      }

      let { data: fileData, error: downloadError } = await supabase.storage
        .from("templates")
        .download(relativePath);

      if ((downloadError || !fileData) && targetUrl.includes("document_templates")) {
        const altRes = await supabase.storage
          .from("document_templates")
          .download(relativePath);
        if (altRes.data) {
          fileData = altRes.data;
          downloadError = null;
        }
      }

      if (fileData) {
        fileBuffer = Buffer.from(await fileData.arrayBuffer());
      }
    }

    if (!fileBuffer) {
      return NextResponse.json(
        { error: "Could not retrieve docx file binary" },
        { status: 500 }
      );
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (err: any) {
    console.error("Template file fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
