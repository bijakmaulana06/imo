import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { parseVoterExcel } from "../lib/voting/admin-input.mjs";

test("parseVoterExcel parses various NIM formats and numbers from Excel", () => {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ["NIM", "Nama"],
    [12345678, "Budi"],
    ["21.11.4567", "Siti"],
    ["IMO-001", "Andi"],
    ["2024/TK/01", "Joko"],
    ["12345", "Dewi"]
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

  const result = parseVoterExcel(buffer);
  assert.deepEqual(result, [
    "12345678",
    "21.11.4567",
    "IMO-001",
    "2024/TK/01",
    "12345"
  ]);
});

test("parseVoterExcel throws on missing header or empty data", () => {
  const wb1 = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet([["ID"], ["123"]]);
  XLSX.utils.book_append_sheet(wb1, ws1, "Sheet1");
  const buf1 = XLSX.write(wb1, { type: "array", bookType: "xlsx" });
  assert.throws(() => parseVoterExcel(buf1), /judul 'NIM'/);

  const wb2 = XLSX.utils.book_new();
  const ws2 = XLSX.utils.aoa_to_sheet([["NIM"]]);
  XLSX.utils.book_append_sheet(wb2, ws2, "Sheet1");
  const buf2 = XLSX.write(wb2, { type: "array", bookType: "xlsx" });
  assert.throws(() => parseVoterExcel(buf2), /baris data/);
});
