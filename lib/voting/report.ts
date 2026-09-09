import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ImageRun, Footer, PageNumber } from "docx";
import sharp from "sharp";

export type VotingReport = {
  title: string; year: string; status: string; generatedAt: string; eligibleVoters: number; totalVotes: number;
  candidates: { number: number; name: string; votes: number }[];
  timeline: { time: string; votes: number }[];
};
const count = (n: number) => n.toLocaleString("id-ID");
const date = (s: string) => new Date(s).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }) + " WIB";
const escape = (s: string) => s.replace(/[<>&"']/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' })[c]!);
const paragraph = (text: string) => new Paragraph({ text, spacing: { after: 160 } });
const heading = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 260, after: 160 } });
function table(headers: string[], rows: string[][]) {
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headers, ...rows].map((row, i) => new TableRow({ tableHeader: i === 0, cantSplit: true, children: row.map(text => new TableCell({ margins: { top: 110, bottom: 110, left: 130, right: 130 }, shading: i === 0 ? { fill: "E8EEE9" } : undefined, children: [new Paragraph({ children: [new TextRun({ text, bold: i === 0, size: 20 })] })] })) })) });
}
async function chart(svg: string, height: number) {
  const data = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${height}" viewBox="0 0 1000 ${height}"><rect width="1000" height="${height}" fill="white"/>${svg}</svg>`)).png().toBuffer();
  return new Paragraph({ children: [new ImageRun({ type: "png", data, transformation: { width: 600, height: height * .6 }, altText: { title: "Grafik agregat pemilihan", description: "Angka lengkap tersedia dalam tabel laporan.", name: "Grafik" } })], spacing: { after: 200 } });
}
export async function buildVotingReport(report: VotingReport) {
  const total = Number(report.totalVotes);
  if (report.candidates.reduce((sum,c) => sum + Number(c.votes),0) !== total || report.timeline.reduce((sum,t) => sum + Number(t.votes),0) !== total) throw new Error("Report totals are inconsistent");
  const children: (Paragraph | Table)[] = [
    new Paragraph({ text: "Rekap hasil pemilihan ketua angkatan", heading: HeadingLevel.TITLE, spacing: { after: 260, line: 520 } }),
    paragraph(`${report.title} — ${report.year}`),
    paragraph(`Laporan untuk panitia ini mencatat ${count(total)} suara pada ${date(report.generatedAt)}. Status pemilihan: ${{ open: "dibuka", closed: "ditutup", draft: "draft" }[report.status] || report.status}. Hasil merupakan snapshot saat laporan dibuat dan tidak menetapkan pemenang secara otomatis.`),
    heading("Ringkasan pemilihan"),
    table(["Keterangan", "Jumlah"], [["Pemilih aktif terdaftar",count(Number(report.eligibleVoters))],["Suara tercatat",count(total)],["Partisipasi",`${report.eligibleVoters ? (total / report.eligibleVoters * 100).toFixed(2) : "0.00"}%`]]),
    heading("Perolehan suara kandidat"),
    table(["Nomor", "Kandidat", "Suara", "Persentase"], report.candidates.map(c => [String(c.number),c.name,count(Number(c.votes)),`${total ? (c.votes/total*100).toFixed(2) : "0.00"}%`])),
  ];
  // Paginate the bar chart in small groups so 50 candidates still fit on paper.
  for (let start = 0; start < report.candidates.length; start += 8) {
    const group = report.candidates.slice(start,start+8);
    const max = Math.max(1,...report.candidates.map(c=>Number(c.votes)));
    children.push(paragraph(`Grafik perolehan suara kandidat ${start+1} sampai ${start+group.length}. Nomor pada grafik mengacu pada tabel kandidat.`));
    children.push(await chart(group.map((c,i)=>`<text x="25" y="${i*62+38}" font-family="Arial" font-size="21">No. ${c.number}</text><rect x="130" y="${i*62+12}" width="${c.votes/max*740}" height="35" rx="4" fill="#35594a"/><text x="${145+c.votes/max*740}" y="${i*62+38}" font-family="Arial" font-size="21">${escape(count(Number(c.votes)))}</text>`).join(''),group.length*62+12));
  }
  children.push(new Paragraph({ text: "Riwayat penambahan suara", heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 200 } }),paragraph("Log berikut mencakup seluruh suara yang masih tersimpan dalam pemilihan ini, dikelompokkan per jam dalam WIB. Jam tanpa tambahan suara tidak ditampilkan. Kolom kumulatif adalah total berjalan hingga akhir interval. Tidak ada rincian kandidat per interval agar log tidak menghubungkan waktu memilih dengan pilihan individual."));
  let cumulative = 0;
  const rows = report.timeline.map(t => { cumulative += Number(t.votes); return [date(t.time),count(Number(t.votes)),count(cumulative)]; });
  if (!rows.length) children.push(paragraph("Belum ada penambahan suara yang tercatat."));
  else {
    const maxHourly = Math.max(1,...report.timeline.map(v=>Number(v.votes)));
    const points = report.timeline.map((t,i)=>`${70+(report.timeline.length===1 ? 0 : i/(report.timeline.length-1)*850)},${260-Number(t.votes)/maxHourly*210}`).join(' ');
    children.push(await chart(`<text x="30" y="25" font-family="Arial" font-size="20">Tambahan suara per interval jam aktif</text><text x="15" y="55" font-family="Arial" font-size="17">${maxHourly}</text><text x="30" y="263" font-family="Arial" font-size="17">0</text><path d="M70 50 H940" fill="none" stroke="#e0e7e2"/><circle cx="70" cy="${260-Number(report.timeline[0].votes)/maxHourly*210}" r="5" fill="#35594a"/><path d="M70 45 V260 H940" fill="none" stroke="#809087"/><polyline points="${points}" fill="none" stroke="#35594a" stroke-width="4"/><text x="70" y="300" font-family="Arial" font-size="17">Interval pertama</text><text x="780" y="300" font-family="Arial" font-size="17">Interval terakhir</text>`,330));
    children.push(paragraph("Grafik menampilkan urutan interval aktif dengan jarak antartitik yang sama. Waktu dan angka tepat tercantum di tabel; jarak grafik bukan durasi antarinterval."),table(["Awal interval satu jam WIB", "Suara bertambah", "Total kumulatif"], rows));
  }
  children.push(heading("Konsistensi dan kerahasiaan"),paragraph(`Jumlah perolehan kandidat dan jumlah seluruh tambahan per jam sama dengan total ${count(total)} suara. Semua bagian diambil dari satu snapshot database. Persentase dibulatkan dua desimal.`),paragraph("Dokumen ini hanya berisi agregat. NIM, nama pemilih, ID pemilih, sesi, tanda terima, alamat IP, dan hubungan pemilih dengan kandidat tidak diekspor. Riwayat yang sudah dihapus melalui reset tidak dapat direkonstruksi dari laporan ini. Simpan rekap sebelum melakukan reset."));
  return Packer.toBuffer(new Document({ creator: "Panitia IMO", title: "Rekap hasil pemilihan ketua angkatan", styles: { default: { document: { run: { font: "Arial", size: 22, color: "111111" }, paragraph: { spacing: { line: 290 } } } } }, sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } }, footers: { default: new Footer({ children: [new Paragraph({ children: [new TextRun("Rekap agregat pemilihan | Halaman "),new TextRun({ children: [PageNumber.CURRENT] })] })] }) }, children }] }));
}
