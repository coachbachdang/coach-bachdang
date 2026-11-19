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

if (typeof module !== "undefined") module.exports = { computeQuote, estimateInterest, parseMoney, parseUnit, PLANS, PLAN_ORDER, TYPES, TOWERS, THEO_DISC, NO_CK4, vnd, ty, pctTxt, esc, parseNum, DEPOSIT, MGMT_FEE };
