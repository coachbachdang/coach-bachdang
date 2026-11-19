"""Đóng gói dữ liệu bảng giá & rổ hàng Bcons Central Park cho trang nội bộ /baogia-bpth.

Dữ liệu gốc (file check giá GHC, rổ hàng) KHÔNG đưa vào repo. Script đọc file Excel,
mã hóa AES-GCM bằng khóa dẫn xuất PBKDF2-SHA256 từ mật khẩu, ghi ra baogia-bpth/data.enc.json.
Trang chỉ giải mã trên máy người dùng khi nhập đúng mật khẩu.

Cách chạy (mật khẩu truyền qua biến môi trường, không ghi vào lệnh):
  BPTH_PASS='...' python3 -I tools/bpth_build.py --checkgia FILE_CHECK_GIA.xlsx [--rohang RO_HANG.xlsx] \
      [--stock-at '19/11/2026 20:30'] --out baogia-bpth/data.enc.json
Nếu --out đã có dữ liệu cũ cùng mật khẩu, trạng thái cũ được giữ làm mốc so sánh cho tab Biến động.
"""
import argparse, base64, json, math, os, sys, warnings
from datetime import datetime, timezone, timedelta
import openpyxl
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

warnings.filterwarnings("ignore")
ITER = 310_000
TOWER_NAMES = {"A": "Orchid", "B": "Bamboo", "C": "Lotus", "D": "Palm", "E": "Tamarind"}

def unit_type(pn, wc):
    if pn == 0: return "st"
    if pn == 1: return "1pn"
    if pn == 2: return "2pn1" if wc == 1 else "2pn2"
    return "3pn"

def read_prices(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["G PTTT02"]
    head = [str(c.value or "").strip() for c in ws[6]]
    need = {"Block": None, "Tầng": None, "Vị trí": None, "Mã căn": None, "Số PN": None, "Số WC": None}
    for k in need: need[k] = head.index(k)
    i_dt = next(i for i, h in enumerate(head) if h.startswith("Diện tích\ntim tường"))
    i_tt = next(i for i, h in enumerate(head) if h.startswith("Diện tích\nthông thủy"))
    i_dg = next(i for i, h in enumerate(head) if h.startswith("Đơn giá\nthông thủy"))
    i_net = next(i for i, h in enumerate(head) if h.startswith("Tổng giá trị căn hộ\n(chưa thuế"))
    units = []
    for r in ws.iter_rows(min_row=7, values_only=True):
        if not isinstance(r[0], (int, float)): continue
        code = str(r[need["Mã căn"]]).strip()
        dg, tt = int(r[i_dg]), float(r[i_tt])
        net = int(r[i_net])
        assert math.floor(dg * tt + 0.5) == net, f"{code}: đơn giá × thông thủy không khớp tổng giá"  # làm tròn như Math.round của trang
        units.append([code, str(r[need["Block"]]).strip(), int(r[need["Tầng"]]), str(r[need["Vị trí"]]).zfill(2),
                      unit_type(int(r[need["Số PN"]]), int(r[need["Số WC"]])), float(r[i_dt]), tt, net, -1, dg])
    return units

def read_stock(path):
    """Đọc rổ hàng; trả về {mã căn: 0 trống | 1 đã cọc | 2 hoàn tất cọc | 3 lock}. Viết khi có file rổ hàng thật."""
    raise SystemExit("Chưa hỗ trợ định dạng rổ hàng này: cần xem file thật để viết bộ đọc")

def kdf(pw, salt):
    return PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(pw.encode())

def decrypt(enc, pw):
    key = kdf(pw, base64.b64decode(enc["salt"]))
    return json.loads(AESGCM(key).decrypt(base64.b64decode(enc["iv"]), base64.b64decode(enc["ct"]), None))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--checkgia", required=True)
    ap.add_argument("--rohang")
    ap.add_argument("--stock-at")
    ap.add_argument("--price-src", default="file check giá 07/11/2026")
    ap.add_argument("--out", required=True)
    ap.add_argument("--live-url", help="Đường dẫn /exec của Apps Script rổ hàng; mã khóa lấy từ biến môi trường BPTH_LIVE_KEY")
    a = ap.parse_args()
    pw = os.environ.get("BPTH_PASS")
    if not pw or len(pw) < 12: sys.exit("Thiếu BPTH_PASS (ít nhất 12 ký tự)")
    units = read_prices(a.checkgia)
    prev = prev_at = None
    if os.path.exists(a.out):
        try:
            old = decrypt(json.load(open(a.out)), pw)
            if old.get("stockAt"):
                prev = {u[0]: u[8] for u in old["units"]}; prev_at = old["stockAt"]
        except Exception:
            print("Không đọc được dữ liệu cũ bằng mật khẩu này: bỏ qua mốc so sánh")
    stock_at = None
    if a.rohang:
        st = read_stock(a.rohang)
        for u in units: u[8] = st.get(u[0], -1)
        stock_at = a.stock_at or datetime.now(timezone(timedelta(hours=7))).strftime("%d/%m/%Y %H:%M")
    towers = {t: {"name": TOWER_NAMES.get(t, t)} for t in sorted({u[1] for u in units})}
    data = {"v": 1, "builtAt": datetime.now(timezone(timedelta(hours=7))).strftime("%d/%m/%Y %H:%M"),
            "priceSrc": a.price_src, "stockAt": stock_at, "towers": towers, "units": units}
    if prev and stock_at: data["prev"], data["prevAt"] = prev, prev_at
    if a.live_url:
        k = os.environ.get("BPTH_LIVE_KEY")
        if not k: sys.exit("Thiếu BPTH_LIVE_KEY cho rổ hàng trực tiếp")
        data["live"] = {"url": a.live_url, "k": k}
    salt, iv = os.urandom(16), os.urandom(12)
    ct = AESGCM(kdf(pw, salt)).encrypt(iv, json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode(), None)
    out = {"v": 1, "alg": "AES-GCM", "kdf": "PBKDF2-SHA256", "iter": ITER,
           "salt": base64.b64encode(salt).decode(), "iv": base64.b64encode(iv).decode(), "ct": base64.b64encode(ct).decode()}
    json.dump(out, open(a.out, "w"))
    print(f"{len(units)} căn · {len(towers)} tòa · rổ hàng: {'trực tiếp' if a.live_url else (stock_at or 'chưa có')} · {os.path.getsize(a.out)//1024} KB")

if __name__ == "__main__":
    main()
