/* Bcons Central Park: dữ liệu chính sách và hàm tính báo giá dùng chung cho /baogia-bpth và /baogia-bpth/phieu */
/* ---------- DỮ LIỆU (bảng giá áp dụng từ 07/11/2026; TB 11/TB-ĐTTH; TB 12/TB-ĐTTH) ---------- */
const VAT_RATE = 0.10, FEE_RATE = 0.02, CK4 = 0.04, MGMT_FEE = 11000, DEPOSIT = 30000000, CAP_RATE = 6.9;

const TYPES = {
  st:   { name:"Studio",    rent:12, area:[37.6,40.5],  r:{"1N":[1.99,2.54],"01":[2.08,2.66],"04":[2.21,2.84],"02":[2.27,2.91]} },
  "1pn":{ name:"1PN · 1WC", rent:12, area:[42.95,42.95],r:{"1N":[2.17,2.70],"01":[2.27,2.82],"04":[2.42,3.01],"02":[2.48,3.08]} },
  "2pn1":{ name:"2PN · 1WC",rent:14, area:[50.5,53.4],  r:{"1N":[2.78,3.42],"01":[2.91,3.57],"04":[3.10,3.81],"02":[3.18,3.90]} },
  "2pn2":{ name:"2PN · 2WC",rent:14, area:[53.5,73.2],  r:{"1N":[2.95,4.74],"01":[3.09,4.96],"04":[3.29,5.29],"02":[3.37,5.42]} },
  "3pn":{ name:"3PN · 2WC", rent:15, area:[87.1,88.5],  r:{"1N":[5.07,5.87],"01":[5.30,6.13],"04":[5.65,6.54],"02":[5.79,6.70]} }
};
const TOWERS = { A:["Orchid",true], B:["Bamboo",true], C:["Lotus",false], D:["Palm",false], E:["Tamarind",true] };

