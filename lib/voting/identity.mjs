export function normalizeNim(input) {
  if (input === null || input === undefined) throw new Error("NIM tidak valid.");
  const value = String(input).trim().toUpperCase();
  if (!value) throw new Error("NIM tidak boleh kosong.");
  if (value.length > 64) throw new Error("NIM terlalu panjang (maksimal 64 karakter).");
  return value;
}

export function normalizeAccessCode(input) {
  if (typeof input !== "string") throw new Error("Kode akses tidak valid.");
  const value = input.trim();
  if (!/^[A-Za-z0-9_-]{24,128}$/.test(value)) throw new Error("Kode akses tidak valid.");
  return value;
}
