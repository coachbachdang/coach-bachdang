/* Mặt bằng tầng điển hình và vị trí từng căn, theo bản vẽ gốc của Chủ đầu tư (thư mục "2. Mặt Bằng Tầng" và marketing).
   b: khung căn [x0,y0,x1,y1], c: tâm vòng số căn, m: mẫu căn trên bản vẽ. Tọa độ quy về khung 1920 x 1358 (bản gốc 5846 x 4134).
   Ảnh ở /baogia-bpth/plan/: {bản vẽ}-m.webp (trong trang), {bản vẽ}-x.webp (phóng to), {bản vẽ}-{số căn}.webp (mặt bằng căn).
   Tòa Bamboo tầng 10–15 dùng bản vẽ riêng, cùng bố cục, lệch 7,7 điểm theo chiều dọc so với bản điển hình.
   Số căn (trục) giống nhau ở mọi tầng; đã đối chiếu diện tích tim tường từng trục với bảng giá. */
const PLAN_DATA = {"A":{"img":"orchid","name":"Orchid","u":{"22":{"b":[137,432,258,606],"c":[179,287],"m":"B5"},"23":{"b":[263,432,326,606],"c":[274,287],"m":"D3"},"24":{"b":[331,432,394,606],"c":[370,287],"m":"D3"},"25":{"b":[399,432,463,606],"c":[464,287],"m":"D3"},"26":{"b":[467,432,534,606],"c":[562,286],"m":"D1"},"27":{"b":[540,432,606,606],"c":[661,287],"m":"D1"},"01":{"b":[761,432,855,606],"c":[808,288],"m":"D5"},"02":{"b":[858,432,927,606],"c":[905,287],"m":"D1"},"03":{"b":[930,432,1058,606],"c":[1001,287],"m":"B1"},"04":{"b":[1061,432,1185,606],"c":[1129,287],"m":"B1"},"05":{"b":[1355,432,1492,606],"c":[1416,287],"m":"B4"},"06":{"b":[1495,432,1622,606],"c":[1567,287],"m":"B1"},"07":{"b":[1626,432,1778,606],"c":[1708,287],"m":"A2"},"21":{"b":[137,637,265,797],"c":[200,859],"m":"B8"},"20":{"b":[269,637,410,797],"c":[338,859],"m":"C4"},"19":{"b":[412,637,497,797],"c":[453,858],"m":"D6"},"18":{"b":[500,637,637,797],"c":[568,859],"m":"C4"},"17":{"b":[642,637,727,797],"c":[680,859],"m":"D6"},"16":{"b":[730,637,815,797],"c":[775,859],"m":"D6"},"15":{"b":[818,637,957,797],"c":[887,859],"m":"C4"},"14":{"b":[960,637,1099,797],"c":[1028,859],"m":"C4"},"13":{"b":[1103,637,1187,797],"c":[1140,858],"m":"D6"},"12":{"b":[1191,637,1275,797],"c":[1235,858],"m":"D6"},"11":{"b":[1278,637,1417,797],"c":[1347,859],"m":"C4"},"10":{"b":[1421,637,1505,797],"c":[1462,859],"m":"D6"},"09":{"b":[1509,637,1647,797],"c":[1578,859],"m":"C4"},"08":{"b":[1651,637,1778,797],"c":[1715,859],"m":"B8"}}},"B":{"img":"bamboo","name":"Bamboo","u":{"16":{"b":[922,78,1028,153],"c":[899,71],"m":"B5"},"15":{"b":[922,153,1028,197],"c":[899,125],"m":"D1"},"14":{"b":[922,197,1028,241],"c":[898,177],"m":"D1"},"13":{"b":[922,241,1028,286],"c":[899,228],"m":"D4"},"12":{"b":[922,286,1028,330],"c":[898,281],"m":"D4"},"05":{"b":[922,468,1028,534],"c":[901,537],"m":"C1"},"04":{"b":[922,534,1028,605],"c":[902,589],"m":"C1"},"03":{"b":[922,605,1028,648],"c":[901,642],"m":"D1"},"02":{"b":[922,648,1028,690],"c":[901,698],"m":"D1"},"01":{"b":[922,690,1028,735],"c":[900,751],"m":"D1"},"33":{"b":[922,830,1028,925],"c":[900,876],"m":"B4"},"32":{"b":[922,925,1028,1000],"c":[900,966],"m":"B1"},"31":{"b":[922,1000,1028,1087],"c":[901,1043],"m":"A2"},"17":{"b":[1045,78,1140,155],"c":[1178,113],"m":"B8"},"18":{"b":[1045,155,1140,212],"c":[1178,184],"m":"D6"},"19":{"b":[1045,212,1140,293],"c":[1177,261],"m":"C4"},"20":{"b":[1045,293,1140,375],"c":[1176,324],"m":"C4"},"21":{"b":[1045,375,1140,430],"c":[1176,402],"m":"D6"},"22":{"b":[1045,430,1140,510],"c":[1176,462],"m":"C4"},"23":{"b":[1045,510,1140,565],"c":[1176,540],"m":"D6"},"24":{"b":[1045,565,1140,630],"c":[1176,600],"m":"C4"},"25":{"b":[1045,630,1140,690],"c":[1176,677],"m":"D6"},"26":{"b":[1045,690,1140,750],"c":[1176,737],"m":"D6"},"27":{"b":[1045,750,1140,830],"c":[1176,814],"m":"C4"},"28":{"b":[1045,830,1140,910],"c":[1176,876],"m":"C4"},"29":{"b":[1045,910,1140,970],"c":[1176,955],"m":"D6"},"30":{"b":[1045,970,1140,1087],"c":[1175,1044],"m":"A1"},"09":{"b":[652,308,732,418],"c":[661,215],"m":"B6"},"10":{"b":[732,308,802,418],"c":[719,215],"m":"B1"},"11":{"b":[805,308,882,418],"c":[781,214],"m":"B1"},"08":{"b":[652,432,732,540],"c":[668,560],"m":"B6"},"07":{"b":[732,432,810,540],"c":[731,560],"m":"B1"},"06":{"b":[810,432,905,515],"c":[793,560],"m":"B2"}}},"E":{"img":"tamarind","name":"Tamarind","u":{"13":{"b":[710,252,890,388],"c":[826,192],"m":"B3"},"14":{"b":[893,232,1008,388],"c":[944,192],"m":"C1"},"15":{"b":[1008,232,1128,388],"c":[1062,192],"m":"C1"},"16":{"b":[1128,232,1243,388],"c":[1180,193],"m":"C1"},"17":{"b":[1243,232,1380,388],"c":[1297,192],"m":"B8"},"21":{"b":[905,422,1008,605],"c":[1020,639],"m":"D5"},"20":{"b":[1008,422,1087,605],"c":[1119,640],"m":"D4"},"19":{"b":[1088,422,1220,605],"c":[1216,640],"m":"B1"},"18":{"b":[1220,422,1380,605],"c":[1314,640],"m":"A2"},"12":{"b":[540,390,676,555],"c":[456,504],"m":"C2"},"11":{"b":[518,555,676,665],"c":[456,622],"m":"C3"},"10":{"b":[518,678,676,790],"c":[457,738],"m":"C1"},"09":{"b":[518,848,676,962],"c":[456,903],"m":"C1"},"08":{"b":[518,962,676,1082],"c":[457,1030],"m":"C1"},"07":{"b":[518,1082,676,1220],"c":[456,1156],"m":"B8"},"01":{"b":[708,605,892,680],"c":[955,769],"m":"D1"},"02":{"b":[708,680,892,752],"c":[955,845],"m":"D1"},"03":{"b":[708,752,892,825],"c":[955,920],"m":"D1"},"04":{"b":[708,825,892,955],"c":[955,994],"m":"B1"},"05":{"b":[708,955,892,1085],"c":[955,1073],"m":"B1"},"06":{"b":[708,1085,892,1222],"c":[955,1162],"m":"B5"}}}};
const PLAN_W = 1920, PLAN_H = 1358, PLAN_CROP_H = 1270;   /* bỏ dải tiêu đề vàng cuối bản vẽ */
/* Mặt bằng căn hộ điển hình có nội thất (thư mục "4. Thiết Kế Căn Hộ"), cắt phần bản vẽ: /baogia-bpth/plan/mau-{mẫu}.webp.
   Thêm mẫu mới: cắt ảnh rồi thêm mã mẫu vào danh sách này. */
