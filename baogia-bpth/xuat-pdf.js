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
/* el: phiếu cần xuất; name: tên file. Trả về Blob PDF.
   Phiếu được dựng lại trong khung ẩn rộng 1000px để dùng bố cục máy tính (gọn hơn bố cục điện thoại), rồi chụp và ngắt trang A4 */
async function sheetToPdf(el, name){
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
    const css = [...document.querySelectorAll('style, link[rel="stylesheet"]')].map(n=>n.outerHTML).join("");
    d.open();
    d.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8">${css}<style>html,body{margin:0;background:#fff}#pdfRoot{width:${W}px}#pdfRoot .pl-lay{max-height:380px;width:auto;margin:0 auto;display:block}#pdfRoot #shPlan{margin-top:6px}</style></head><body><div id="pdfRoot"></div></body></html>`);
    d.close();
    const root = d.getElementById("pdfRoot");
    root.appendChild(d.importNode(clone, true));
    const sheet = root.firstElementChild;
    await new Promise(r=>setTimeout(r, 60));
    await Promise.all([...sheet.querySelectorAll("img")].map(im=>im.complete && im.naturalWidth ? 0 : new Promise(r=>{ im.onload = im.onerror = r; setTimeout(r, 5000); })));
    if (d.fonts && d.fonts.ready) await Promise.race([d.fonts.ready, new Promise(r=>setTimeout(r, 3000))]);
    const canvas = await window.html2canvas(sheet, { scale:2, backgroundColor:"#ffffff", useCORS:true, logging:false, windowWidth:1000 });
    /* Điểm ngắt trang: đáy các dòng, đoạn, hình; không cắt ngang chữ */
    const top = sheet.getBoundingClientRect().top, k = canvas.height / sheet.offsetHeight;
    const cuts = [...new Set([...sheet.querySelectorAll("tr, p, li, figure, .sh-title, .kpis, .unit > *, .policy-box, .next-box, .fine > *, header, footer, .pl-row, table, h2, h3")]
      .map(n=>Math.round((n.getBoundingClientRect().bottom - top) * k)))].filter(y=>y > 0 && y < canvas.height).sort((a, b)=>a - b);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:"mm", format:"a4", compress:true });
    const M = 10, CW = 210 - 2 * M, CH = 297 - 2 * M - 6, pxPerMm = canvas.width / CW, pageH = Math.floor(CH * pxPerMm);
    const pages = []; let y = 0;
    while (y < canvas.height - 2) {
      let end = Math.min(canvas.height, y + pageH);
      if (end < canvas.height) { const c = cuts.filter(b=>b > y + pageH * 0.45 && b <= end); if (c.length) end = c[c.length - 1]; }
      pages.push([y, end]); y = end;
    }
    pages.forEach(([a, b], i)=>{
      const part = document.createElement("canvas"); part.width = canvas.width; part.height = b - a;
      part.getContext("2d").drawImage(canvas, 0, a, canvas.width, b - a, 0, 0, canvas.width, b - a);
      if (i) doc.addPage();
      doc.addImage(part.toDataURL("image/jpeg", 0.88), "JPEG", M, M, CW, (b - a) / pxPerMm);
      doc.setFontSize(8); doc.setTextColor(120); doc.text(`${i + 1}/${pages.length}`, 210 - M, 297 - 6, { align:"right" });
    });
    doc.setProperties({ title:name.replace(/\.pdf$/, ""), author:"Bach Dang 0784 313 668" });
    return doc.output("blob");
  } finally { ifr.remove(); }
}