/* Mỗi đợt: [tỷ lệ % trên giá chưa VAT, thời điểm, nguồn tiền, tháng sau HĐMB (dùng ước tính lãi)] */
const T_TT  = "Ký Thỏa thuận đăng ký";
const T_HD  = "Ký HĐMB theo thông báo của CĐT";
const T_BG  = "Thông báo bàn giao, dự kiến Quý II/2029";
const T_GCN = "Thông báo bàn giao Giấy chứng nhận";
const PLANS = {
  "1N": { short:"PTTT 1N", title:"Thanh toán nhanh", tag:"CK 12,5%", disc:.125, discLabel:"Chiết khấu PTTT 1N 12,5%", discNote:"lũy tiến 8,5% + 4% trên giá PTTT 02 chưa VAT",
    steps:[[5,T_TT,"self"],[15,T_HD,"self"],[50,"Trong 20 ngày kể từ ngày ký HĐMB (gộp đợt 3–10)","self",0],[25,T_BG,"self"],[5,T_GCN,"self"]],
    loan:"Không vay theo CĐT; được tự vay ngân hàng",
    policy:["Phương án thanh toán nhanh của PTTT 01 theo Thông báo 11/TB-ĐTTH ngày 05/11/2026: gộp đợt 3 đến đợt 10 thành 50% giá trị căn hộ (đã gồm VAT), trả trong 20 ngày kể từ ngày ký HĐMB.",
            "Chiết khấu lũy tiến 12,5% trên giá PTTT 02 chưa VAT, chưa phí bảo trì. Giới hạn 200 căn hộ đầu tiên chọn phương án này; Bạch Đằng xác nhận còn áp dụng khi chọn căn.",
            "Khoản 50% có thể tự vay ngân hàng theo chính sách riêng của ngân hàng; khách tự làm việc với ngân hàng."] },
  "01": { short:"PTTT 01", title:"Tự thanh toán theo tiến độ", tag:"CK 8,5%", disc:.085, discLabel:"Chiết khấu PTTT 01 8,5%", discNote:"trên giá PTTT 02 chưa VAT",
    steps:[[5,T_TT,"self"],[15,T_HD,"self"],[5,"Tháng 2 sau HĐMB","self"],[5,"Tháng 4 sau HĐMB","self"],[5,"Tháng 6 sau HĐMB","self"],[10,"Tháng 8 sau HĐMB","self"],[5,"Tháng 10 sau HĐMB","self"],[5,"Tháng 12 sau HĐMB","self"],[5,"Tháng 14 sau HĐMB","self"],[10,"Tháng 18 sau HĐMB","self"],[25,T_BG,"self"],[5,T_GCN,"self"]],
    loan:"Không vay theo CĐT; được tự vay ngân hàng",
    policy:["Theo Thông báo 11/TB-ĐTTH ngày 05/11/2026, thay Thông báo 05/TB-BPTH ngày 04/09/2026. Chiết khấu 8,5% trên giá PTTT 02 chưa VAT, chưa phí bảo trì.",
            "Đến đợt bàn giao, khách đóng đủ lũy tiến 95% giá trị, 100% VAT và 100% phí bảo trì. Khách cam kết thanh toán các đợt đến hạn (gồm VAT) khi CĐT thông báo ký HĐMB.",
            "Có thể tự vay ngân hàng cho các đợt 3–10 theo chính sách riêng của ngân hàng."] },
  "03": { short:"PTTT 03", title:"Vay 1 lần · trần lãi 6,9%", tag:"Giá gốc", disc:0, discLabel:"", discNote:"",
    steps:[[5,T_TT,"self"],[5,T_HD,"self"],[50,"Ngân hàng giải ngân, 7 ngày sau HĐMB","bank",0],[5,"Tháng 2 sau HĐMB","self"],[5,"Tháng 4 sau HĐMB","self"],[25,T_BG,"self"],[5,T_GCN,"self"]],
    loan:"Khách trả lãi, CĐT cam kết trần 6,9%/năm",
    policy:["Ngân hàng giải ngân 50% giá trị gồm VAT. Khách trả lãi từ khi giải ngân.",
            "Chủ đầu tư cam kết lãi không quá 6,9%/năm, tối đa 48 tháng nhưng không quá 24 tháng kể từ khi gửi thông báo thanh toán bàn giao; lãi thực tế vượt 6,9% thì Chủ đầu tư trả 100% phần chênh lệch.",
            "Chỉ áp dụng khách cá nhân. Sau thời gian cam kết, lãi theo ngân hàng."] },
  "04": { short:"PTTT 04", title:"Vay 3 lần · trần lãi 6,9%", tag:"CK 2,45%", disc:.0245, discLabel:"Chiết khấu PTTT 04 2,45%", discNote:"trên giá PTTT 02 chưa VAT",
    steps:[[5,T_TT,"self"],[5,T_HD,"self"],[10,"Ngân hàng giải ngân lần 1, 7 ngày sau HĐMB","bank",0],[5,"Tháng 5 sau HĐMB","self"],[20,"Ngân hàng giải ngân lần 2, 7 ngày sau đó","bank",5],[5,"Tháng 10 sau HĐMB","self"],[20,"Ngân hàng giải ngân lần 3, 7 ngày sau đó","bank",10],[25,T_BG,"self"],[5,T_GCN,"self"]],
    loan:"Khách trả lãi, CĐT cam kết trần 6,9%/năm",
    policy:["Vay 3 lần, giải ngân theo tiến độ nên dư nợ tăng dần, tổng 50% giá trị gồm VAT.",
            "Cam kết trần lãi 6,9%/năm như PTTT 03: khách trả lãi từ khi giải ngân, phần vượt 6,9% Chủ đầu tư trả.",
            "Chiết khấu 2,45%. Chỉ áp dụng khách cá nhân."] },
  "05": { short:"PTTT 05", title:"Vay 3 lần · hỗ trợ lãi", tag:"CK 2,45%", disc:.0245, discLabel:"Chiết khấu PTTT 05 2,45%", discNote:"trên giá PTTT 02 chưa VAT",
    steps:[[5,T_TT,"self"],[5,T_HD,"self"],[10,"Ngân hàng giải ngân lần 1, 7 ngày sau HĐMB","bank",0],[5,"Tháng 5 sau HĐMB","self"],[20,"Ngân hàng giải ngân lần 2, 7 ngày sau đó","bank",5],[5,"Tháng 10 sau HĐMB","self"],[20,"Ngân hàng giải ngân lần 3, 7 ngày sau đó","bank",10],[25,T_BG,"self"],[5,T_GCN,"self"]],
    loan:"CĐT hỗ trợ lãi và ân hạn gốc, tối đa 24 tháng",
    policy:["Dòng tiền như PTTT 04. Chủ đầu tư hỗ trợ lãi và ân hạn gốc cho từng lần giải ngân đến khi gửi thông báo thanh toán nhận bàn giao, không quá 24 tháng.",
            "Hết hỗ trợ là lãi thả nổi theo ngân hàng, không có trần 6,9%.",
            "Chiết khấu 2,45%. Chỉ áp dụng khách cá nhân."] },
  "02": { short:"PTTT 02", title:"Vay 1 lần · hỗ trợ lãi", tag:"Giá gốc", disc:0, discLabel:"", discNote:"",
    steps:[[5,T_TT,"self"],[15,T_HD,"self"],[50,"Ngân hàng giải ngân, 15 ngày sau HĐMB","bank",0],[25,T_BG,"self"],[5,T_GCN,"self"]],
    loan:"CĐT hỗ trợ lãi và ân hạn gốc, tối đa 24 tháng",
    policy:["Ngân hàng giải ngân 50% giá trị gồm VAT. Chủ đầu tư hỗ trợ lãi và ân hạn nợ gốc từ ngày giải ngân đến khi gửi thông báo thanh toán nhận bàn giao, không quá 24 tháng.",
            "Giá gốc, không chiết khấu. Sau thời gian hỗ trợ, lãi theo ngân hàng, thả nổi.",
            "Chỉ áp dụng khách cá nhân."] }
};
const PLAN_ORDER = ["1N","01","03","04","05","02"];
const NO_CK4 = ["02","03"];
const THEO_DISC = { "02":0, "1N":.125, "01":.085, "04":.0245 };

