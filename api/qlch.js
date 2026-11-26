// API dữ liệu cho app Quản lý Căn hộ N2 D2D — hoangbachdang.com/qlch
// Lưu trên Upstash Redis (Vercel → Storage). Mọi thao tác phải kèm mã truy cập.
// Mã truy cập: chủ nhà tự tạo trong app ở lần mở đầu (lưu dạng băm scrypt trong Redis);
// nếu đặt biến môi trường QLCH_PIN thì biến này được ưu tiên. Sai 10 lần trong 10 phút → khóa tạm.
// Thân yêu cầu: {"pin":"…","user":"…","fn":"getAll","args":[]}
const crypto = require('crypto');

const P = 'qlch:';
const KINDS = ['rooms', 'tenants', 'bills'];
const ID = /^[0-9A-Za-z._:\-]{1,80}$/;
const CONFIG_KEYS = { name: 's', dueDay: 'n', dueOffset: 'n', elecRate: 'n', waterFee: 'n', bottleRate: 'n', warnDays: 'n', bank: 's', billNote: 's' };

function err(message, code) { const e = new Error(message); e.code = code || ''; return e; }
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const now = () => new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(0, 16);

/* ---------- Upstash Redis (REST) ---------- */
function redisCfg() {
  const e = process.env;
  let url = e.KV_REST_API_URL || e.UPSTASH_REDIS_REST_URL;
  let token = e.KV_REST_API_TOKEN || e.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    for (const k of Object.keys(e)) {
      if (!url && /_REST_API_URL$/.test(k)) url = e[k];
      if (!token && /_REST_API_TOKEN$/.test(k) && !/READ_ONLY/.test(k)) token = e[k];
    }
  }
  if (!url || !token) throw err('Website chưa có kho dữ liệu. Vào Vercel → dự án coach-bachdang → Storage → tạo Upstash for Redis và kết nối với dự án, rồi triển khai lại.', 'nodb');
  return { url: url.replace(/\/+$/, ''), token };
}
async function redis(path, body) {
  const { url, token } = redisCfg();
  let r, j;
  try {
    r = await fetch(url + path, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    j = await r.json();
  } catch (e) { throw err('Không kết nối được kho dữ liệu.', 'db'); }
  if (!r.ok || (j && j.error)) throw err('Lỗi kho dữ liệu: ' + ((j && j.error) || r.status), 'db');
  return j;
}
const unwrap = (a) => a.map((x) => { if (x && x.error) throw err('Lỗi kho dữ liệu: ' + x.error, 'db'); return x.result; });
const cmd = (...c) => redis('', c).then((j) => j.result);
const pipe = (cmds) => redis('/pipeline', cmds).then(unwrap);
const tx = (cmds) => redis('/multi-exec', cmds).then(unwrap);

/* ---------- Mã truy cập ---------- */
function same(a, b) {
  const h = (s) => crypto.createHash('sha256').update(String(s)).digest();
  return crypto.timingSafeEqual(h(a), h(b));
}
function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(String(pin), salt, 32).toString('hex');
}
function verifyHash(pin, stored) {
  const [salt, hex] = String(stored).split(':');
  if (!salt || !hex) return false;
  const a = crypto.scryptSync(String(pin || ''), salt, 32), b = Buffer.from(hex, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
async function pinState() {
  if (process.env.QLCH_PIN) return { mode: 'env' };
  const stored = await cmd('GET', P + 'pin');
  return { mode: stored ? 'db' : 'none', stored };
}
async function checkPin(pin) {
  const st = await pinState();
  if (st.mode === 'none') throw err('Chưa tạo mã truy cập. Tải lại trang để tạo mã.', 'nosetup');
  const fails = num(await cmd('GET', P + 'fail'));
  if (fails >= 10) throw err('Nhập sai mã quá nhiều lần. Vui lòng thử lại sau 10 phút.', 'locked');
  const ok = st.mode === 'env' ? same(pin || '', process.env.QLCH_PIN) : verifyHash(pin, st.stored);
  if (!ok) {
    await pipe([['INCR', P + 'fail'], ['EXPIRE', P + 'fail', '600']]);
    throw err('Sai mã truy cập.', 'auth');
  }
}
function checkNewPin(pin) {
  pin = String(pin || '');
  if (pin.length < 6) throw err('Mã truy cập cần tối thiểu 6 ký tự.');
  if (pin.length > 100) throw err('Mã truy cập quá dài.');
  return pin;
}

/* ---------- Chuẩn hóa dữ liệu ---------- */
function billCalc(b) {
  const has = [b.oldE, b.newE].every((v) => v !== null && v !== undefined && v !== '');
  const kwh = has ? Math.max(0, num(b.newE) - num(b.oldE)) : 0;
  const total = num(b.rent) + kwh * num(b.elecRate) + num(b.water) + num(b.bottles) * num(b.bottleRate) + num(b.other);
  const paid = (b.payments || []).reduce((s, p) => s + num(p.amount), 0);
  return { total, paid: Math.min(paid, total), left: Math.max(0, total - paid) };
}
function normPays(list) {
  return (Array.isArray(list) ? list : []).slice(0, 200).map((p) => ({
    amount: num(p && p.amount), date: String((p && p.date) || '').slice(0, 10), method: String((p && p.method) || '').slice(0, 40),
    note: String((p && p.note) || '').slice(0, 300), by: String((p && p.by) || '').slice(0, 60), at: String((p && p.at) || now()).slice(0, 25),
  })).filter((p) => p.amount !== 0);
}
function clean(kind, id, data, ctx) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw err('Dữ liệu không hợp lệ.');
  const o = {};
  for (const k of Object.keys(data)) if (k !== 'id' && !k.startsWith('__')) o[k] = data[k];
  o.updatedAt = now(); o.updatedBy = ctx.user || '';
  if (kind === 'bills') {
    if (!/^\d{4}-\d{2}$/.test(String(o.period || '')) || !o.room || !o.tenantId) throw err('Hóa đơn thiếu kỳ, phòng hoặc khách thuê.');
    for (const k of ['oldE', 'newE']) o[k] = (o[k] === '' || o[k] === null || o[k] === undefined || !Number.isFinite(Number(o[k]))) ? null : Number(o[k]);
    for (const k of ['rent', 'elecRate', 'water', 'bottles', 'bottleRate', 'other']) o[k] = num(o[k]);
    o.payments = normPays(o.payments);
    Object.assign(o, billCalc(o));
  }
  const s = JSON.stringify(o);
  if (s.length > 60000) throw err('Bản ghi quá lớn.');
  return s;
}
function cleanConfig(data, base) {
  const c = Object.assign({}, base || {});
  for (const [k, t] of Object.entries(CONFIG_KEYS)) {
    if (data && k in data) c[k] = t === 'n' ? num(data[k]) : String(data[k] == null ? '' : data[k]).slice(0, 1000);
  }
  return c;
}
function checkId(id) { id = String(id || '').trim(); if (!ID.test(id)) throw err('Mã không hợp lệ: ' + id); return id; }
function checkKind(kind) { if (!KINDS.includes(kind)) throw err('Loại dữ liệu không hợp lệ: ' + kind); return kind; }

/* ---------- Thao tác ---------- */
async function getAll(ctx) {
  const [cfg, r, t, b] = await pipe([['GET', P + 'config'], ['HGETALL', P + 'rooms'], ['HGETALL', P + 'tenants'], ['HGETALL', P + 'bills']]);
  const map = (a) => {
    const o = {};
    for (let i = 0; i + 1 < (a || []).length; i += 2) { try { const v = JSON.parse(a[i + 1]); v.id = a[i]; o[a[i]] = v; } catch (e) { /* bỏ qua bản ghi hỏng */ } }
    return o;
  };
  let config = {};
  try { config = cfg ? JSON.parse(cfg) : {}; } catch (e) { config = {}; }
  return { config, rooms: map(r), tenants: map(t), bills: map(b), me: ctx.user, sheetUrl: '', at: now() };
}
async function saveDoc(ctx, kind, id, data) {
  if (kind === 'config') {
    let cur = {};
    try { cur = JSON.parse((await cmd('GET', P + 'config')) || '{}'); } catch (e) { cur = {}; }
    await cmd('SET', P + 'config', JSON.stringify(cleanConfig(data, cur)));
    return getAll(ctx);
  }
  checkKind(kind); id = checkId(id);
  await cmd('HSET', P + kind, id, clean(kind, id, data, ctx));
  return getAll(ctx);
}
async function saveBills(ctx, list) {
  const args = ['HSET', P + 'bills'];
  for (const b of (Array.isArray(list) ? list : []).slice(0, 200)) {
    const id = checkId(`${b && b.period}_${b && b.room}_${b && b.tenantId}`);
    args.push(id, clean('bills', id, b, ctx));
  }
  if (args.length > 2) await cmd(...args);
  return getAll(ctx);
}
async function setPayments(ctx, id, list) {
  id = checkId(id);
  const raw = await cmd('HGET', P + 'bills', id);
  if (!raw) throw err('Không tìm thấy hóa đơn ' + id + ' (có thể vừa bị xóa).');
  const b = JSON.parse(raw);
  b.payments = list;
  await cmd('HSET', P + 'bills', id, clean('bills', id, b, ctx));
  return getAll(ctx);
}
async function deleteDoc(ctx, kind, id) {
  checkKind(kind); id = checkId(id);
  await cmd('HDEL', P + kind, id);
  return getAll(ctx);
}
async function importAll(ctx, data) {
  if (!data || typeof data !== 'object') throw err('File sao lưu không hợp lệ.');
  const cmds = [];
  const prev = await getAll(ctx);
  cmds.push(['SET', P + 'snapshot', JSON.stringify(Object.assign({ savedAt: now() }, prev))]);
  for (const kind of KINDS) {
    const src = data[kind];
    if (!src || typeof src !== 'object' || Array.isArray(src)) throw err('File sao lưu thiếu phần ' + kind + '.');
    cmds.push(['DEL', P + kind]);
    const args = ['HSET', P + kind];
    for (const [k, v] of Object.entries(src)) { const id = checkId(k); args.push(id, clean(kind, id, v, ctx)); }
    if (args.length > 2) cmds.push(args);
  }
  cmds.push(['SET', P + 'config', JSON.stringify(cleanConfig(data.config || {}, {}))]);
  await tx(cmds);
  return getAll(ctx);
}

async function changePin(ctx, newPin) {
  if ((await pinState()).mode === 'env') throw err('Mã đang được đặt bằng biến QLCH_PIN trên Vercel — đổi ở đó.');
  await cmd('SET', P + 'pin', hashPin(checkNewPin(newPin)));
  return { ok: true };
}

const API = { getAll, saveDoc, saveBills, setPayments, deleteDoc, importAll, changePin };

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (req.method === 'GET') return res.status(200).json({ ok: true, app: 'qlch' });
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  let body = req.body;
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  try {
    if (body.fn === 'status') {
      const st = await pinState();
      return res.status(200).json({ ok: true, data: { setup: st.mode !== 'none' } });
    }
    if (body.fn === 'setupPin') {
      const pin = checkNewPin(body.pin);
      if ((await pinState()).mode !== 'none') throw err('Mã truy cập đã được tạo trước đó. Hãy đăng nhập bằng mã đó.', 'exists');
      const r = await cmd('SET', P + 'pin', hashPin(pin), 'NX');
      if (r !== 'OK') throw err('Mã truy cập đã được tạo trước đó. Hãy đăng nhập bằng mã đó.', 'exists');
      const ctx = { user: String(body.user || '').trim().slice(0, 60) };
      return res.status(200).json({ ok: true, data: await getAll(ctx) });
    }
    await checkPin(body.pin);
    const ctx = { user: String(body.user || '').trim().slice(0, 60) };
    const fn = API[body.fn];
    if (!fn) throw err('Thao tác không hợp lệ.');
    const data = await fn(ctx, ...(Array.isArray(body.args) ? body.args : []));
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(200).json({ ok: false, error: (e && e.message) || String(e), code: (e && e.code) || '' });
  }
};
