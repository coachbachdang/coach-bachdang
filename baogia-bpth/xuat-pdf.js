/* Bcons Central Park: xuất phiếu báo giá thành file PDF khổ A4 (chụp đúng phiếu đang hiện, ngắt trang theo dòng).
   Thư viện html2canvas, jsPDF (MIT) đặt trong /baogia-bpth/vendor, chỉ tải khi bấm nút. Cần xuat-excel.js (deliverFile). */
const PDF_LIBS = ["/baogia-bpth/vendor/html2canvas.min.js", "/baogia-bpth/vendor/jspdf.umd.min.js"];
function pdfLoadScript(src){
  return new Promise((ok, fail)=>{ const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ()=>fail(new Error("Không tải được " + src)); document.head.appendChild(s); });
}
async function pdfLibs(){
  if (!window.html2canvas) await pdfLoadScript(PDF_LIBS[0]);
  if (!(window.jspdf && window.jspdf.jsPDF)) await pdfLoadScript(PDF_LIBS[1]);
}
/* Ảnh nằm trong SVG (mặt bằng tầng) phải nhúng thẳng vào SVG thì mới chụp được */
async function pdfInlineSvgImages(root){
  const toData = url => fetch(url).then(r=>r.blob()).then(b=>new Promise(res=>{ const f = new FileReader(); f.onload = ()=>res(f.result); f.readAsDataURL(b); }));
  const cache = new Map();
  for (const im of root.querySelectorAll("svg image")) {
    let href = im.getAttribute("href") || im.getAttribute("xlink:href"); if (!href || href.startsWith("data:")) continue;
    href = href.replace(/-x\.webp$/, "-m.webp");
    if (!cache.has(href)) cache.set(href, toData(href).catch(()=>""));
    const d = await cache.get(href); if (d) { im.setAttribute("href", d); im.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", d); }
  }
}
/* Bỏ các khối @media theo bề rộng màn hình và @media print: PDF luôn dùng bố cục máy tính, trên iPhone cũng vậy */
function pdfDesktopCss(css){
  let out = "", i = 0;
  while (i < css.length) {
    const j = css.indexOf("@media", i);
    if (j < 0) { out += css.slice(i); break; }
    out += css.slice(i, j);
    const b = css.indexOf("{", j); if (b < 0) break;
    let depth = 0, k = b;
    for (; k < css.length; k++) { if (css[k] === "{") depth++; else if (css[k] === "}" && --depth === 0) break; }
    if (!/max-width|print/.test(css.slice(j, b))) out += css.slice(j, k + 1);
    i = k + 1;
  }
  return out;
}
/* Dải chữ đầu, chân trang vẽ bằng canvas để giữ đúng font tiếng Việt của trang */
function pdfStrip(left, right, wpx, hpx, line){
  const c = document.createElement("canvas"); c.width = wpx; c.height = hpx;
  const g = c.getContext("2d"); g.fillStyle = "#ffffff"; g.fillRect(0, 0, wpx, hpx);
  g.fillStyle = "#566a64"; g.textBaseline = "middle"; g.font = `500 ${Math.round(hpx * 0.42)}px "Be Vietnam Pro", system-ui, sans-serif`;
  g.textAlign = "left"; g.fillText(left, 0, hpx / 2);
  g.textAlign = "right"; g.fillText(right, wpx, hpx / 2);
  if (line) { g.fillStyle = "#d6e0db"; g.fillRect(0, line === "bottom" ? hpx - 3 : 0, wpx, 3); }
  return c.toDataURL("image/png");
}
/* el: phiếu cần xuất; name: tên file; meta.head: dòng đầu các trang sau. Trả về Blob PDF.
   Phiếu được dựng lại trong khung ẩn với CSS bố cục máy tính, chụp, rồi ngắt trang A4 tránh cắt ngang dòng, hình, khung */
async function sheetToPdf(el, name, meta = {}){
  await pdfLibs();
  const W = 760;
  const clone = el.cloneNode(true);
  clone.style.cssText += ";opacity:1;margin:0;box-shadow:none;border-radius:0;width:100%";
  clone.querySelectorAll(".no-print, input, select, textarea, label.chk, details, [data-no-pdf]").forEach(n=>n.remove());
  clone.querySelectorAll("button, .pl-tap").forEach(n=>{ if (!n.querySelector("svg, img")) n.remove(); });
  clone.querySelectorAll("img").forEach(im=>{ im.loading = "eager"; });
  /* Mặt bằng để sau phần giá, tiến độ và bước tiếp theo: khách đọc số trước */
  const plan = clone.querySelector("#shPlan"), fine = clone.querySelector(".fine");
  if (plan && fine && plan.innerHTML.trim()) fine.parentNode.insertBefore(plan, fine);
  await pdfInlineSvgImages(clone);
  const ifr = document.createElement("iframe");
  ifr.setAttribute("aria-hidden", "true"); ifr.tabIndex = -1;
  ifr.style.cssText = "position:absolute;left:-20000px;top:0;width:1000px;height:1400px;border:0";
  document.body.appendChild(ifr);
  try {
    const d = ifr.contentDocument;
    const css = [...document.querySelectorAll('style, link[rel="stylesheet"]')].map(n=>n.tagName === "LINK" ? n.outerHTML : `<style>${pdfDesktopCss(n.textContent)}</style>`).join("");
    d.open();
    d.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8">${css}<style>
      html,body{margin:0;background:#fff}
      #pdfRoot{width:${W}px}
      #pdfRoot .sheet{border:0!important;box-shadow:none!important;border-radius:0!important;overflow:visible!important}
      #pdfRoot .sh-head{border-radius:0!important}
      #pdfRoot .pl-lay{max-height:340px;width:auto;max-width:100%;margin:0 auto;display:block}
      #pdfRoot .pl-floor{max-height:300px;width:auto;max-width:100%;margin:0 auto;display:block}
      #pdfRoot .pl-unit{max-height:230px}
      #pdfRoot .pl-zoom{border:0!important}
      #pdfRoot #shPlan{margin-top:6px}
    </style></head><body><div id="pdfRoot"></div></body></html>`);
    d.close();
    const root = d.getElementById("pdfRoot");
    root.appendChild(d.importNode(clone, true));
    const sheet = root.firstElementChild;
    await new Promise(r=>setTimeout(r, 80));
    await Promise.all([...sheet.querySelectorAll("img")].map(im=>im.complete && im.naturalWidth ? 0 : new Promise(r=>{ im.onload = im.onerror = r; setTimeout(r, 5000); })));
    if (d.fonts && d.fonts.ready) await Promise.race([d.fonts.ready, new Promise(r=>setTimeout(r, 3000))]);
    /* iPhone giới hạn khung vẽ khoảng 16,7 triệu điểm ảnh: phiếu dài thì giảm độ phân giải cho vừa */
    const scale = Math.max(1, Math.min(2, Math.sqrt(15e6 / (W * Math.max(1, sheet.offsetHeight)))));
    const canvas = await window.html2canvas(sheet, { scale, backgroundColor:"#ffffff", useCORS:true, logging:false, windowWidth:1000 });
    const H = canvas.height, top = sheet.getBoundingClientRect().top, k = H / sheet.offsetHeight;
    const rect = n => { const r = n.getBoundingClientRect(); return [Math.round((r.top - top) * k), Math.round((r.bottom - top) * k)]; };

    /* Khổ A4: lề 12 mm; trang 2 trở đi có dòng đầu trang; mọi trang có chân trang */
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:"mm", format:"a4", compress:true });
    const M = 12, CW = 210 - 2 * M, HEAD = 9, FOOT = 11, pxPerMm = canvas.width / CW;
    const pageH1 = Math.floor((297 - M - FOOT) * pxPerMm), pageHn = Math.floor((297 - M - HEAD - FOOT) * pxPerMm);

    /* Khối không được cắt: dòng bảng, đoạn, hình, khung; tiêu đề mục phải đi cùng phần nội dung ngay sau */
    const KEEP = "tr, p, li, figure, .pl-row, .pl-block > *, .next-box, .policy-box, .kpis, .unit, .sh-head, .sh-foot, .breakdown tr, .lp-t tr";
    const keeps = [...sheet.querySelectorAll(KEEP)].map(rect).filter(([a, b])=>b - a > 4 && b - a < pageHn * 0.85);
    sheet.querySelectorAll(".sh-title").forEach(n=>{ const [a, b] = rect(n); keeps.push([a, b + Math.round(110 * k)]); });
    const cands = [...new Set(keeps.flatMap(([a, b])=>[a, b]))].filter(c=>c > 0 && c < H).sort((x, y)=>x - y);
    const inside = c => keeps.some(([a, b])=>a < c - 1 && c < b - 1);
    /* Bảng tiến độ sang trang thì lặp lại dòng tiêu đề cột */
    const heads = [...sheet.querySelectorAll("table")].map(t=>{ const th = t.querySelector("thead"); if (!th) return null; const [ha, hb] = rect(th), [, tb] = rect(t); return { ha, hb, tb }; }).filter(Boolean);
    const headAt = y => heads.find(h=>y > h.hb + 2 && y < h.tb - 8);
    const pages = []; let y = 0;
    while (y < H - 2) {
      const rh = pages.length ? headAt(y) : null;
      const ph = (pages.length ? pageHn : pageH1) - (rh ? rh.hb - rh.ha : 0), limit = Math.min(H, y + ph);
      let end = limit;
      if (limit < H) {
        const ok = cands.filter(c=>c > y + ph * 0.3 && c <= limit);
        const good = ok.filter(c=>!inside(c));
        if (good.length) end = good[good.length - 1]; else if (ok.length) end = ok[ok.length - 1];
      }
      pages.push([y, end, rh]); y = end;
    }
    const n = pages.length, stripW = Math.round(CW * 12);
    const foot = i => pdfStrip(meta.foot || "Bạch Đằng · Chuyên viên tư vấn căn hộ · 0784 313 668", `Trang ${i + 1}/${n}`, stripW, 60, "top");
    const head = meta.head ? pdfStrip(meta.head, "Bcons Central Park", stripW, 60, "bottom") : null;
    pages.forEach(([a, b, rh], i)=>{
      const hh = rh ? rh.hb - rh.ha : 0;
      const part = document.createElement("canvas"); part.width = canvas.width; part.height = b - a + hh;
      const g = part.getContext("2d"); g.fillStyle = "#ffffff"; g.fillRect(0, 0, part.width, part.height);
      if (hh) g.drawImage(canvas, 0, rh.ha, canvas.width, hh, 0, 0, canvas.width, hh);
      g.drawImage(canvas, 0, a, canvas.width, b - a, 0, hh, canvas.width, b - a);
      if (i) doc.addPage();
      let yTop = M;
      if (i && head) { doc.addImage(head, "PNG", M, M - 2, CW, 5); yTop = M + HEAD; }
      doc.addImage(part.toDataURL("image/jpeg", 0.9), "JPEG", M, yTop, CW, part.height / pxPerMm);
      doc.addImage(foot(i), "PNG", M, 297 - FOOT + 1, CW, 5);
    });
    doc.setProperties({ title:name.replace(/\.pdf$/, ""), author:"Bach Dang 0784 313 668", subject:"Bao gia tham khao Bcons Central Park" });
    return doc.output("blob");
  } finally { ifr.remove(); }
}