/* ---------- HÀM TÍNH THUẦN ---------- */
/* b02: tổng giá PTTT 02 đã gồm VAT (đồng). cs: "0" | "thue" | "ck4". Trả về giá trị từng phần và từng đợt, làm tròn đến đồng, tổng khớp tuyệt đối. */
function computeQuote(b02, code, cs, unit){
  const pl = PLANS[code];
  const use4 = cs === "ck4" && !NO_CK4.includes(code);
  let n02, netPlan, disc4;
  if (unit && unit.dg && unit.tt) {
    /* Đúng công thức file check giá GHC: đơn giá thông thủy sau chiết khấu (làm tròn) × diện tích thông thủy;
       CSBH 4% = (4% đơn giá sau CK PTTT, làm tròn) × diện tích thông thủy (khớp file 14/11/2026) */
    n02 = Math.round(unit.dg * unit.tt);
    const dgP = Math.round(unit.dg * (1 - pl.disc));
    netPlan = pl.disc ? Math.round(dgP * unit.tt) : n02;
    disc4 = use4 ? Math.round(Math.round(dgP * CK4) * unit.tt) : 0;
    b02 = n02 + Math.round(n02 * VAT_RATE);
  } else {
    n02 = b02 / (1 + VAT_RATE);
    netPlan = n02 * (1 - pl.disc);
    /* File check giá 14/11/2026: CSBH 4% tính trên giá sau chiết khấu PTTT; không áp dụng cho PTTT 02, 03 */
    disc4 = use4 ? netPlan * CK4 : 0;
  }
  const N = Math.round(netPlan - disc4);
  const V = Math.round(N * VAT_RATE);
  const T = N + V;
  const fee = Math.round(N * FEE_RATE);
  const st = pl.steps, k = st.length, iBG = k - 2;
  /* VAT theo cách báo giá chính thức: đợt 1 chưa VAT; đợt ký HĐMB gồm VAT đợt 1 và đợt 2; đợt bàn giao gồm VAT đợt bàn giao và đợt sổ; đợt sổ không VAT */
  const vatPct = st.map((s,i)=> i===0 ? 0 : i===1 ? st[0][0]+st[1][0] : i===iBG ? st[iBG][0]+st[k-1][0] : i===k-1 ? 0 : s[0]);
  /* Như file check giá: mỗi đợt làm tròn, đợt cuối (nhận sổ) nhận phần lệch giá trị; phần lệch VAT dồn vào đợt bàn giao */
  const net = st.map(s=>Math.round(N * s[0] / 100));
  net[k-1] += N - net.reduce((a,b)=>a+b,0);
  const vat = vatPct.map(p=>Math.round(V * p / 100));
  vat[iBG] += V - vat.reduce((a,b)=>a+b,0);
  let cum = 0;
  const rows = st.map((s,i)=>{
    const f = i===iBG ? fee : 0;
    const pay = net[i] + vat[i] + f;
    cum += net[i] + vat[i];
    return { n:i+1, pct:s[0], when:s[1], src:s[2], month:s[3], net:net[i], vat:vat[i], fee:f, pay, cumPct: cum / T * 100 };
  });
  const sum = (fn)=>rows.filter(fn).reduce((a,r)=>a+r.pay,0);
  return {
    code, b02, n02:Math.round(n02), discPlan:Math.round(n02 - netPlan), disc4:Math.round(disc4), N, V, T, fee, rows,
    toHD: rows[0].pay + rows[1].pay,
    bank: sum(r=>r.src==="bank"),
    bankPct: rows.filter(r=>r.src==="bank").reduce((a,r)=>a+r.pct,0),
    selfBefore: rows.slice(0,iBG).filter(r=>r.src==="self").reduce((a,r)=>a+r.pay,0),
    atBG: rows[iBG].pay, atGCN: rows[k-1].pay,
    saving: b02 - T
  };
}