const PLAN_LAYOUTS = ["A2", "D5", "D6"];

function planInfo(code){
  const p = typeof parseUnit === "function" ? parseUnit(code) : null;
  if (!p || !p.open) return null;
  const T = PLAN_DATA[p.code[0]], u0 = T && T.u[p.unit];
  if (!u0) return null;
  /* Bamboo tầng 10–15: bản vẽ riêng */
  const alt = p.code[0] === "B" && p.floor >= 10 && p.floor <= 15, dx = alt ? 0.3 : 0, dy = alt ? -7.7 : 0;
  const u = { m:u0.m, b:[u0.b[0]+dx, u0.b[1]+dy, u0.b[2]+dx, u0.b[3]+dy], c:[u0.c[0]+dx, u0.c[1]+dy] };
  return { p, T, u, img: alt ? "bamboo-1015" : T.img, sheet: alt ? "mặt bằng điển hình tầng 10–15" : "mặt bằng tầng điển hình" };
}
/* Phần nền mờ bên ngoài khung căn, để căn được chọn nổi lên */
function planDim(vb, b, op){
  const [x, y, w, h] = [-2000, -2000, PLAN_W + 4000, PLAN_H + 4000], [x0, y0, x1, y1] = b;   /* phủ cả phần ảnh lộ ra ngoài khung xem */
  return `<path d="M${x} ${y}h${w}v${h}h${-w}z M${x0} ${y0}v${y1-y0}h${x1-x0}v${y0-y1}z" fill="#fff" fill-opacity="${op}" fill-rule="evenodd"/>`;
}
/* Mặt bằng căn: phóng to vùng căn trên bản vẽ tầng */
function planUnitSvg(I, cls){
  const [x0, y0, x1, y1] = I.u.b, w = x1 - x0, h = y1 - y0, pad = Math.round(Math.max(w, h) * 0.16);
  const vb = [Math.round(x0 - pad), Math.round(y0 - pad), Math.round(w + 2*pad), Math.round(h + 2*pad)];   /* đúng khung đã cắt sẵn trong ảnh mặt bằng căn */
  return `<svg class="${cls || "pl-unit"}" viewBox="${vb.join(" ")}" role="img" aria-label="Mặt bằng căn ${I.p.code}, mẫu ${I.u.m}">`+
    `<image href="/baogia-bpth/plan/${I.img}-${I.p.unit}.webp" x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" preserveAspectRatio="none"/>`+
    planDim(vb, I.u.b, .62)+
    `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="none" stroke="#d1462f" stroke-width="${Math.max(2, w/60)}" rx="3"/></svg>`;
}
/* Vị trí căn trên mặt bằng tầng */
function planFloorSvg(I, big){
  const [x0, y0, x1, y1] = I.u.b, [cx, cy] = I.u.c, vb = [0, 0, PLAN_W, PLAN_CROP_H];
  return `<svg class="pl-floor" viewBox="${vb.join(" ")}" role="img" aria-label="Vị trí căn ${I.p.code} trên mặt bằng tầng tòa ${I.T.name}">`+
    `<image href="/baogia-bpth/plan/${I.img}-${big ? "x" : "m"}.webp" width="${PLAN_W}" height="${PLAN_H}"/>`+
    planDim(vb, I.u.b, .5)+
    `<rect x="${x0}" y="${y0}" width="${x1-x0}" height="${y1-y0}" fill="#d1462f" fill-opacity=".07" stroke="#d1462f" stroke-width="6" rx="4"/>`+
    `<circle cx="${cx}" cy="${cy}" r="30" fill="none" stroke="#d1462f" stroke-width="6"><animate attributeName="r" values="24;40;24" dur="1.8s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values="1;.2;1" dur="1.8s" repeatCount="indefinite"/></circle></svg>`;
}
/* Sơ đồ tòa: 22 tầng, tầng 1–2 khối đế thương mại, đánh dấu tầng của căn */
function planTowerSvg(floor){
  const n = 22, fh = 9, top = 6, w = 54;
  let s = `<svg class="pl-tower" viewBox="0 0 96 ${top + n*fh + 18}" role="img" aria-label="Tầng ${floor} trên tổng ${n} tầng">`;
  for (let f = n; f >= 1; f--) {
    const y = top + (n - f) * fh, on = f === floor, pod = f <= 2;
    s += `<rect x="${pod ? 4 : 10}" y="${y}" width="${pod ? w + 12 : w}" height="${fh - 1.5}" rx="1.5" fill="${on ? "#d1462f" : pod ? "#c9d3ce" : "#e6ece9"}"/>`;
    if (on || f === 1 || f === n || f % 5 === 0) s += `<text x="${pod ? w + 20 : w + 14}" y="${y + fh - 2}" font-size="${on ? 8.5 : 7}" font-weight="${on ? 700 : 400}" fill="${on ? "#d1462f" : "#7a8a84"}">${on ? "◀ " : ""}${f}</text>`;
  }
  return s + `<text x="4" y="${top + n*fh + 13}" font-size="7" fill="#7a8a84">Tầng 1–2 thương mại</text></svg>`;
}
/* Khối hoàn chỉnh cho phiếu báo giá và ô chi tiết căn */
function planBlockHtml(code, opt){
  const I = planInfo(code); if (!I) return "";
  const o = opt || {};
  const lay = PLAN_LAYOUTS.includes(I.u.m) ? `/baogia-bpth/plan/mau-${I.u.m}.webp` : "";
  return `<div class="pl-block">`+
    (lay ? `<figure class="pl-fig"><a class="pl-zoom" href="${lay}" target="_blank" rel="noopener" aria-label="Mở mặt bằng mẫu căn ${I.u.m} cỡ lớn"><img class="pl-lay" src="${lay}" alt="Mặt bằng mẫu căn ${I.u.m} có bố trí nội thất" loading="lazy"></a>`+
      `<figcaption>Mặt bằng mẫu căn ${I.u.m}, kích thước ghi theo milimét · nội thất minh họa, đồ rời không thuộc bàn giao · căn thực tế có thể đối xứng theo vị trí, xem đúng chiều ở hình bên dưới</figcaption></figure>` : "")+
    `<div class="pl-row"><figure class="pl-fig"><button type="button" class="pl-zoom" data-plan-open="${I.p.code}" aria-label="Phóng to mặt bằng căn">${planUnitSvg(I)}</button>`+
      `<figcaption>Căn ${I.p.code} trên bản vẽ tầng, đúng chiều thực tế · mẫu ${I.u.m}</figcaption></figure>`+
      `<figure class="pl-fig pl-fig-t">${planTowerSvg(I.p.floor)}<figcaption>Tòa ${I.T.name} · tầng ${I.p.floor}</figcaption></figure></div>`+
    `<figure class="pl-fig"><button type="button" class="pl-zoom" data-plan-open="${I.p.code}" aria-label="Phóng to mặt bằng tầng">${planFloorSvg(I)}</button>`+
      `<figcaption>Vị trí căn số ${I.p.unit} trên ${I.sheet} tòa ${I.T.name}${o.noTap ? "" : `<span class="pl-tap"> · chạm để phóng to</span>`}</figcaption></figure>`+
    `<p class="pl-note">Bản vẽ ${I.sheet} của Chủ đầu tư, dùng để minh họa vị trí căn theo số căn; nội thất trên bản vẽ chỉ để tham khảo. Hướng, view và diện tích chính thức theo hồ sơ của Chủ đầu tư và HĐMB.</p></div>`;
}
/* Xem mặt bằng cỡ lớn: kéo để xem, tự cuộn tới căn */
function planOpen(code){
  const I = planInfo(code); if (!I) return;
  let ov = document.getElementById("plOv");
  if (!ov) {
    ov = document.createElement("div"); ov.id = "plOv"; ov.className = "pl-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    document.body.appendChild(ov);
    ov.addEventListener("click", e=>{ if (e.target.closest("[data-plan-close]")) ov.hidden = true; });
    document.addEventListener("keydown", e=>{ if (e.key === "Escape") ov.hidden = true; });
  }
  ov.innerHTML = `<div class="pl-ov-bar"><b>Căn ${I.p.code} · tòa ${I.T.name} · mẫu ${I.u.m}</b><button type="button" data-plan-close aria-label="Đóng">✕</button></div>`+
    `<div class="pl-ov-scroll"><div class="pl-ov-in">${planFloorSvg(I, true)}</div></div>`+
    `<div class="pl-ov-unit">${planUnitSvg(I, "pl-unit pl-unit-big")}</div>`;
  ov.hidden = false;
  const sc = ov.querySelector(".pl-ov-scroll"), inner = ov.querySelector(".pl-ov-in");
  requestAnimationFrame(()=>{ const k = inner.clientWidth / PLAN_W, [x0, y0, x1, y1] = I.u.b;
    sc.scrollLeft = (x0 + x1) / 2 * k - sc.clientWidth / 2; sc.scrollTop = (y0 + y1) / 2 * k - sc.clientHeight / 2; });
}
document.addEventListener("click", e=>{ const b = e.target.closest("[data-plan-open]"); if (b) { e.preventDefault(); planOpen(b.dataset.planOpen); } });

