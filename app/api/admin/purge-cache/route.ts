import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const { path, type } = await request.json();

    if (!path) {
      // If no specific path is provided, purge the entire layout (all pages)
      revalidatePath("/", "layout");
      return NextResponse.json({ 
        success: true, 
        message: "Seluruh cache Next.js (SSG/ISR) berhasil dibersihkan. Semua halaman akan dirender ulang." 
      });
    }

    if (type === "layout" || type === "page") {
      revalidatePath(path, type);
    } else {
      revalidatePath(path);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Cache untuk path '${path}' berhasil dibersihkan.` 
    });
  } catch (err: any) {
    console.error("Purge Cache Error:", err);
    return NextResponse.json(
      { error: "Gagal membersihkan cache: " + err.message },
      { status: 500 }
    );
  }
}