/* Lãi khách tự trả từ khi giải ngân đến bàn giao, chỉ trả lãi, chưa trả gốc. months: số tháng từ HĐMB đến bàn giao. */
function estimateInterest(q, months, selfRate, loan1N){
  const r = q.rows;
  if (q.code === "1N") return loan1N ? { v: q.rows[2].pay * selfRate/100 * months/12, how:"tự vay" } : { v:0, how:"không vay" };
  if (q.code === "01") return { v:0, how:"không vay" };
  if (q.code === "02" || q.code === "05") {
    const over = months > 24;
    return { v:0, how: over ? "cần xác nhận" : "CĐT hỗ trợ", over };
  }
  /* 03, 04: tối đa ở mức trần 6,9%; lãi thực tế thấp hơn thì khách trả ít hơn */
  const v = r.filter(x=>x.src==="bank").reduce((a,x)=>a + x.pay * CAP_RATE/100 * Math.max(0, months - x.month)/12, 0);
  return { v, how:"tối đa ở trần 6,9%" };
}

function parseMoney(s){
  let t = String(s||"").toLowerCase().replace(/\s|đ|vnd|vnđ|tỷ|ty/g,"");
  if (!t) return NaN;
  const dots = (t.match(/\./g)||[]).length, commas = (t.match(/,/g)||[]).length;
  let v;
  if (dots > 1 || commas > 1 || (dots && commas)) v = parseFloat(t.replace(/[.,]/g,""));
  else v = parseFloat(t.replace(",", "."));
  if (!isFinite(v)) return NaN;
  if (v < 100) return v * 1e9;          /* nhập theo tỷ */
  if (v < 1e5) return v * 1e6;          /* nhập theo triệu */
  return v;                              /* nhập đủ đồng */
}
function parseNum(s){ const v = parseFloat(String(s||"").trim().replace(",", ".")); return isFinite(v) ? v : NaN; }
function vnd(v){ return Math.round(v).toLocaleString("vi-VN") + "\u00a0đ"; }
function ty(v, d=2){
  if (Math.abs(v) >= 1e9) return (v/1e9).toLocaleString("vi-VN",{minimumFractionDigits:d,maximumFractionDigits:d}) + " tỷ";
  return (v/1e6).toLocaleString("vi-VN",{maximumFractionDigits:1}) + " triệu";
}
function pctTxt(p){ return p.toLocaleString("vi-VN",{maximumFractionDigits:2}) + "%"; }
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function parseUnit(s){
  const v = String(s||"").trim().toUpperCase();
  const m = v.match(/^([A-E])\s*[-.]?\s*(\d{1,2})\s*[-.\s]\s*(\d{1,2})$/) || v.match(/^([A-E])\s*[-.]?\s*(\d{2})(\d{2})$/);
  if (!m) return null;
  const [_, t, f, u] = m;
  /* Định dạng mã căn theo rổ hàng: A14-23, A3-01 (tầng không thêm số 0) */
  return { code:`${t}${+f}-${u.padStart(2,"0")}`, tower:TOWERS[t][0], open:TOWERS[t][1], floor:+f, unit:u.padStart(2,"0") };
}

