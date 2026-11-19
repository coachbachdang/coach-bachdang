/**
 * Bộ đọc rổ hàng trực tiếp cho trang nội bộ hoangbachdang.com/baogia-bpth
 * Chạy trong tài khoản Google có quyền XEM file rổ hàng chung (GHC 4 SÀN).
 * Chỉ đọc (manifest giới hạn quyền spreadsheets.readonly), chỉ trả về trạng thái từng mã căn:
 * không trả tên khách, đơn vị cọc, công nợ.
 * KEY là mã khóa riêng: chỉ trang nội bộ (sau khi nhập mật khẩu) biết mã này.
 * Bản trong repo để KEY trống; bản dán vào Apps Script có KEY thật.
 */
const SHEET_ID = '1FegcZGFS0YZOpt-5CiBAn4R-cBiTqL3s6tlisKwDRgA';
const SHEET_NAME = 'DATA';
const KEY = '';
const COLS = ['MÃ CĂN', 'TÌNH TRẠNG', 'NGÀY CỌC', 'DEADLINE HT TTĐC', 'NGÀY HT', 'THEO DÕI QUÁ HẠN', 'TÌNH TRẠNG SAU CHECK'];

function doGet(e) {
  if (!KEY || !e || !e.parameter || e.parameter.k !== KEY) return out_({ ok: false, error: 'unauthorized' });
  const cache = CacheService.getScriptCache();
  if (!e.parameter.fresh) {
    const hit = cache.get('rh');
    if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  }
  let json;
  try { json = JSON.stringify(read_()); } catch (err) { return out_({ ok: false, error: String(err && err.message || err) }); }
  try { cache.put('rh', json, 45); } catch (err) {}
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function read_() {
  const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sh) return { ok: false, error: 'Không thấy tab ' + SHEET_NAME };
  const v = sh.getDataRange().getDisplayValues();
  let h = -1;
  for (let r = 0; r < Math.min(v.length, 10); r++) if (v[r].map(norm_).indexOf('MA CAN') >= 0) { h = r; break; }
  if (h < 0) return { ok: false, error: 'Không thấy dòng tiêu đề MÃ CĂN' };
  const head = v[h].map(norm_);
  const idx = COLS.map(function (c) { const n = norm_(c); return head.findIndex(function (x) { return x.indexOf(n) === 0; }); });
  const rows = [];
  for (let r = h + 1; r < v.length; r++) {
    const code = String(v[r][idx[0]] || '').trim().toUpperCase();
    if (!/^[A-E]\d{1,2}-\d{2}$/.test(code)) continue;
    rows.push(idx.map(function (i, j) { return j === 0 ? code : (i >= 0 ? String(v[r][i]).trim() : ''); }));
  }
  return { ok: true, at: Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', "yyyy-MM-dd'T'HH:mm:ss"), cols: COLS, found: idx.map(function (i) { return i >= 0; }), rows: rows };
}

/** Bấm Chạy hàm này một lần để cấp quyền và xem thử số căn theo từng tình trạng */
function kiemTra() {
  const d = read_();
  if (!d.ok) { Logger.log(d.error); return; }
  const dem = {};
  d.rows.forEach(function (r) { const k = r[6] || r[1] || '(trống)'; dem[k] = (dem[k] || 0) + 1; });
  Logger.log('Số căn: ' + d.rows.length + ' · Cột tìm thấy: ' + JSON.stringify(d.found));
  Logger.log('Theo tình trạng: ' + JSON.stringify(dem));
}

function norm_(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/\s+/g, ' ').trim().toUpperCase(); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
