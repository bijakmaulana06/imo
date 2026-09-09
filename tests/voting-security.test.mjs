import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { mkdtempSync, readFileSync, rmdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateAccessCode, hashAccessCode, hashNim, normalizeAccessCode, normalizeNim } from "../lib/voting/crypto.mjs";
import { parseArgs, parseVoterCsv, privateExportPath, validateCandidates, validateElection, writePrivateExport } from "../scripts/voting-admin.mjs";

const secret = "test-only-not-a-production-secret-1234567890";
const electionId = "17b59c7f-960b-4da4-8f5e-a31e66d26548";

test("NIM preserves leading zeroes and only normalizes edge whitespace and case", () => {
  assert.equal(normalizeNim("  00ab1234\n"), "00AB1234");
  assert.equal(normalizeNim(123456), "123456");
  assert.equal(normalizeNim("12.3456"), "12.3456");
  assert.equal(normalizeNim("12-3456"), "12-3456");
  for (const input of [null, undefined, "", "   ", "A".repeat(65)]) {
    assert.throws(() => normalizeNim(input));
  }
  assert.notEqual(hashNim("00123456", secret), hashNim("0123456", secret));
});

test("HMAC contract uses explicit identity / access scopes and changes with server secret", () => {
  const input = "ABC12345";
  assert.equal(hashNim(input, secret), createHmac("sha256", secret).update("nim:ABC12345").digest("hex"));
  assert.equal(hashNim(" abc12345 ", secret), hashNim(input, secret));
  const code = "ABC12345".repeat(3);
  assert.notEqual(hashAccessCode(code, secret), hashNim(code, secret));
  assert.notEqual(hashNim(input, secret), hashNim(input, `${secret}different`));
  assert.throws(() => hashNim(input, "short"));
  assert.throws(() => hashAccessCode(code, undefined));
});

test("access codes retain case, contain 192 bits of random input, and reject malformed values", () => {
  const codes = Array.from({ length: 128 }, generateAccessCode);
  assert.equal(new Set(codes).size, codes.length);
  for (const code of codes) {
    assert.match(code, /^[A-Za-z0-9_-]{32}$/);
    assert.equal(Buffer.from(code, "base64url").byteLength, 24);
    assert.equal(normalizeAccessCode(` ${code} `), code);
  }
  assert.notEqual(hashAccessCode("A".repeat(24), secret), hashAccessCode("a".repeat(24), secret));
  for (const code of ["a".repeat(23), "a".repeat(129), "a".repeat(24) + "!", "a".repeat(24) + " b", null]) assert.throws(() => normalizeAccessCode(code));
});

test("CSV import rejects ambiguous identities, duplicates, formulas, and malformed quoting", () => {
  assert.deepEqual(parseVoterCsv('\uFEFFnim,name\r\ncontoh-tidak-valid,"Template"\r\n"00123456","Doe, Jane"\r\nabc12345,"Name ""quoted"""\r\n'), ["00123456", "ABC12345"]);
  for (const source of ["name\nPerson", "nim,nim\ncontoh\n123456,123456", "nim\ncontoh\nabc12345\n ABC12345", "nim\ncontoh\n" + "A".repeat(65), 'nim\ncontoh\n"123456', 'nim\ncontoh\n"123456"oops', "nim\ncontoh\n123456,extra", "nim\ncontoh\n"]) {
    assert.throws(() => parseVoterCsv(source));
  }
});

test("CSV skips preamble, header and exactly the first data record, preserving source locations", () => {
  assert.deepEqual(parseVoterCsv('Daftar pemilih\nTahun 2026\n\nnim,name\nabaikan,contoh\n00123456,A\n00123457,B\n'), ['00123456', '00123457']);
  assert.deepEqual(parseVoterCsv('nim\n00123455\n00123456\n'), ['00123456']);
  assert.throws(() => parseVoterCsv('Judul\nnim\nabaikan\n' + 'A'.repeat(65) + '\n'), /record CSV 4, kolom 1/);
  assert.throws(() => parseVoterCsv('nim,nim\ncontoh,contoh\nnim,name\n00123456,A'), /tepat satu kolom nim/);
});

test("candidate input cannot inject extra database columns or arbitrary photo URLs", () => {
  const candidate = { number: 1, name: "Kandidat contoh", photo_key: "voting/2026/candidate-01.webp" };
  assert.equal(validateCandidates([candidate], electionId)[0].photo_key, candidate.photo_key);
  for (const invalid of [{ ...candidate, id: electionId }, { ...candidate, photo_key: "https://example.com/photo.jpg" }, { ...candidate, photo_key: "../photo.jpg" }, { ...candidate, accent: "red;display:none" }, { ...candidate, number: -1 }]) {
    assert.throws(() => validateCandidates([invalid], electionId));
  }
  assert.throws(() => validateCandidates([candidate, candidate], electionId));
});

test("election schedule requires explicit timezone and forward interval", () => {
  assert.equal(validateElection({ title: "Pemilihan", year: "2026", opens_at: "2026-09-07T08:00:00+07:00", closes_at: "2026-09-07T09:00:00+07:00" }).year, "2026");
  assert.throws(() => validateElection({ title: "Pemilihan", year: "2026", opens_at: "2026-09-07T08:00:00" }));
  assert.throws(() => validateElection({ title: "Pemilihan", year: "2026", opens_at: "2026-09-07T08:00:00Z", closes_at: "2026-09-07T07:00:00Z" }));
  assert.throws(() => validateElection({ title: "Pemilihan", year: "2026", status: "published" }));
});

test("CLI refuses secret-bearing and duplicate options", () => {
  assert.deepEqual(parseArgs(["election", "--file", "input.json"]), { command: "election", options: { file: "input.json" } });
  assert.throws(() => parseArgs(["election", "--file", "a.json", "--file", "b.json"]));
  assert.throws(() => parseArgs(["election", "--file"]));
});

test("private export is outside repository, uses exclusive creation, and preserves prior files", () => {
  const root = mkdtempSync(join(tmpdir(), "voting-test-"));
  const repo = join(root, "repo");
  // Treat an existing, separate directory as the synthetic repository boundary.
  const fakeRepository = mkdtempSync(repo);
  const target = join(root, "codes.csv");
  const existing = join(root, "existing.csv");
  try {
    assert.throws(() => privateExportPath("codes.csv", fakeRepository));
    assert.throws(() => privateExportPath(join(fakeRepository, "codes.csv"), fakeRepository));
    assert.equal(privateExportPath(target, fakeRepository), target);
    writePrivateExport(target, "nim,access_code\nTEST1234,TEST-ONLY\n");
    assert.match(readFileSync(target, "utf8"), /TEST-ONLY/);
    if (process.platform !== "win32") assert.equal(statSync(target).mode & 0o777, 0o600);
    assert.throws(() => privateExportPath(target, fakeRepository));
    writeFileSync(existing, "do-not-replace");
    assert.throws(() => writePrivateExport(existing, "replacement"));
    assert.equal(readFileSync(existing, "utf8"), "do-not-replace");
  } finally {
    for (const path of [target, existing]) { try { unlinkSync(path); } catch {} }
    rmdirSync(fakeRepository);
    rmdirSync(root);
  }
});