/* ---------- KẾ HOẠCH VAY CHI TIẾT ----------
   Tính từng tháng từ lần giải ngân đầu đến hết hạn vay, theo chính sách từng PTTT:
   - 02, 05: CĐT hỗ trợ lãi và ân hạn gốc từ giải ngân đến thông báo bàn giao, tối đa 24 tháng mỗi lần giải ngân
   - 03, 04: khách trả lãi, CĐT cam kết trần 6,9%/năm, tối đa 48 tháng nhưng không quá 24 tháng sau thông báo bàn giao
   - 1N tự vay: ưu đãi ngân hàng r0 trong n0 tháng (giả định), sau đó thả nổi
   Gốc: ân hạn đến bàn giao (02, 05 theo chính sách CĐT; các PTTT khác là giả định), sau đó trả gốc đều hoặc trả đều hằng tháng.
   Tháng tính từ ký HĐMB; giải ngân đầu tháng 1. Lãi suất sau ưu đãi là giả định do người dùng nhập. */
function loanPlan(q, o){
  const code = q.code;
  const M = Math.min(48, Math.max(1, Math.round(o.M || 24)));
  const years = Math.min(35, Math.max(5, Math.round(o.years || 30)));
  const N = years * 12;
  const r1 = (o.r1 > 0 ? o.r1 : 11) / 100;
  const r0 = (o.r0 > 0 ? o.r0 : (o.r1 || 11)) / 100, n0 = Math.max(0, Math.round(o.n0 || 0));
  const cap = CAP_RATE / 100, capEnd = Math.min(48, M + 24);
  /* Khoản vay theo phương thức (1N: khách tự vay khoản 50%). o.amt: số tiền khách muốn vay, nhỏ hơn mức tối đa thì các lần giải ngân giảm theo tỷ lệ */
  const base = code === "1N" ? (o.selfLoan ? [{ off:0, amt:q.rows[2].pay }] : [])
    : q.rows.filter(r=>r.src === "bank").map(r=>({ off:Math.round(r.month || 0), amt:r.pay }));
  const full = base.reduce((a,x)=>a + x.amt, 0);
  const want = isFinite(o.amt) && o.amt >= 0 ? Math.min(Math.round(o.amt), full) : full;
  let acc = 0;
  const tr = base.map((x,i)=>{ const a = i === base.length - 1 ? want - acc : Math.round(x.amt * want / full); acc += a; return { off:x.off, amt:a }; }).filter(x=>x.amt > 0);
  /* Vay thêm đợt bàn giao (25% + VAT, không gồm phí bảo trì): ngoài chính sách Chủ đầu tư, lãi theo ngân hàng */
  const iBG = q.rows.length - 2;
  const ext = o.addBG ? q.rows[iBG].pay - q.rows[iBG].fee : 0;
  if (ext > 0) tr.push({ off:M, amt:ext, ext:true });
  if (!tr.length) return null;
  const L = tr.reduce((a,x)=>a + x.amt, 0), hasBase = want > 0;
  const rateAt = (t, off) => {
    if (code === "02" || code === "05") return (t <= M && t - off <= 24) ? 0 : r1;
    if (code === "03" || code === "04") return t <= capEnd ? cap : r1;
    return t <= n0 ? r0 : r1;
  };
  const rateK = (t, x) => x.ext ? r1 : rateAt(t, x.off);
  const kindAt = (t) => {
    if (!hasBase) return t <= M ? "none-pre" : "float";
    if (t <= M) {
      if (code === "02" || code === "05") return t <= 24 ? "cdt" : "over";
      if (code === "03" || code === "04") return "cap-pre";
      return t <= n0 ? "promo-pre" : "float-pre";
    }
    if ((code === "03" || code === "04") && t <= capEnd) return "cap-post";
    if (code === "1N" && t <= n0) return "promo-post";
    return "float";
  };
  const bals = tr.map(()=>0), months = [];
  let pmt = 0, lastI = -1, princFixed = 0;
  for (let t = 1; t <= N; t++) {
    tr.forEach((x,k)=>{ if (x.off === t - 1) bals[k] += x.amt; });
    const bal = bals.reduce((a,b)=>a + b, 0);
    if (t > M && bal < 1) break;
    let interest = 0, principal = 0;
    tr.forEach((x,k)=>{ interest += bals[k] * rateK(t, x) / 12; });
    if (t > M) {
      const i = bal ? interest / bal : 0, left = N - t + 1;
      if (o.method === "deu") {
        if (Math.abs(i - lastI) > 1e-12) { pmt = i ? bal * i / (1 - Math.pow(1 + i, -left)) : bal / left; lastI = i; }
        principal = Math.min(bal, pmt - interest);
      } else {
        if (!princFixed) princFixed = bal / (N - M);
        principal = Math.min(bal, princFixed);
      }
      const f = bal ? principal / bal : 0; for (let k = 0; k < bals.length; k++) bals[k] -= bals[k] * f;
    }
    const rent = (o.rent && t > M && t <= M + 24) ? o.rent : 0;
    months.push({ t, bal, interest, principal, pay:interest + principal, rent, kind:kindAt(t) });
  }
  /* Giai đoạn: gom các tháng liên tiếp cùng loại */
  const segs = [];
  for (const m of months) {
    const s = segs[segs.length - 1];
    if (s && s.kind === m.kind) { s.to = m.t; s.last = m.pay; s.max = Math.max(s.max, m.pay); s.min = Math.min(s.min, m.pay); s.int += m.interest; }
    else segs.push({ kind:m.kind, from:m.t, to:m.t, first:m.pay, last:m.pay, max:m.pay, min:m.pay, int:m.interest });
  }
  const years_ = [];
  for (const m of months) {
    const y = Math.ceil(m.t / 12); let Y = years_[y - 1];
    if (!Y) Y = years_[y - 1] = { y, int:0, prin:0, pay:0, rent:0, n:0, end:0 };
    Y.int += m.interest; Y.prin += m.principal; Y.pay += m.pay; Y.rent += m.rent; Y.n++; Y.end = m.bal - m.principal;
  }
  return { code, L, full, base:want, short:full - want, ext, M, years, N, r0:r0*100, r1:r1*100, n0, capEnd, method:o.method === "deu" ? "deu" : "goc", months, segs, years_,
    totalInt: months.reduce((a,m)=>a + m.interest, 0), totalRent: months.reduce((a,m)=>a + m.rent, 0), over24: (code === "02" || code === "05") && M > 24 };
}

