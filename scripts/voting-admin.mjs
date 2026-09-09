#!/usr/bin/env node
/** Run with server-side environment, e.g. node --env-file=.env.local scripts/voting-admin.mjs help. */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { closeSync, existsSync, fsyncSync, linkSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { userInfo } from "node:os";
import { generateAccessCode, hashAccessCode, hashNim } from "../lib/voting/crypto.mjs";

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseArgs(args) {
  const [command = "help", ...rest] = args;
  const options = {};
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i];
    const value = rest[i + 1];
    if (!/^--[a-z-]+$/.test(key) || !value || value.startsWith("--") || key.slice(2) in options) {
      throw new Error("Argumen harus berpasangan --nama nilai, tanpa pengulangan.");
    }
    options[key.slice(2)] = value;
  }
  return { command, options };
}

import { parseVoterCsv, validateElection, validateCandidates } from '../lib/voting/admin-input.mjs';
export { parseVoterCsv, validateElection, validateCandidates } from '../lib/voting/admin-input.mjs';

function onlyKeys(object, allowed, label) {
  if (!object || typeof object !== 'object' || Array.isArray(object) || Object.keys(object).some(key => !allowed.includes(key))) throw new Error(label + ' tidak valid.');
}

function required(options, name) {
  if (!options[name]) throw new Error(`Argumen --${name} wajib diisi.`);
  return options[name];
}

function uuid(value, label) {
  if (!uuidPattern.test(value ?? "")) throw new Error(`${label} harus berupa UUID.`);
  return value;
}

function readInput(path) {
  const data = readFileSync(resolve(path));
  if (data.byteLength > 5 * 1024 * 1024) throw new Error("Berkas input maksimal 5 MB.");
  return data.toString("utf8").replace(/^\uFEFF/, "");
}

function readJson(path) {
  try { return JSON.parse(readInput(path)); }
  catch { throw new Error("Berkas JSON tidak dapat dibaca atau formatnya tidak valid."); }
}

export function privateExportPath(input, repository = workspace) {
  if (!isAbsolute(input)) throw new Error("--export wajib berupa path absolut di luar repositori.");
  const parent = realpathSync(dirname(input));
  const output = join(parent, basename(input));
  const rel = relative(realpathSync(repository), output);
  if (!rel || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))) throw new Error("Ekspor kode akses harus berada di luar repositori, termasuk melalui symlink.");
  if (extname(output).toLowerCase() !== ".csv") throw new Error("Ekspor harus memakai ekstensi .csv.");
  try { lstatSync(output); throw new Error("Berkas ekspor sudah ada; gunakan nama baru agar kode lama tidak tertimpa."); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  return output;
}

function restrictWindowsAcl(path, directory = false) {
  if (process.platform !== "win32") return;
  const account = userInfo().username;
  execFileSync("icacls.exe", [path, "/inheritance:r", "/grant:r", `${account}:${directory ? "(OI)(CI)" : ""}F`], { windowsHide: true, stdio: "pipe" });
}

/** Restrict the empty staging directory before ever writing voter identities/codes. */
export function writePrivateExport(output, content) {
  const staging = join(dirname(output), `.voting-private-${randomUUID()}`);
  const stagedFile = join(staging, "codes.csv");
  mkdirSync(staging, { mode: 0o700 });
  try {
    restrictWindowsAcl(staging, true);
    const fd = openSync(stagedFile, "wx", 0o600);
    try {
      restrictWindowsAcl(stagedFile);
      writeFileSync(fd, content, "utf8");
      fsyncSync(fd);
    } finally { closeSync(fd); }
    // Hard link is atomic and refuses an existing target; the restricted file ACL is retained.
    linkSync(stagedFile, output);
  } finally {
    if (existsSync(stagedFile)) unlinkSync(stagedFile);
    rmdirSync(staging);
  }
}

function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia di environment server.");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname))) throw new Error("Supabase harus memakai HTTPS kecuali localhost.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function checked(result, operation) {
  if (result.error) {
    const explanation = result.error.code === "23505" ? "Data sudah ada atau melanggar batas unik. Tidak ada kode lama yang dirotasi." : "Periksa koneksi, migrasi, hak service role, dan validitas data.";
    throw new Error(`${operation} gagal. ${explanation}`);
  }
  return result.data;
}