const PLAN_CSS = `
.pl-block{display:grid;gap:10px}
.pl-row{display:grid;grid-template-columns:minmax(0,1fr) 92px;gap:10px;align-items:end}
.pl-fig{margin:0;display:grid;gap:4px}
.pl-fig figcaption{font-size:.74rem;color:#66756f;text-align:center}
.pl-zoom{display:block;width:100%;padding:0;border:1px solid #d6e0db;border-radius:10px;background:#fff;overflow:hidden;cursor:zoom-in}
.pl-unit,.pl-floor,.pl-tower,.pl-lay{display:block;width:100%;height:auto}
.pl-unit{max-height:300px}
.pl-fig-t .pl-tower{max-width:92px;margin:0 auto}
.pl-note{font-size:.72rem;color:#7a8a84;margin:0;line-height:1.45}
.pl-ov{position:fixed;inset:0;z-index:90;background:#0f1d1a;display:flex;flex-direction:column}
.pl-ov[hidden]{display:none}
.pl-ov-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;padding-top:calc(10px + env(safe-area-inset-top));color:#fff;font-size:.9rem}
.pl-ov-bar button{background:rgba(255,255,255,.14);color:#fff;border:0;border-radius:999px;width:36px;height:36px;font-size:1rem}
.pl-ov-scroll{flex:1;overflow:auto;-webkit-overflow-scrolling:touch;background:#fff}
.pl-ov-in{width:max(2200px,240vw)}
.pl-ov-unit{background:#fff;border-top:1px solid #d6e0db;padding:8px;padding-bottom:calc(8px + env(safe-area-inset-bottom));display:flex;justify-content:center}
.pl-unit-big{max-height:30vh;width:auto;max-width:100%}
@media print{#shPlan{order:99}.pl-lay{max-height:330px;width:auto;max-width:100%;margin:0 auto}.pl-row{grid-template-columns:1fr 80px}.pl-unit{max-height:200px}.pl-floor{max-height:260px;width:auto;max-width:100%;margin:0 auto}.pl-zoom{border:0}.pl-tap{display:none}.pl-block{break-inside:avoid}}
`;
(function(){ const st = document.createElement("style"); st.textContent = PLAN_CSS; document.head.appendChild(st); })();
if (typeof module !== "undefined") module.exports = { PLAN_DATA, planInfo };