function loanHtml(p){
  if (!p) return "";
  const pct = v => v.toLocaleString("vi-VN", { maximumFractionDigits:2 }) + "%";
  const LBL = {
    cdt: ["Trước bàn giao", "Chủ đầu tư hỗ trợ lãi và ân hạn gốc"],
    over: ["Trước bàn giao, quá 24 tháng hỗ trợ", `lãi ${pct(p.r1)}; phần này cần xác nhận với Chủ đầu tư`],
    "none-pre": ["Trước bàn giao", "chưa vay, khách tự đóng theo tiến độ"],
    "cap-pre": ["Trước bàn giao", "chỉ trả lãi, Chủ đầu tư cam kết trần 6,9% (tính ở mức trần)"],
    "promo-pre": ["Trước bàn giao", `chỉ trả lãi, ưu đãi ngân hàng ${pct(p.r0)} (giả định)`],
    "float-pre": ["Trước bàn giao", `chỉ trả lãi, lãi ${pct(p.r1)}`],
    "cap-post": ["Sau bàn giao, vẫn trong trần 6,9%", `bắt đầu trả gốc, lãi tối đa 6,9%${p.ext ? `; phần vay thêm đợt bàn giao lãi ${pct(p.r1)}` : ""}`],
    "promo-post": ["Sau bàn giao, còn ưu đãi ngân hàng", `bắt đầu trả gốc, lãi ${pct(p.r0)}${p.ext ? `; phần vay thêm đợt bàn giao lãi ${pct(p.r1)}` : ""}`],
    float: ["Sau ưu đãi", `lãi thả nổi giả định ${pct(p.r1)}${p.method === "deu" ? ", trả đều" : ", giảm dần theo dư nợ"}`]
  };
  const tm = (a,b) => a === b ? `tháng ${a}` : `tháng ${a}–${b}`;
  const money = v => v < 0.5 ? "0 đ" : vnd(v);
  const rows = p.segs.map(s=>{
    const lb = LBL[s.kind];
    const amt = s.max < 0.5 ? "0 đ" : (Math.abs(s.first - s.last) < 1000 ? money(s.first) : `${money(s.first)} → ${money(s.last)}`);
    const rentM = p.months.find(m=>m.rent); const r0_ = Math.max(s.from, p.M + 1), r1_ = Math.min(s.to, p.M + 24);
    const rentLine = rentM && r0_ <= r1_ ? `<small style="color:var(--river)">Chủ đầu tư trả tiền thuê ${vnd(rentM.rent)}/tháng trong ${tm(r0_, r1_)}</small>` : "";
    return `<tr><td><b>${lb[0]}</b><small>${tm(s.from, s.to)} · ${lb[1]}</small>${rentLine}</td><td class="r"><b>${amt}</b><small>mỗi tháng</small></td></tr>`;
  }).join("");
  const rentNote = p.totalRent ? `<p class="lp-note">Tiền thuê Chủ đầu tư cam kết ${vnd(p.months.find(m=>m.rent)?.rent || 0)}/tháng trong 24 tháng đầu sau bàn giao, khách dùng để trả nợ ở giai đoạn này.</p>` : "";
  const yrs = p.years_.filter(Y=>Y.pay >= 1 || Y.end >= 1).map(Y=>`<tr><td>Năm ${Y.y}</td><td class="r">${ty(Y.prin)}</td><td class="r">${ty(Y.int)}</td><td class="r"><b>${money(Y.pay / Y.n)}</b></td>${p.totalRent ? `<td class="r">${Y.rent ? ty(Y.rent) : "—"}</td>` : ""}<td class="r">${ty(Math.max(0, Y.end))}</td></tr>`).join("");
  const mons = p.months.filter(m=>m.bal >= 1 || m.t > p.M).map(m=>`<tr${m.t === p.M ? ' class="bg"' : ""}><td>${m.t}${m.t === p.M ? " · bàn giao" : ""}</td><td class="r">${money(m.principal)}</td><td class="r">${money(m.interest)}</td><td class="r"><b>${money(m.pay)}</b></td>${p.totalRent ? `<td class="r">${m.rent ? vnd(m.rent) : "—"}</td>` : ""}<td class="r">${vnd(Math.max(0, m.bal - m.principal))}</td></tr>`).join("");
  const rentTh = p.totalRent ? "<th class=\"r\">Tiền thuê nhận</th>" : "";
  return `<div class="lp">`+
    `<div class="lp-h">Khoản vay <b>${vnd(p.L)}</b> · ${p.years} năm · ${p.method === "deu" ? "trả đều hằng tháng" : "gốc chia đều, lãi trên dư nợ giảm dần"}${p.ext && p.base ? `<small style="display:block;font-weight:400">gồm ${vnd(p.base)} theo ${PLANS[p.code].short} và ${vnd(p.ext)} vay thêm đợt bàn giao</small>` : ""}</div>`+
    `<table class="lp-t"><tbody>${rows}</tbody></table>${rentNote}${loanNotes(p)}`+
    `<details class="lp-d"><summary>Bảng theo năm</summary><div class="lp-w"><table class="lp-t2"><thead><tr><th>Năm</th><th class="r">Gốc trả</th><th class="r">Lãi trả</th><th class="r">Bình quân/tháng</th>${rentTh}<th class="r">Dư nợ cuối năm</th></tr></thead><tbody>${yrs}</tbody></table></div></details>`+
    `<details class="lp-d"><summary>Bảng từng tháng (${p.months.length} tháng)</summary><div class="lp-w"><table class="lp-t2"><thead><tr><th>Tháng</th><th class="r">Gốc</th><th class="r">Lãi</th><th class="r">Phải trả</th>${rentTh}<th class="r">Dư nợ còn</th></tr></thead><tbody>${mons}</tbody></table></div></details>`+
    `<p class="lp-note">Tháng tính từ ký HĐMB, giả định bàn giao ở tháng ${p.M}. Ân hạn gốc đến bàn giao${p.code === "02" || p.code === "05" ? " theo chính sách Chủ đầu tư" : " là giả định, theo ngân hàng duyệt"}. Lãi suất sau ưu đãi là giả định để minh họa, lãi thực tế theo ngân hàng tại thời điểm đó. Khách có thể trả bớt nợ trước hạn theo điều kiện của ngân hàng. Tổng lãi khách trả cả kỳ theo giả định này: ${vnd(p.totalInt)}.</p>`+
    `</div>`;
}