export async function main(argv = process.argv.slice(2)) {
  const { command, options } = parseArgs(argv);
  if (command === "help") {
    console.log(`Administrasi voting (jalankan hanya di komputer panitia tepercaya):
  election --file election.json [--id UUID]
  candidates --election UUID --file candidates.json
  import-voters --election UUID --file pemilih.csv --export ABSOLUTE_PRIVATE_PATH.csv
  admin --user UUID
  help
Lihat docs/VOTING.md. Impor tidak pernah menimpa NIM/kode yang sudah terdaftar.
Service role dan VOTING_SECRET dibaca hanya dari environment, bukan argumen.`);
    return;
  }
  const allowedOptions = { election: ["file", "id"], candidates: ["election", "file"], "import-voters": ["election", "file", "export"], admin: ["user"] };
  if (!Object.hasOwn(allowedOptions, command)) throw new Error("Perintah tidak dikenal. Jalankan help.");
  onlyKeys(options, allowedOptions[command], "Argumen");
  const db = database();
  if (command === "election") {
    const input = validateElection(readJson(required(options, "file")), !!options.id);
    let result;
    if (options.id) {
      const id = uuid(options.id, "ID pemilihan");
      const previous = checked(await db.from("voting_elections").select("title,year,status,opens_at,closes_at,is_current").eq("id", id).single(), "Membaca pemilihan");
      validateElection({ ...previous, ...input });
      result = await db.from("voting_elections").update(input).eq("id", id).select("id,title,status").single();
    } else result = await db.from("voting_elections").insert(input).select("id,title,status").single();
    const election = checked(result, "Menyimpan pemilihan");
    console.log(`Pemilihan tersimpan: ${election.id} (${election.status}).`);
  } else if (command === "candidates") {
    const electionId = uuid(required(options, "election"), "ID pemilihan");
    const candidates = validateCandidates(readJson(required(options, "file")), electionId);
    checked(await db.from("voting_candidates").upsert(candidates, { onConflict: "election_id,number" }), "Menyimpan kandidat");
    console.log(`${candidates.length} kandidat tersimpan. Nomor yang tidak ada dalam berkas tidak diubah.`);
  } else if (command === "import-voters") {
    const electionId = uuid(required(options, "election"), "ID pemilihan");
    const nims = parseVoterCsv(readInput(required(options, "file")));
    const secret = process.env.VOTING_SECRET;
    // Validate secret before generating or exporting any voter code.
    hashNim(nims[0], secret);
    const output = privateExportPath(required(options, "export"));
    const election = checked(await db.from("voting_elections").select("id,status").eq("id", electionId).single(), "Membaca pemilihan");
    if (election.status !== "draft") throw new Error("Impor hanya diizinkan saat pemilihan draft agar daftar pemilih tetap stabil selama voting.");
    const voters = nims.map((nim) => ({ nim, code: generateAccessCode() }));
    const records = voters.map(({ nim, code }) => ({ election_id: electionId, nim_hash: hashNim(nim, secret), access_code_hash: hashAccessCode(code, secret), nim_suffix: nim.slice(-4), enabled: true }));
    const csv = "election_id,nim,access_code\r\n" + voters.map(({ nim, code }) => `${electionId},${nim},${code}\r\n`).join("");
    writePrivateExport(output, csv);
    try {
      // One INSERT is atomic in PostgreSQL: any duplicate rejects this entire batch.
      checked(await db.from("voting_eligible_voters").insert(records), "Impor pemilih");
    } catch {
      throw new Error("Status impor belum dapat dipastikan. Ekspor privat telah disimpan pada path --export. Jangan distribusikan kode atau ulangi impor sebelum memeriksa database: gangguan jaringan dapat terjadi setelah commit. Berkas ini sengaja dipertahankan untuk pemulihan.");
    }
    console.log(`${voters.length} pemilih berhasil diimpor. Kode tersimpan hanya di path privat --export; distribusikan satu kode kepada pemilik NIM yang telah diverifikasi.`);
  } else if (command === "admin") {
    const userId = uuid(required(options, "user"), "User ID Supabase Auth");
    checked(await db.from("voting_admins").upsert({ user_id: userId }, { onConflict: "user_id" }), "Menambahkan admin");
    console.log("Pengguna Supabase Auth telah ditambahkan ke allowlist admin voting.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`Voting admin: ${error.message}`); process.exitCode = 1; });
}
