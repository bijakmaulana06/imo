export type FieldType = "text" | "date" | "select" | "textarea" | "number";

export interface DocumentFieldConfig {
  id: string;
  tag: string; // Misal: "nama" -> nanti dicari {nama} di docx
  label: string; // Misal: "Nama Lengkap"
  type: FieldType;
  placeholder?: string;
  options?: string[]; // Jika type === 'select', daftar opsi dropdown
  rawOptions?: string; // Menyimpan string mentah yang sedang diketik user (termasuk koma)
  required?: boolean;
  defaultValue?: string;
}

export interface DocumentTemplate {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  fields_config: DocumentFieldConfig[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