/* Ghi chú khi khách vay ít hơn mức của phương thức hoặc vay thêm đợt bàn giao */
function loanNotes(p){
  const out = [];
  const head = p.base ? `Khách vay ${vnd(p.base)}, ít hơn mức tối đa ${vnd(p.full)}.` : "Khách không vay khoản này.";
  if (p.short > 0.5) out.push(p.code === "1N"
    ? `${head} Phần còn lại ${vnd(p.short)} khách tự đóng trong 20 ngày sau ký HĐMB.`
    : `${head} Phần còn lại ${vnd(p.short)} khách tự đóng vào các đợt ngân hàng giải ngân của ${PLANS[p.code].short}. Vay thấp hơn mức của phương thức cần xác nhận với Chủ đầu tư và ngân hàng khi làm hồ sơ.`);
  if (p.ext) out.push(`Vay thêm đợt bàn giao ${vnd(p.ext)} (25% và VAT, không gồm phí bảo trì 2%) nằm ngoài chính sách Chủ đầu tư: lãi theo ngân hàng, bảng tính dùng ${p.r1.toLocaleString("vi-VN",{maximumFractionDigits:2})}%/năm từ tháng ${p.M + 1}. Mức vay tối đa theo thẩm định của ngân hàng.`);
  return out.map(t=>`<p class="lp-note">${t}</p>`).join("");
}

