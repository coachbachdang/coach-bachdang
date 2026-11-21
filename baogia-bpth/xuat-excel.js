/* Bcons Central Park: xuất Excel (.xlsx) cho /baogia-bpth và /baogia-bpth/phieu.
   Không dùng thư viện ngoài: tự ghi các tệp XML của bảng tính và đóng gói ZIP (không nén).
   Cần engine.js (computeQuote, loanPlan, costTo, PLANS...) nạp trước. */

/* ---------- BỘ GHI XLSX TỐI GIẢN ---------- */
const XL = (()=>{
  const enc = new TextEncoder();
  const CRC = (()=>{ const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

  function zip(files){
    const now = new Date();
    const tm = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
    const dt = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
    const parts = [], cen = []; let off = 0;
    for (const f of files) {
      const nm = enc.encode(f.name), d = typeof f.data === "string" ? enc.encode(f.data) : f.data, c = crc32(d);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, tm, true); h.setUint16(12, dt, true); h.setUint32(14, c, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true);
      h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), nm, d);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, tm, true); ch.setUint16(14, dt, true); ch.setUint32(16, c, true); ch.setUint32(20, d.length, true); ch.setUint32(24, d.length, true);
      ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      cen.push(new Uint8Array(ch.buffer), nm);
      off += 30 + nm.length + d.length;
    }
    const cenLen = cen.reduce((a, b)=>a + b.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cenLen, true); e.setUint32(16, off, true);
    const all = [...parts, ...cen, new Uint8Array(e.buffer)];
    const out = new Uint8Array(all.reduce((a, b)=>a + b.length, 0)); let p = 0;
    for (const a of all) { out.set(a, p); p += a.length; }
    return out;
  }

  const x = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/[&<>"]/g, c=>({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
  const col = i => { let s = ""; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };

  /* Kiểu ô: [numFmtId, font, fill, border, wrap, canh ngang] */
  const FONTS = [
    '<font><sz val="11"/><color rgb="FF12312C"/><name val="Calibri"/><family val="2"/></font>',
    '<font><b/><sz val="11"/><color rgb="FF12312C"/><name val="Calibri"/><family val="2"/></font>',
    '<font><b/><sz val="15"/><color rgb="FF12312C"/><name val="Calibri"/><family val="2"/></font>',
    '<font><sz val="10"/><color rgb="FF566A64"/><name val="Calibri"/><family val="2"/></font>',
    '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>',
    '<font><i/><sz val="10"/><color rgb="FF566A64"/><name val="Calibri"/><family val="2"/></font>',
    '<font><b/><sz val="11"/><color rgb="FF1D6B63"/><name val="Calibri"/><family val="2"/></font>'
  ];
  const FILLS = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FFE2EEEB"/><bgColor indexed="64"/></patternFill></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FF12312C"/><bgColor indexed="64"/></patternFill></fill>',
    '<fill><patternFill patternType="solid"><fgColor rgb="FFF4ECDC"/><bgColor indexed="64"/></patternFill></fill>'];
  const BORDERS = ['<border><left/><right/><top/><bottom/><diagonal/></border>',
    '<border><left style="thin"><color rgb="FFD6E0DB"/></left><right style="thin"><color rgb="FFD6E0DB"/></right><top style="thin"><color rgb="FFD6E0DB"/></top><bottom style="thin"><color rgb="FFD6E0DB"/></bottom><diagonal/></border>'];
  const S = {
    def:[0,0,0,0], title:[0,2,0,0], sub:[0,3,0,0], note:[0,5,0,0,1], accent:[0,6,0,0],
    h:[0,1,2,1,1,"center"], sec:[0,4,3,0],
    txt:[0,0,0,1,1], txtB:[0,1,0,1,1], c:[0,0,0,1,0,"center"], cB:[0,1,0,1,0,"center"],
    m:[3,0,0,1], mB:[3,1,0,1], pct:[10,0,0,1], lab:[0,3,0,1,1], val:[0,1,0,1,1],
    hl:[0,1,4,1,1], hlC:[0,1,4,1,0,"center"], hlM:[3,1,4,1], hlP:[10,1,4,1],
    tot:[3,1,4,1], totT:[0,1,4,1,1], valR:[0,1,0,1,1,"right"], hlR:[0,1,4,1,1,"right"], txtR:[0,0,0,1,1,"right"]
  };
  const SK = Object.keys(S), SI = Object.fromEntries(SK.map((k, i)=>[k, i]));
  const stylesXml = () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`+
    `<fonts count="${FONTS.length}">${FONTS.join("")}</fonts><fills count="${FILLS.length}">${FILLS.join("")}</fills><borders count="${BORDERS.length}">${BORDERS.join("")}</borders>`+
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`+
    `<cellXfs count="${SK.length}">${SK.map(k=>{ const [n, f, fi, b, w, h] = S[k];
      return `<xf numFmtId="${n}" fontId="${f}" fillId="${fi}" borderId="${b}" xfId="0"${n ? ' applyNumberFormat="1"' : ""}${f ? ' applyFont="1"' : ""}${fi ? ' applyFill="1"' : ""}${b ? ' applyBorder="1"' : ""} applyAlignment="1"><alignment vertical="top"${w ? ' wrapText="1"' : ""}${h ? ` horizontal="${h}"` : ""}/></xf>`; }).join("")}</cellXfs>`+
    `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

  /* sheet: { name, cols:[độ rộng], rows:[{ c:[ô], ht }], merges:["A1:D1"], freeze:số dòng cố định, landscape }
     ô: null | chuỗi | số | { v, s, f } (f: công thức, v: giá trị tính sẵn để xem trước trên điện thoại vẫn thấy số) */
  function sheetXml(sh, sst){
    const sIdx = s => { if (!sst.map.has(s)) { sst.map.set(s, sst.list.length); sst.list.push(s); } return sst.map.get(s); };
    const rows = sh.rows.map((r, ri)=>{
      const cells = (r.c || []).map((c, ci)=>{
        if (c === null || c === undefined || c === "") return "";
        const o = typeof c === "object" ? c : { v:c };
        const ref = col(ci) + (ri + 1), st = SI[o.s || (typeof o.v === "number" ? "m" : "txt")] || 0;
        if (o.f) return `<c r="${ref}" s="${st}"><f>${x(o.f)}</f><v>${Number.isFinite(o.v) ? o.v : 0}</v></c>`;
        if (typeof o.v === "number") return Number.isFinite(o.v) ? `<c r="${ref}" s="${st}"><v>${o.v}</v></c>` : "";
        if (o.v === undefined || o.v === null) return `<c r="${ref}" s="${st}"/>`;
        return `<c r="${ref}" s="${st}" t="s"><v>${sIdx(String(o.v))}</v></c>`;
      }).join("");
      return `<row r="${ri + 1}"${r.ht ? ` ht="${r.ht}" customHeight="1"` : ""}>${cells}</row>`;
    }).join("");
    const fr = sh.freeze ? `<pane ySplit="${sh.freeze}" topLeftCell="A${sh.freeze + 1}" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A${sh.freeze + 1}" sqref="A${sh.freeze + 1}"/>` : "";
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`+
      `<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>`+
      `<sheetViews><sheetView workbookViewId="0" showGridLines="0">${fr}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>`+
      `<cols>${sh.cols.map((w, i)=>`<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`+
      `<sheetData>${rows}</sheetData>`+
      (sh.merges && sh.merges.length ? `<mergeCells count="${sh.merges.length}">${sh.merges.map(m=>`<mergeCell ref="${m}"/>`).join("")}</mergeCells>` : "")+
      `<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>`+
      `<pageSetup paperSize="9" orientation="${sh.landscape ? "landscape" : "portrait"}" fitToWidth="1" fitToHeight="0"/></worksheet>`;
  }

  function workbook(sheets){
    const sst = { map:new Map(), list:[] };
    const wsX = sheets.map(s=>sheetXml(s, sst));
    const names = sheets.map(s=>s.name.replace(/[\[\]:*?\/\\]/g, " ").slice(0, 31));
    const n = sheets.length;
    const files = [
      { name:"[Content_Types].xml", data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${wsX.map((_, i)=>`<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>` },
      { name:"_rels/.rels", data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>` },
      { name:"docProps/core.xml", data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Báo giá tham khảo Bcons Central Park</dc:title><dc:creator>Bạch Đằng · 0784 313 668</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</dcterms:created></cp:coreProperties>` },
      { name:"xl/workbook.xml", data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${names.map((nm, i)=>`<sheet name="${x(nm)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>` },
      { name:"xl/_rels/workbook.xml.rels", data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${wsX.map((_, i)=>`<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId${n + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>` },
      { name:"xl/styles.xml", data:stylesXml() },
      ...wsX.map((d, i)=>({ name:`xl/worksheets/sheet${i + 1}.xml`, data:d })),
      { name:"xl/sharedStrings.xml", data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sst.list.length}" uniqueCount="${sst.list.length}">${sst.list.map(s=>`<si><t xml:space="preserve">${x(s)}</t></si>`).join("")}</sst>` }
    ];
    return zip(files);
  }
  return { workbook, col };
})();

/* ---------- DỰNG NỘI DUNG ---------- */
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const xlStrip = s => String(s).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const xlPct = v => (+v).toLocaleString("vi-VN", { maximumFractionDigits:2 }) + "%";
const xlSafe = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^A-Za-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");

/* Bảng nhỏ giúp ghép dòng: mỗi dòng là { c:[...], ht } ; ghi nhớ vùng gộp ô */
function xlSheet(name, cols, opt = {}){
  const sh = { name, cols, rows:[], merges:[], freeze:0, landscape:!!opt.landscape };
  const W = cols.length, last = XL.col(W - 1);
  const chars = cols.reduce((a, b)=>a + b, 0);
  sh.add = (c, ht) => { sh.rows.push({ c, ht }); return sh.rows.length; };
  sh.blank = () => sh.add([]);
  sh.merge = (r, c0, c1) => sh.merges.push(`${XL.col(c0)}${r}:${XL.col(c1)}${r}`);
  sh.title = (t, sub) => { sh.merge(sh.add([{ v:t, s:"title" }], 22), 0, W - 1); if (sub) sub.forEach(s=>sh.merge(sh.add([{ v:s, s:"sub" }]), 0, W - 1)); };
  sh.sec = t => { const r = sh.add([{ v:t, s:"sec" }, ...Array(W - 1).fill({ v:null, s:"sec" })], 18); sh.merge(r, 0, W - 1); };
  /* Dòng ghi chú dài: gộp hết chiều ngang, tự ước lượng chiều cao */
  sh.note = (t, s = "note") => { const lines = Math.max(1, Math.ceil(String(t).length * 1.08 / chars)); sh.merge(sh.add([{ v:t, s }], Math.max(15, lines * 13.5 + 3)), 0, W - 1); };
  /* Dòng nhãn – giá trị: nhãn gộp cột 0..lc, giá trị ở cột lc+1 (số) hoặc gộp đến hết (chữ) */
  sh.kv = (label, value, lc, sv, extra) => {
    const c = [{ v:label, s:"lab" }]; for (let i = 1; i <= lc; i++) c.push({ v:null, s:"lab" });
    const isNum = typeof value === "number";
    c.push({ v:value, s:sv || (isNum ? "mB" : "val") });
    if (isNum && extra) { c.push({ v:extra, s:"txt" }); for (let i = lc + 3; i < W; i++) c.push({ v:null, s:"txt" }); }
    else if (!isNum) for (let i = lc + 2; i < W; i++) c.push({ v:null, s:sv || "val" });
    const len = String(isNum ? (extra || "") : value).length, wcols = cols.slice(isNum ? lc + 2 : lc + 1).reduce((a, b)=>a + b, 0) || 20;
    const r = sh.add(c, len > wcols ? Math.ceil(len * 1.08 / wcols) * 14 + 3 : undefined);
    if (lc > 0) sh.merge(r, 0, lc);
    if (isNum && extra && lc + 2 < W - 1) sh.merge(r, lc + 2, W - 1);
    if (!isNum && lc + 1 < W - 1) sh.merge(r, lc + 1, W - 1);
  };
  return sh;
}

/* Tháng (tính từ ký HĐMB) của từng đợt: đợt 1 trước HĐMB (-1), đợt 2 lúc ký (0), bàn giao ở tháng M, nhận sổ sau bàn giao */
function xlRowMonth(r, i, k, M){
  if (i === 0) return -1;
  if (i === 1) return 0;
  if (i === k - 2) return M;
  if (i === k - 1) return M + 0.5;
  if (Number.isFinite(r.month)) return r.month;
  const m = String(r.when).match(/Tháng (\d+)/);
  return m ? +m[1] : 0;
}

/* Diễn giải lãi từng tháng, ngắn gọn cho cột ghi chú (bảng chữ tính một lần cho mỗi kế hoạch vay) */
function xlKind(kind, p){
  if (!p._kt) p._kt = xlKindTable(p);
  return p._kt[kind] || "";
}
function xlKindTable(p){
  return ({ cdt:"Chủ đầu tư hỗ trợ lãi, ân hạn gốc", over:"Quá 24 tháng hỗ trợ, cần xác nhận với Chủ đầu tư", "none-pre":"",
    "cap-pre":"Chỉ trả lãi, trần 6,9% (tính ở mức trần)", "promo-pre":`Chỉ trả lãi, ưu đãi ngân hàng ${xlPct(p.r0)} (giả định)`, "float-pre":`Chỉ trả lãi, lãi ${xlPct(p.r1)} (giả định)`,
    "cap-post":"Trả gốc và lãi, trần 6,9%", "promo-post":`Trả gốc và lãi, ưu đãi ngân hàng ${xlPct(p.r0)} (giả định)`, float:`Trả gốc và lãi, lãi ${xlPct(p.r1)} (giả định)` });
}

/* Dòng tiền gộp theo tháng: đợt thanh toán cho Chủ đầu tư + khoản ngân hàng giải ngân + gốc, lãi trả ngân hàng + tiền thuê */
function xlCashflow(ctx){
  const { q, lp } = ctx;
  const M = lp ? lp.M : Math.min(48, Math.max(1, Math.round(ctx.o.M || 24)));
  const k = q.rows.length, iBG = k - 2;
  const trBy = new Map();
  if (lp) for (const t of lp.tr) if (!t.ext) trBy.set(t.off, (trBy.get(t.off) || 0) + t.amt);
  const ev = [];
  q.rows.forEach((r, i)=>{
    const m = xlRowMonth(r, i, k, M);
    let bank = 0;
    if (r.src === "bank") bank = r.pay;
    else if (i === iBG && lp && lp.ext) bank = lp.ext;
    else if (lp && SELF_ROWS[q.code] && SELF_ROWS[q.code].includes(i)) bank = trBy.get(Math.round(r.month || 0)) || 0;
    const base = `Đợt ${r.n} · ${r.pct}% · ${r.when}`;
    if (i === 0 && r.pay > DEPOSIT) {
      ev.push({ i, m, label:"Cọc đăng ký khi chọn căn (kết chuyển vào đợt 1)", self:DEPOSIT, bank:0, dep:true });
      ev.push({ i, m, label:`${base} (phần còn lại sau cọc đăng ký)`, self:r.pay - DEPOSIT, bank:0 });
      return;
    }
    let label = base;
    if (i === iBG) label += `, giả định tháng ${M} · gồm phí bảo trì 2% ${vnd(r.fee)}`;
    if (i === k - 1) label = `Đợt ${r.n} · ${r.pct}% · Nhận Giấy chứng nhận (thời điểm theo thông báo của Chủ đầu tư)`;
    if (bank && r.src !== "bank") label += i === iBG ? " · vay thêm ngân hàng" : " · ngân hàng giải ngân (tự vay)";
    if (r.src === "bank") label += " · ngân hàng giải ngân";
    ev.push({ i, m, label, self:r.pay - bank, bank });
  });
  const lm = new Map(); if (lp) for (const mo of lp.months) lm.set(mo.t, mo);
  /* Tiền thuê Chủ đầu tư cam kết (Lựa chọn 1, 12/TB-ĐTTH): 24 tháng sau bàn giao, kể cả khi khách không vay */
  const rentFix = !lp && ctx.o && ctx.o.rent > 0 ? ctx.o.rent : 0;
  const lastM = Math.max(M, lp ? lp.months[lp.months.length - 1].t : 0, rentFix ? M + 24 : 0);
  const out = [];
  ev.filter(e=>e.m < 0).forEach(e=>out.push({ m:"Trước HĐMB", label:e.label, self:e.self, bank:0, prin:0, int:0, rent:0, bal:0, note:"" }));
  /* Dư nợ cuối tháng m = dư nợ đầu tháng − gốc trả + khoản giải ngân trong tháng m (lãi tính từ tháng sau giải ngân) */
  const disb = m => lp ? lp.tr.filter(t=>t.off === m).reduce((a, t)=>a + t.amt, 0) : 0;
  for (let m = 0; m <= lastM; m++) {
    const es = ev.filter(e=>e.m === m), mo = lm.get(m);
    const label = es.map(e=>e.label).join("; ") || (m === 0 ? "Ký HĐMB" : "");
    const bal = Math.max(0, (mo ? mo.bal - mo.principal : 0) + disb(m));
    out.push({ m, label, self:es.reduce((a, e)=>a + e.self, 0), bank:es.reduce((a, e)=>a + e.bank, 0),
      prin:mo ? mo.principal : 0, int:mo ? mo.interest : 0, rent:mo ? mo.rent : (rentFix && m > M && m <= M + 24 ? rentFix : 0), bal, note: mo && lp ? xlKind(mo.kind, lp) : "" });
    if (m === M) ev.filter(e=>e.m === M + 0.5).forEach(e=>out.push({ m:"Sau bàn giao", label:e.label, self:e.self, bank:e.bank, prin:0, int:0, rent:0, bal, note:"", gcn:true }));
  }
  return { rows:out, M, ev };
}

function xlHead(ctx){
  const u = ctx.unit, pl = PLANS[ctx.pt];
  const unitTxt = (u.code ? `Căn ${u.code} · tháp ${u.tower} · tầng ${u.floor}` : "Căn theo mã căn") + ` · ${u.typeName}` +
    (u.dt ? ` · ${u.dt.toLocaleString("vi-VN")} m² tim tường` : "") + (u.tt ? ` (${u.tt.toLocaleString("vi-VN")} m² thông thủy)` : "");
  const csTxt = ctx.cs === "thue" ? `Chính sách 12/TB-ĐTTH: Chủ đầu tư thuê lại ${ctx.rentM} triệu/tháng × 24 tháng` : ctx.cs === "ck4" ? (ctx.q.disc4 ? "Chính sách 12/TB-ĐTTH: chiết khấu thêm 4%" : `Chiết khấu thêm 4% không áp dụng cho ${pl.short}`) : "";
  return { unitTxt, csTxt, planTxt:`${pl.short} · ${pl.title}`, dateTxt:`Lập ngày ${ctx.today}${ctx.kh ? ` · gửi ${ctx.kh}` : ""} · Bạch Đằng, chuyên viên tư vấn · 0784 313 668` };
}

function xlLoanTxt(lp){
  if (!lp) return "Không vay";
  const parts = [`${lp.years} năm · ${METHOD_TXT[lp.method]}`];
  if (lp.ext && lp.base) parts.push(`gồm ${vnd(lp.base)} theo ${PLANS[lp.code].short} và ${vnd(lp.ext)} vay thêm đợt bàn giao`);
  return parts.join(" · ");
}
function xlRateTxt(lp){
  if (!lp) return "";
  const c = lp.code;
  if (c === "02" || c === "05") return `Chủ đầu tư hỗ trợ lãi và ân hạn gốc đến thông báo bàn giao, tối đa 24 tháng; sau đó lãi ${xlPct(lp.r1)}/năm (giả định, thả nổi theo ngân hàng)`;
  if (c === "03" || c === "04") return `Khách trả lãi, Chủ đầu tư cam kết trần 6,9%/năm đến tháng ${lp.capEnd} (bảng tính ở mức trần); sau đó ${xlPct(lp.r1)}/năm (giả định)`;
  return lp.base ? `Ưu đãi ngân hàng ${xlPct(lp.r0)}/năm trong ${lp.n0} tháng đầu (giả định), sau đó ${xlPct(lp.r1)}/năm (giả định)` : `${xlPct(lp.r2)}/năm (giả định, khách tự thỏa thuận với ngân hàng)`;
}

function xlNotes(ctx){
  const pl = PLANS[ctx.pt], lp = ctx.lp, M = lp ? lp.M : Math.round(ctx.o.M || 24);
  const n = [];
  if (ctx.manual) n.push("Lưu ý: giá tính theo số nhập tay, chưa phải giá riêng của căn. Giá đúng căn theo báo giá mã căn.");
  n.push(`Tháng tính từ ngày ký HĐMB. Ngày ký HĐMB chưa có thông báo nên số tháng là giả định; bảng giả định bàn giao ở tháng ${M} sau ký HĐMB. Bàn giao dự kiến Quý II/2029, mốc ràng buộc theo HĐMB.`);
  n.push("Hiện ký Thỏa thuận đăng ký. HĐMB ký theo thông báo của Chủ đầu tư khi xong móng và có văn bản đủ điều kiện bán. Khoản 30 triệu cọc đăng ký được kết chuyển vào đợt 1.");
  n.push("Tỷ lệ từng đợt tính trên giá chưa VAT; VAT 10% tạm tính cộng theo đợt như báo giá chính thức. Phí bảo trì 2% đóng ở đợt bàn giao, không nằm trong khoản vay.");
  if (lp) {
    n.push("Lãi suất sau ưu đãi là giả định để minh họa, lãi thực tế theo ngân hàng tại thời điểm đó. Ân hạn gốc đến bàn giao " + (lp.code === "02" || lp.code === "05" ? "theo chính sách Chủ đầu tư." : "là giả định, theo ngân hàng duyệt.") + " Khách có thể trả bớt nợ trước hạn theo điều kiện của ngân hàng.");
    n.push(...loanNotes(lp).split("</p>").map(xlStrip).filter(Boolean));
    if (lp.over24) n.push("Từ giải ngân đến bàn giao quá 24 tháng: phần lãi vượt thời gian hỗ trợ của PTTT 02, 05 cần xác nhận với Chủ đầu tư; bảng tạm tính theo lãi sau ưu đãi.");
  }
  n.push(`${pl.short} · ${pl.loan}. ` + pl.policy.join(" "));
  if (ctx.cs === "thue") n.push(`Chủ đầu tư cam kết thuê lại ${ctx.rentM} triệu/tháng trong 24 tháng kể từ thông báo bàn giao (Thông báo 12/TB-ĐTTH ngày 12/11/2026), khách dùng để trả nợ ở giai đoạn này. Điều kiện: thanh toán đủ, đúng hạn, không vi phạm Thỏa thuận đăng ký hoặc HĐMB, nhận bàn giao trong 45 ngày kể từ thông báo bàn giao.`);
  n.push("Lệ phí trước bạ, phí cấp sổ, phí quản lý, gửi xe không nằm trong giá căn." + (ctx.unit.dt ? ` Phí quản lý ước tính ${vnd(ctx.unit.dt * MGMT_FEE)}/tháng chưa VAT (11.000 đ/m², thực tế tính trên diện tích thông thủy ghi trong HĐMB).` : ""));
  n.push("Báo giá tham khảo lập theo bảng giá áp dụng từ 07/11/2026, file check giá 14/11/2026, Thông báo 11/TB-ĐTTH ngày 05/11/2026 và 12/TB-ĐTTH ngày 12/11/2026. Giá trị ràng buộc theo báo giá mã căn do Chủ đầu tư phát hành và HĐMB.");
  n.push("Bảng tính do Bạch Đằng, chuyên viên tư vấn căn hộ Bcons Central Park lập để khách tham khảo, không phải văn bản của Chủ đầu tư. Liên hệ 0784 313 668." + (ctx.link ? ` Phiếu báo giá trực tuyến: ${ctx.link}` : ""));
  return n;
}

/* So sánh các phương thức: chênh lệch tách hai phần để khách hiểu (không đưa tổng chi phí tiền tỷ) */
function xlCompare(ctx){
  const rows = PLAN_ORDER.map(c=>{ const qq = ctx.getQ(c), o = ctx.cmpOpts(c); return { c, q:qq, o, k:costTo(qq, o) }; });
  const best = Math.min(...rows.map(r=>r.k.total)), B = rows.find(r=>r.k.total === best);
  rows.forEach(r=>{ r.d = r.k.total - best; r.dp = (r.q.T + r.q.fee) - (B.q.T + B.q.fee); r.di = r.k.iH - B.k.iH; });
  const mv = v => xlMoney(Math.abs(v));
  const why = r => { const a = [];
    if (Math.abs(r.dp) >= 5e5) a.push(`giá và phí bảo trì ${r.dp > 0 ? "cao" : "thấp"} hơn ${mv(r.dp)}`);
    if (Math.abs(r.di) >= 5e5) a.push(`lãi ${r.di > 0 ? "nhiều" : "ít"} hơn ${mv(r.di)}`);
    return a.join(", "); };
  const cur = rows.find(r=>r.c === ctx.pt), ex = cur && cur.d >= 0.5 ? cur : rows.filter(r=>r.d >= 0.5).sort((a, b)=>a.d - b.d)[0];
  const example = ex ? `Ví dụ: so với ${PLANS[B.c].short}, ${Math.abs(ex.dp) < 5e5 ? "giá bằng nhau" : `giá và phí bảo trì của ${PLANS[ex.c].short} ${ex.dp > 0 ? "cao" : "thấp"} hơn ${mv(ex.dp)} vì mức chiết khấu khác nhau`}; ${Math.abs(ex.di) < 5e5 ? "tiền lãi gần như bằng nhau" : `tiền lãi khách trả đến tháng 48 ${ex.di > 0 ? "nhiều" : "ít"} hơn ${mv(ex.di)} vì cách vay và hỗ trợ lãi khác nhau`}. Cộng lại, ${PLANS[ex.c].short} tốn hơn ${mv(ex.d)}.` : "";
  return { rows, best:B, why, example, mv };
}

/* Trang đầu của cả hai file: tóm tắt một trang để khách xem và quyết định */
const xlMoney = v => Math.abs(v) >= 1e9 ? ty(v) : (Math.round(v / 1e5) / 10).toLocaleString("vi-VN", { maximumFractionDigits:1 }) + " triệu";
function xlSummarySheet(ctx, where){
  const { q, lp } = ctx, pl = PLANS[ctx.pt], u = ctx.unit, hd = xlHead(ctx), cf = xlCashflow(ctx), M = cf.M;
  const k = q.rows.length, iBG = k - 2;
  const sh = xlSheet("Tóm tắt", [38, 18, 48]);
  sh.title(`TÓM TẮT ĐỂ QUYẾT ĐỊNH${u.code ? " · CĂN " + u.code : ""}`, ["Bcons Central Park · 236 Phan Trung, P. Tam Hiệp, TP. Đồng Nai", hd.unitTxt, `Phương thức: ${hd.planTxt}${hd.csTxt ? " · " + hd.csTxt : ""}`, hd.dateTxt]);
  if (ctx.manual) sh.note("Giá tính theo số nhập tay, chưa phải giá riêng của căn. Giá đúng căn theo báo giá mã căn.", "txtB");
  const line = (a, b, c, hl) => { const n = Math.max(1, Math.ceil(String(c || "").length / 46), Math.ceil(String(a).length / 36));
    return sh.add([{ v:a, s:hl ? "hl" : "txt" }, { v:b, s:hl ? "hlR" : "valR" }, { v:c || null, s:hl ? "hl" : "txt" }], n > 1 ? n * 14.5 + 3 : undefined); };
  sh.blank();
  sh.sec("1. GIÁ CĂN");
  line("Tổng giá trị căn hộ gồm VAT", xlMoney(q.T), vnd(q.T));
  line("Phí bảo trì 2%", xlMoney(q.fee), `${vnd(q.fee)} · đóng khi nhận bàn giao`);
  line("Tổng thanh toán", xlMoney(q.T + q.fee), vnd(q.T + q.fee), true);
  if (u.dt) line("Đơn giá chưa VAT", `${(q.N / u.dt / 1e6).toLocaleString("vi-VN", { maximumFractionDigits:1 })} triệu/m²`, "theo diện tích tim tường");
  if (q.saving > 0) line("Ít hơn giá gốc PTTT 02", xlMoney(q.saving), `${xlPct(q.saving / q.b02 * 100)} tổng giá, nhờ chiết khấu ${pl.discLabel ? pl.discLabel.replace(/^Chiết khấu /, "") : ""}${q.disc4 ? " và chiết khấu thêm 4%" : ""}`);
  if (ctx.cs === "thue") line("Chủ đầu tư thuê lại", `${ctx.rentM} triệu/tháng`, `24 tháng kể từ thông báo bàn giao, tổng ${(ctx.rentM * 24).toLocaleString("vi-VN")} triệu; giá căn không đổi`);
  sh.blank();

  sh.sec("2. TIỀN TỰ CÓ CẦN CHUẨN BỊ THEO TỪNG MỐC");
  const ev = cf.ev, selfOf = f => ev.filter(f).reduce((a, e)=>a + e.self, 0);
  const dep = ev.find(e=>e.dep);
  if (dep) line("Khi chọn căn: cọc đăng ký", xlMoney(dep.self), "kết chuyển vào đợt 1");
  line("Khi ký Thỏa thuận đăng ký", xlMoney(selfOf(e=>e.i === 0 && !e.dep)), dep ? "phần còn lại của đợt 1 (5% giá chưa VAT)" : "đợt 1, 5% giá chưa VAT");
  line("Khi ký HĐMB", xlMoney(selfOf(e=>e.i === 1)), "theo thông báo của Chủ đầu tư; gồm VAT đợt 1 và đợt 2");
  const mid = ev.filter(e=>e.i > 1 && e.i < iBG && e.self >= 1);
  if (mid.length > 3) {
    const sm = mid.reduce((a, e)=>a + e.self, 0), ms = mid.map(e=>e.m);
    line(`Tháng ${Math.min(...ms)}–${Math.max(...ms)} sau HĐMB (${mid.length} đợt)`, xlMoney(sm), mid.some(e=>e.bank > 0) ? "phần không vay của các đợt theo tiến độ" : "đóng theo tiến độ, mỗi đợt 5–10% giá trị");
  } else mid.forEach(e=>{ if (e.self >= 1) line(q.rows[e.i].when, xlMoney(e.self), e.bank > 0 ? "phần không vay của đợt này" : `đợt ${e.i + 1}, ${q.rows[e.i].pct}% giá trị`); });
  const preBG = selfOf(e=>e.i < iBG);
  line("Tổng tự có đến trước bàn giao", xlMoney(preBG), vnd(preBG), true);
  const bgE = ev.find(e=>e.i === iBG), gcnE = ev.find(e=>e.i === k - 1);
  line(`Khi nhận bàn giao (giả định tháng ${M})`, xlMoney(bgE.self), bgE.bank > 0 ? "phí bảo trì 2%; phần 25% vay thêm ngân hàng" : "25% giá trị, đủ 100% VAT và phí bảo trì 2%");
  line("Khi nhận Giấy chứng nhận", xlMoney(gcnE.self), "5% giá trị, không VAT");
  sh.blank();

  sh.sec("3. VAY NGÂN HÀNG VÀ SỐ TIỀN TRẢ MỖI THÁNG");
  if (lp) {
    line("Ngân hàng giải ngân", xlMoney(lp.L), `${lp.years} năm · ${METHOD_TXT[lp.method]}${lp.ext && lp.base ? ` · gồm ${xlMoney(lp.ext)} vay thêm đợt bàn giao` : ""}`);
    const pm = v => v < 0.5 ? "0 đ" : xlMoney(v);
    for (const sg of lp.segs) {
      if (sg.kind === "none-pre") continue;
      const range = sg.from === sg.to ? `Tháng ${sg.from} sau HĐMB` : `Tháng ${sg.from}–${sg.to} sau HĐMB`;
      const amt = Math.abs(sg.first - sg.last) < 1e5 ? `${pm(sg.first)}/tháng` : `${pm(sg.first)} → ${pm(sg.last)}`;
      line(range, amt, xlKind(sg.kind, lp));
    }
    const rm = lp.months.filter(m=>m.rent > 0);
    if (rm.length) {
      const nets = rm.map(m=>m.pay - m.rent), mx = Math.max(...nets), mn = Math.min(...nets);
      line(`Tiền thuê Chủ đầu tư trả, tháng ${rm[0].t}–${rm[rm.length - 1].t}`, `${ctx.rentM} triệu/tháng`, mx <= 0 ? "đủ trả khoản vay hằng tháng trong giai đoạn này" : Math.abs(mx - Math.max(0, mn)) < 1e5 ? `khách bù thêm khoảng ${pm(mx)} mỗi tháng` : `khách bù thêm khoảng ${pm(Math.max(0, mn))} → ${pm(mx)} mỗi tháng`);
    }
    line("Tổng lãi cả kỳ vay (giả định)", xlMoney(lp.totalInt), "khách có thể trả bớt nợ trước hạn theo điều kiện ngân hàng");
  } else {
    line("Không vay", "", "khách tự đóng theo các mốc ở mục 2");
    if (ctx.cs === "thue") line("Tiền thuê Chủ đầu tư trả", `${ctx.rentM} triệu/tháng`, `tháng ${M + 1}–${M + 24} sau HĐMB, 24 tháng kể từ thông báo bàn giao`);
  }
  sh.blank();

  sh.sec("4. SO VỚI CÁC PHƯƠNG THỨC KHÁC (cùng vay 50%, tính đến tháng 48)");
  sh.add([{ v:"Phương thức", s:"h" }, { v:"Tự có đến HĐMB", s:"h" }, { v:"Tốn hơn cách tiết kiệm nhất = chênh giá + chênh lãi", s:"h" }], 31);
  const C = xlCompare(ctx);
  C.rows.forEach(r=>{ const on = r.c === ctx.pt;
    line(`${PLANS[r.c].short} · ${PLANS[r.c].title}${on ? " (đang chọn)" : ""}`, xlMoney(r.q.toHD), r.d < 0.5 ? "tiết kiệm nhất trong 6 phương thức" : `tốn hơn ${C.mv(r.d)}: ${C.why(r)}`, on); });
  sh.note(`Chênh giá: giá trị gồm VAT và phí bảo trì 2% khác nhau do mức chiết khấu. Chênh lãi: tiền lãi khách trả từ lúc vay đến tháng 48 sau ký HĐMB (không phải chỉ đến bàn giao), khác nhau do cách vay và hỗ trợ lãi. Tính đến tháng 48 vì đến đó mọi ưu đãi lãi đã hết. ${C.example}`, "txt");
  sh.note(where === "ov" ? "Chi tiết và giả định ở trang So sánh phương thức." : "Chi tiết và giả định trong file Excel tổng quan báo giá.");
  sh.blank();

  sh.sec("5. ĐIỀU CẦN BIẾT TRƯỚC KHI XUỐNG TIỀN");
  [ "Hiện ký Thỏa thuận đăng ký. Hợp đồng mua bán ký theo thông báo của Chủ đầu tư khi xong móng và có văn bản đủ điều kiện bán; hiện chưa có văn bản này.",
    "Cọc đăng ký 30 triệu kết chuyển vào đợt 1. Điều kiện hoàn hoặc không hoàn từng khoản theo văn bản anh chị ký; Bạch Đằng gửi văn bản để đọc trước khi chuyển tiền.",
    lp ? `Lãi sau ưu đãi theo ngân hàng tại thời điểm đó; bảng dùng ${xlPct(lp.r1)}/năm làm giả định. Ngày ký HĐMB chưa có thông báo nên tháng tính từ ký HĐMB, giả định bàn giao ở tháng ${M}; bàn giao dự kiến Quý II/2029.` : `Ngày ký HĐMB chưa có thông báo nên tháng tính từ ký HĐMB, giả định bàn giao ở tháng ${M}; bàn giao dự kiến Quý II/2029, mốc ràng buộc theo HĐMB.`,
    `Ngoài giá căn: phí quản lý${u.dt ? ` khoảng ${vnd(u.dt * MGMT_FEE)}/tháng chưa VAT` : " 11.000 đ/m²/tháng chưa VAT"}, lệ phí trước bạ và phí cấp sổ khi làm Giấy chứng nhận, bảo hiểm cháy nổ bắt buộc.`,
    "Giá trị ràng buộc theo báo giá mã căn của Chủ đầu tư và HĐMB. Bảng tham khảo do Bạch Đằng, chuyên viên tư vấn Bcons Central Park lập, liên hệ 0784 313 668."
  ].forEach(t=>sh.note("• " + t, "txt"));
  return sh;
}

/* File 1: dòng tiền hằng tháng */
function xlCashBook(ctx){
  const { q, lp } = ctx, hd = xlHead(ctx), cf = xlCashflow(ctx);
  const hasRent = cf.rows.some(r=>r.rent > 0);
  const COLS = [["Tháng", 11, "m"], ["Nội dung", 46, "label"], ["Khách đóng Chủ đầu tư", 17, "self"], ["Ngân hàng giải ngân", 17, "bank"],
    ["Trả ngân hàng: gốc", 15, "prin"], ["Trả ngân hàng: lãi", 15, "int"], ...(hasRent ? [["Tiền thuê Chủ đầu tư trả", 15, "rent"]] : []),
    ["Khách chi trong tháng", 17, "out"], ["Lũy kế khách đã chi", 17, "cum"], ["Dư nợ ngân hàng cuối tháng", 17, "bal"], ["Ghi chú lãi vay", 48, "note"]];
  const ci = Object.fromEntries(COLS.map((c, i)=>[c[2], i])), L = k => XL.col(ci[k]);
  const sh = xlSheet("Dòng tiền hằng tháng", COLS.map(c=>c[1]), { landscape:true });
  sh.title("DÒNG TIỀN THANH TOÁN HẰNG THÁNG · BCONS CENTRAL PARK", [hd.unitTxt, `Phương thức: ${hd.planTxt}${hd.csTxt ? " · " + hd.csTxt : ""}`, hd.dateTxt]);
  sh.blank();
  sh.kv("Tổng giá trị căn hộ gồm VAT", q.T, 1);
  sh.kv("Phí bảo trì 2% (đóng ở đợt bàn giao)", q.fee, 1);
  sh.kv("Tổng thanh toán cho Chủ đầu tư", q.T + q.fee, 1, "hlM");
  sh.kv("Khoản vay ngân hàng", lp ? lp.L : "Không vay", 1, null, lp ? xlLoanTxt(lp) : undefined);
  if (lp) sh.kv("Lãi suất", xlRateTxt(lp), 1);
  sh.kv("Giả định bàn giao", `Tháng ${cf.M} sau ký HĐMB (dự kiến Quý II/2029; ngày ký HĐMB chưa có thông báo)`, 1);
  if (hasRent) sh.kv("Tiền thuê Chủ đầu tư cam kết", ctx.rentM * 1e6, 1, null, "mỗi tháng, 24 tháng kể từ thông báo bàn giao");
  sh.blank();
  const hr = sh.add(COLS.map(c=>({ v:c[0], s:"h" })), 32);
  sh.freeze = hr;
  let first = 0, prev = 0, cum = 0;
  cf.rows.forEach(r=>{
    const R = sh.rows.length + 1;
    const out = r.self + r.prin + r.int - r.rent; cum += out;
    const key = r.m === cf.M || r.gcn, big = r.self + r.bank > 0;
    const st = (base, hl) => key && big ? hl : base;
    const c = [];
    c[ci.m] = { v:r.m, s:st(typeof r.m === "number" ? "c" : "c", "hlC") };
    c[ci.label] = { v:r.label || null, s:st("txt", "hl") };
    c[ci.self] = { v:Math.round(r.self), s:st("m", "hlM") };
    c[ci.bank] = { v:Math.round(r.bank), s:st("m", "hlM") };
    c[ci.prin] = { v:Math.round(r.prin), s:st("m", "hlM") };
    c[ci.int] = { v:Math.round(r.int), s:st("m", "hlM") };
    if (hasRent) c[ci.rent] = { v:Math.round(r.rent), s:st("m", "hlM") };
    c[ci.out] = { v:Math.round(out), f:`${L("self")}${R}+${L("prin")}${R}+${L("int")}${R}${hasRent ? `-${L("rent")}${R}` : ""}`, s:st("mB", "hlM") };
    c[ci.cum] = { v:Math.round(cum), f: first ? `${L("cum")}${prev}+${L("out")}${R}` : `${L("out")}${R}`, s:st("m", "hlM") };
    c[ci.bal] = { v:Math.round(r.bal), s:st("m", "hlM") };
    c[ci.note] = { v:r.note || null, s:st("txt", "hl") };
    const len = Math.max(String(r.label || "").length / 46, String(r.note || "").length / 50);
    sh.add(c, len > 1 ? Math.ceil(len) * 14 + 3 : undefined);
    if (!first) first = R; prev = R;
  });
  const sumF = k => ({ f:`SUM(${L(k)}${first}:${L(k)}${prev})`, v:Math.round(cf.rows.reduce((a, r)=>a + (k === "out" ? r.self + r.prin + r.int - r.rent : r[k]), 0)), s:"tot" });
  const tot = []; COLS.forEach((c, i)=>tot[i] = { v:null, s:"tot" });
  tot[ci.m] = { v:"Tổng", s:"totT" }; tot[ci.label] = { v:"Cộng cả kỳ", s:"totT" };
  ["self", "bank", "prin", "int", ...(hasRent ? ["rent"] : []), "out"].forEach(k=>tot[ci[k]] = sumF(k));
  sh.add(tot);
  sh.blank();
  const totalInt = cf.rows.reduce((a, r)=>a + r.int, 0);
  sh.note(`Khách đóng Chủ đầu tư + ngân hàng giải ngân = tổng thanh toán ${vnd(q.T + q.fee)}. Khách chi trong tháng = khách đóng Chủ đầu tư + gốc và lãi trả ngân hàng${hasRent ? " − tiền thuê Chủ đầu tư trả" : ""}. Tổng lãi khách trả cả kỳ theo giả định: ${vnd(totalInt)}.`, "txt");
  xlNotes(ctx).forEach(t=>sh.note(t));

  /* Bảng theo năm */
  const yr = xlSheet("Theo năm", [30, 11, 11, 18, 17, 16, 16, ...(hasRent ? [16] : []), 18, 17, 18], { landscape:true });
  yr.title("DÒNG TIỀN THEO NĂM · BCONS CENTRAL PARK", [hd.unitTxt, `Phương thức: ${hd.planTxt}`]);
  yr.blank();
  const YH = ["Giai đoạn", "Từ tháng", "Đến tháng", "Khách đóng Chủ đầu tư", "Ngân hàng giải ngân", "Trả ngân hàng: gốc", "Trả ngân hàng: lãi", ...(hasRent ? ["Tiền thuê Chủ đầu tư trả"] : []), "Khách chi trong kỳ", "Bình quân mỗi tháng", "Dư nợ cuối kỳ"];
  yr.freeze = yr.add(YH.map(v=>({ v, s:"h" })), 32);
  const groups = [];
  const g0 = { name:"Trước và lúc ký HĐMB", from:null, to:0, rows:cf.rows.filter(r=>r.m === "Trước HĐMB" || r.m === 0) };
  groups.push(g0);
  const nums = cf.rows.filter(r=>typeof r.m === "number" && r.m > 0);
  const lastM = nums.length ? nums[nums.length - 1].m : 0;
  for (let y = 1; (y - 1) * 12 + 1 <= lastM; y++) {
    const a = (y - 1) * 12 + 1, b = Math.min(y * 12, lastM);
    const rows = cf.rows.filter(r=>(typeof r.m === "number" && r.m >= a && r.m <= b) || (r.gcn && cf.M >= a && cf.M <= b));
    groups.push({ name:`Năm ${y} sau ký HĐMB${cf.M >= a && cf.M <= b ? " · có đợt bàn giao" : ""}`, from:a, to:b, rows });
  }
  groups.forEach(g=>{
    const s = k => g.rows.reduce((a, r)=>a + r[k], 0);
    const out = s("self") + s("prin") + s("int") - s("rent");
    const lastRow = g.rows.filter(r=>typeof r.m === "number").pop();
    const n = g.from ? g.to - g.from + 1 : 0;
    yr.add([{ v:g.name, s:"txtB" }, { v:g.from || null, s:"c" }, { v:g.to, s:"c" }, Math.round(s("self")), Math.round(s("bank")), Math.round(s("prin")), Math.round(s("int")), ...(hasRent ? [Math.round(s("rent"))] : []),
      { v:Math.round(out), s:"mB" }, n ? Math.round(out / n) : { v:null, s:"m" }, Math.round(lastRow ? lastRow.bal : 0)]);
  });
  yr.blank();
  yr.note("Năm tính theo tháng kể từ ký HĐMB (năm 1 là tháng 1–12). Đợt nhận Giấy chứng nhận tính vào năm có đợt bàn giao; thời điểm thực tế theo thông báo của Chủ đầu tư. Bình quân mỗi tháng gồm cả các đợt đóng Chủ đầu tư trong năm.");
  return { sheets:[xlSummarySheet(ctx, "cf"), sh, yr], name:`Dong-tien-hang-thang-${xlSafe(ctx.unit.code || ctx.unit.typeName)}-${xlSafe(PLANS[ctx.pt].short)}.xlsx` };
}

/* File 2: tổng quan báo giá + so sánh phương thức */
function xlOverviewBook(ctx){
  const { q, lp } = ctx, hd = xlHead(ctx), pl = PLANS[ctx.pt], u = ctx.unit;
  const sh = xlSheet("Tổng quan báo giá", [7, 44, 9, 17, 15, 15, 17, 16, 12]);
  sh.title("TỔNG QUAN BÁO GIÁ THAM KHẢO · BCONS CENTRAL PARK", ["236 Phan Trung, P. Tam Hiệp, TP. Đồng Nai", hd.dateTxt]);
  sh.blank();
  sh.sec("THÔNG TIN CĂN HỘ");
  sh.kv("Mã căn", u.code || "Theo mã căn", 2);
  if (u.code) sh.kv("Tháp · tầng", `${u.tower} · tầng ${u.floor}`, 2);
  sh.kv("Loại căn", u.typeName + (u.model ? ` · mẫu ${u.model}` : ""), 2);
  if (u.dt) sh.kv("Diện tích tim tường", `${u.dt.toLocaleString("vi-VN")} m²${u.tt ? ` · thông thủy ${u.tt.toLocaleString("vi-VN")} m² (sổ hồng ghi thông thủy)` : ""}`, 2);
  sh.kv("Phương thức thanh toán", hd.planTxt, 2);
  if (hd.csTxt) sh.kv("Chính sách bán hàng", hd.csTxt, 2);
  if (ctx.manual) sh.note("Giá tính theo số nhập tay, chưa phải giá riêng của căn. Giá đúng căn theo báo giá mã căn.", "txtB");
  sh.blank();
  sh.sec("GIÁ TRỊ CĂN HỘ");
  sh.kv("Giá gốc PTTT 02, chưa VAT", q.n02, 2);
  if (q.discPlan) sh.kv(pl.discLabel, -q.discPlan, 2, null, pl.discNote);
  if (q.disc4) sh.kv("Chiết khấu thêm 4% · Lựa chọn 2, TB 12/TB-ĐTTH", -q.disc4, 2, null, `4% trên giá sau chiết khấu ${pl.short}, chưa VAT`);
  sh.kv("Giá trị căn hộ chưa VAT", q.N, 2);
  sh.kv("VAT 10% (tạm tính)", q.V, 2);
  sh.kv("Tổng giá trị căn hộ gồm VAT", q.T, 2, "hlM");
  sh.kv("Phí bảo trì 2% giá chưa VAT", q.fee, 2, null, "đóng ở đợt bàn giao");
  sh.kv("Tổng thanh toán gồm phí bảo trì", q.T + q.fee, 2, "hlM");
  if (u.dt) sh.kv("Đơn giá chưa VAT theo diện tích tim tường", Math.round(q.N / u.dt), 2, null, "đồng/m²");
  if (q.saving > 0) sh.kv("Ít hơn giá gốc PTTT 02", q.saving, 2, null, `${xlPct(q.saving / q.b02 * 100)} tổng giá`);
  sh.blank();
  sh.sec(`TIẾN ĐỘ THANH TOÁN · ${pl.short}`);
  const hr = sh.add(["Đợt", "Thời điểm", "Tỷ lệ", "Chưa VAT", "VAT", "Phí bảo trì", "Phải đóng", "Nguồn tiền", "Lũy kế giá trị căn hộ (chưa VAT)"].map(v=>({ v, s:"h" })), 32);
  const iBG = q.rows.length - 2, self = SELF_ROWS[q.code] || [];
  const f0 = hr + 1;
  q.rows.forEach((r, i)=>{
    const R = sh.rows.length + 1;
    const when = r.when + (i === 0 ? " (đã gồm 30.000.000 đ cọc đăng ký)" : i === 1 ? " (gồm VAT của đợt 1 và đợt 2)" : i === iBG ? " (gồm VAT đợt bàn giao và đợt nhận sổ)" : i === q.rows.length - 1 ? " (không VAT)" : "");
    const src = r.src === "bank" ? "Ngân hàng" : self.includes(i) ? "Tự có hoặc tự vay" : "Tự có";
    const hl = i === iBG;
    sh.add([{ v:r.n, s:hl ? "hlC" : "c" }, { v:when, s:hl ? "hl" : "txt" }, { v:r.pct / 100, s:hl ? "hlP" : "pct" }, { v:r.net, s:hl ? "hlM" : "m" }, { v:r.vat, s:hl ? "hlM" : "m" }, { v:r.fee, s:hl ? "hlM" : "m" },
      { v:r.pay, f:`D${R}+E${R}+F${R}`, s:hl ? "hlM" : "mB" }, { v:src, s:hl ? "hl" : "txt" }, { v:Math.round(r.cumNet * 100) / 10000, s:hl ? "hlP" : "pct" }], when.length > 44 ? Math.ceil(when.length / 42) * 14 + 3 : undefined);
  });
  const f1 = sh.rows.length;
  sh.note("Lũy kế tính theo giá trị căn hộ chưa VAT, như báo giá của Chủ đầu tư. Đợt 1 chưa thu VAT; VAT của từng đợt cộng vào đợt sau như cột VAT; đến đợt bàn giao khách đóng đủ 95% giá trị căn hộ, 100% VAT và 100% phí bảo trì.");
  sh.add([{ v:null, s:"tot" }, { v:"Tổng cộng", s:"totT" }, { v:null, s:"tot" }, { v:q.N, f:`SUM(D${f0}:D${f1})`, s:"tot" }, { v:q.V, f:`SUM(E${f0}:E${f1})`, s:"tot" }, { v:q.fee, f:`SUM(F${f0}:F${f1})`, s:"tot" }, { v:q.T + q.fee, f:`SUM(G${f0}:G${f1})`, s:"tot" }, { v:null, s:"tot" }, { v:null, s:"tot" }]);
  sh.blank();
  sh.sec("KẾ HOẠCH VAY");
  if (lp) {
    sh.kv("Khoản vay", lp.L, 2, null, xlLoanTxt(lp));
    sh.kv("Lãi suất", xlRateTxt(lp), 2);
    sh.add(["Giai đoạn", null, null, "Mỗi tháng trả", null, null, null, null, null].map((v, i)=>({ v, s:"h" })));
    sh.merge(sh.rows.length, 0, 2); sh.merge(sh.rows.length, 3, 8);
    for (const s of lp.segs) {
      if (s.kind === "none-pre") continue;
      const range = s.from === s.to ? `Tháng ${s.from}` : `Tháng ${s.from}–${s.to}`;
      const amt = s.max < 0.5 ? "0 đ" : (Math.abs(s.first - s.last) < 1000 ? vnd(s.first) : `${vnd(s.first)} → ${vnd(s.last)}`);
      const why = xlKind(s.kind, lp);
      const r = sh.add([{ v:range, s:"txtB" }, { v:null, s:"txt" }, { v:null, s:"txt" }, { v:`${amt}${why ? " · " + why : ""}`, s:"txt" }, ...Array(5).fill({ v:null, s:"txt" })]);
      sh.merge(r, 0, 2); sh.merge(r, 3, 8);
    }
    sh.kv("Tổng lãi khách trả cả kỳ (theo giả định)", Math.round(lp.totalInt), 2);
    sh.note("Chi tiết từng tháng xem file Excel dòng tiền hằng tháng.");
  } else sh.note(ctx.noLoanTxt || "Không vay theo phương thức này; khách tự đóng theo tiến độ.", "txt");
  sh.blank();
  sh.sec("GHI CHÚ");
  xlNotes(ctx).forEach(t=>sh.note(t));

  /* So sánh các phương thức cùng mức vay 50% */
  const cmpH = ["Phương thức", "Cách vay", "Giá trị gồm VAT", "Ít hơn giá gốc PTTT 02", "Tự có đến HĐMB", "Tự có trước bàn giao", "Ngân hàng giải ngân", "Lãi khách trả đến tháng 48", "Chênh giá và phí bảo trì so với cách tiết kiệm nhất", "Chênh lãi đến tháng 48", "Tốn hơn cách tiết kiệm nhất"];
  const cs = xlSheet("So sánh phương thức", [30, 30, 16, 16, 16, 16, 16, 16, 16, 16, 18], { landscape:true });
  cs.title("SO SÁNH CÁC PHƯƠNG THỨC THANH TOÁN · BCONS CENTRAL PARK", [hd.unitTxt, hd.csTxt || "Chưa áp dụng chính sách 12/TB-ĐTTH", hd.dateTxt]);
  cs.blank();
  cs.freeze = cs.add(cmpH.map(v=>({ v, s:"h" })), 45);
  const CP = xlCompare(ctx);
  CP.rows.forEach(r=>{ const { c, q:qq, k } = r, selfL = !!r.o.selfLoan && (c === "1N" || c === "01");
    const p = PLANS[c], on = c === ctx.pt, selfP = c === "1N" || c === "01";
    const how = selfP ? (selfL ? "tự vay" : "không vay") : (c === "03" || c === "04") ? `trần 6,9% đến tháng ${Math.min(48, k.M + 24)}, sau đó thả nổi` : "Chủ đầu tư hỗ trợ đến bàn giao, sau đó thả nổi";
    const loanAmt = qq.bank || (selfL ? selfLoanMax(qq) : 0);
    const d = r.d, sgn = v => Math.abs(v) < 0.5 ? 0 : Math.round(v);
    const st = (a, b) => on ? b : a;
    cs.add([{ v:`${p.short} · ${p.title}${on ? " (đang chọn)" : ""}`, s:st("txtB", "hl") }, { v:`${p.loan} · lãi: ${how}${k.over24 ? " · quá 24 tháng: cần xác nhận" : ""}`, s:st("txt", "hl") },
      { v:qq.T, s:st("m", "hlM") }, { v:qq.saving > 0 ? qq.saving : 0, s:st("m", "hlM") }, { v:qq.toHD, s:st("m", "hlM") },
      { v:Math.round(qq.selfBefore - (selfL ? selfLoanMax(qq) : 0)), s:st("m", "hlM") }, loanAmt ? { v:loanAmt, s:st("m", "hlM") } : { v:"Không vay", s:st("txt", "hl") },
      { v:Math.round(k.iH), s:st("m", "hlM") }, { v:sgn(r.dp), s:st("m", "hlM") }, { v:sgn(r.di), s:st("m", "hlM") },
      d < 0.5 ? { v:"Tiết kiệm nhất", s:st("txtB", "hl") } : { v:Math.round(d), s:st("mB", "hlM") }], 45);
  });
  cs.blank();
  const M = CP.rows[0].k.M;
  const t2 = o => (+o > 0 ? +o : 0).toLocaleString("vi-VN");
  cs.note(`Tốn hơn cách tiết kiệm nhất = chênh giá và phí bảo trì + chênh lãi. Chênh giá: giá trị gồm VAT và phí bảo trì 2% khác nhau do mức chiết khấu. Cột lãi và cột chênh lãi cùng tính từ lúc vay đến tháng 48 sau ký HĐMB: lãi của một phương thức trừ lãi của cách tiết kiệm nhất là ra phần chênh lãi. Số âm là ít hơn cách tiết kiệm nhất ở phần đó. ${CP.example}`);
  cs.note(`Mọi phương thức tính cùng mức vay 50% giá trị gồm VAT, cùng cách trả gốc, giả định bàn giao ở tháng ${M} sau ký HĐMB. Đến tháng 48 mọi ưu đãi lãi đều đã hết: PTTT 02, 05 Chủ đầu tư hỗ trợ lãi tối đa 24 tháng; PTTT 03, 04 trần 6,9% tối đa 48 tháng (tính ở mức trần); 1N, 01 ${ctx.cmpSelf ? `tự vay ưu đãi ${t2(ctx.o.r0)}%/năm trong ${t2(ctx.o.n0)} tháng (giả định)` : "tính không vay"}. Hết ưu đãi tính lãi ${t2(ctx.o.r1 || 11)}%/năm (giả định), lãi thực tế theo ngân hàng tại thời điểm đó.`);
  cs.note("Bảng so sánh để khách tự cân nhắc theo dòng tiền của mình; giá trị ràng buộc theo báo giá mã căn của Chủ đầu tư và HĐMB.");
  return { sheets:[xlSummarySheet(ctx, "ov"), sh, cs], name:`Tong-quan-bao-gia-${xlSafe(ctx.unit.code || ctx.unit.typeName)}.xlsx` };
}

/* Tải file: điện thoại mở bảng chia sẻ (lưu vào Tệp, gửi Zalo); máy tính tải về như bình thường */
async function xlDeliver(book, toast){
  const bytes = XL.workbook(book.sheets);
  const blob = new Blob([bytes], { type:XLSX_MIME });
  try {
    if (typeof File !== "undefined" && navigator.canShare && matchMedia("(pointer:coarse)").matches) {
      const file = new File([blob], book.name, { type:XLSX_MIME });
      if (navigator.canShare({ files:[file] })) { await navigator.share({ files:[file], title:book.name }); return "shared"; }
    }
  } catch (e) { if (e && e.name === "AbortError") return "cancel"; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = book.name; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 30000);
  if (toast) toast(`Đã tạo ${book.name}`);
  return "download";
}

if (typeof module !== "undefined") module.exports = { XL, xlCashBook, xlOverviewBook, xlCashflow, xlDeliver };