/* Tóm tắt kế hoạch vay thành vài dòng cho tin nhắn Zalo (không dấu chấm cuối câu) */
function loanBrief(p){
  if (!p) return [];
  const pct = v => v.toLocaleString("vi-VN", { maximumFractionDigits:2 }) + "%";
  const out = [`Kế hoạch vay ${ty(p.L)}${p.ext && p.base ? ` (gồm ${ty(p.ext)} vay thêm đợt bàn giao)` : p.ext ? " cho đợt bàn giao" : ""}, ${p.years} năm, ${p.method === "deu" ? "trả đều hằng tháng" : "gốc đều, lãi giảm dần"}:`];
  for (const s of p.segs) {
    const range = s.from === s.to ? `Tháng ${s.from}` : `Tháng ${s.from}–${s.to}`;
    const amt = s.max < 0.5 ? "0 đ" : (Math.abs(s.first - s.last) < 1000 ? vnd(s.first) : `${vnd(s.first)} → ${vnd(s.last)}`);
    if (s.kind === "none-pre") continue;
    const why = s.kind === "cdt" ? " (Chủ đầu tư hỗ trợ lãi, ân hạn gốc)" : s.kind.startsWith("cap") ? " (trần lãi 6,9%)" : s.kind.startsWith("promo") ? ` (ưu đãi ngân hàng ${pct(p.r0)})` : s.kind === "float" ? ` (lãi thả nổi giả định ${pct(p.r1)})` : "";
    out.push(`${range}: ${amt}/tháng${why}`);
  }
  if (p.totalRent) out.push("24 tháng đầu sau bàn giao có tiền thuê Chủ đầu tư cam kết để trả nợ");
  if (p.short > 0.5) out.push(p.code === "1N" ? `Phần không vay ${ty(p.short)} tự đóng trong 20 ngày sau ký HĐMB` : `Phần không vay ${ty(p.short)} tự đóng vào các đợt ngân hàng giải ngân, mức vay này cần xác nhận khi làm hồ sơ`);
  if (p.ext) out.push(`Phần vay thêm đợt bàn giao ngoài chính sách Chủ đầu tư, lãi theo ngân hàng`);
  return out;
}

if (typeof module !== "undefined") module.exports = { loanPlan, loanHtml, loanBrief, loanNotes, computeQuote, estimateInterest, parseMoney, parseUnit, PLANS, PLAN_ORDER, TYPES, TOWERS, THEO_DISC, NO_CK4, vnd, ty, pctTxt, esc, parseNum, DEPOSIT, MGMT_FEE };
