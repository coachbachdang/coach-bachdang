---
name: biz-payment-flow-sheets
description: "End-to-end payment flow cho landing page tĩnh (static HTML): Form đăng ký → email xác nhận → QR VietQR → Sepay webhook → Google Sheets + email tự động cho khách. Stack: static HTML + Vercel Functions + Resend + Google Apps Script + Google Sheets. USE WHEN: user muốn setup thanh toán cho landing page bán khóa học/coaching, không cần database phức tạp, chỉ cần Google Sheets để quản lý."
---

# Biz Payment Flow Sheets

Setup toàn bộ hệ thống nhận thanh toán cho landing page tĩnh. Sau khi xong:
- Khách điền Form → nhận email hướng dẫn thanh toán (tự động)
- Khách chuyển khoản (có SĐT trong nội dung) → nhận email xác nhận (tự động)
- Coach nhận thông báo mỗi khi có lead và thanh toán mới
- Mọi data ghi vào Google Sheet

**Stack**: Static HTML + Vercel Functions + Resend + Google Apps Script + Google Sheets + Sepay VietQR

---

## Thông tin cần thu thập từ khách (Phase 0)

Hỏi khách cung cấp đủ 8 thông tin sau trước khi bắt đầu:

| # | Thông tin | Ví dụ |
|---|-----------|-------|
| 1 | Tên coach / thương hiệu | Coach Bạch Đằng |
| 2 | Tên sản phẩm / khóa học | KOL AI Blueprint |
| 3 | Giá bán (VNĐ) | 6.800.000 |
| 4 | Ngân hàng | BIDV |
| 5 | Số tài khoản ngân hàng | 962478813313668 |
| 6 | Tên chủ tài khoản | HOANG BACH DANG |
| 7 | Email coach nhận thông báo | hoangbachdang@gmail.com |
| 8 | SĐT Zalo để khách liên hệ | 0784313668 |

Các thông tin sau thu thập ở bước tương ứng:
- **Sepay Virtual Account** → Phase 2
- **Sepay API Key** → Phase 2
- **Resend API Key** → Phase 4
- **Google Apps Script URL** → Phase 5
- **Domain email** (noreply@domain.com) → Phase 4

---

## Workflow 6 phase

```
Phase 0: Thu thập thông tin khách
       ↓
Phase 1: Tạo Google Sheet + Apps Script
       ↓
Phase 2: Setup Sepay (tài khoản ảo + webhook)
       ↓
Phase 3: Build landing page HTML + modal QR
       ↓
Phase 4: Setup Resend + domain email
       ↓
Phase 5: Build Vercel Functions (submit-lead + sepay-webhook)
       ↓
Phase 6: Deploy Vercel + test
```

---

## Phase 1 — Google Sheet + Apps Script

### 1.1 Tạo Google Sheet

1. Vào [sheets.google.com](https://sheets.google.com) → tạo sheet mới
2. Đặt tên: `[Tên sản phẩm] — Học Viên`
3. Đổi tên tab thành `Sheet1` (quan trọng — code tìm đúng tên này)
4. Hàng 1 — tiêu đề cột:

```
A: Thời gian | B: Loại | C: Tên | D: Email | E: SDT | F: Ngành | G: Số tiền | H: Nội dung CK
```

5. Copy Sheet ID từ URL: `docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

### 1.2 Apps Script

1. Trong Sheet → **Tiện ích mở rộng → Apps Script**
2. Xóa code mặc định, dán code sau (thay `SHEET_ID`):

```javascript
const SHEET_ID = 'PASTE_SHEET_ID_HERE';

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Sheet1');
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  if (data.type === 'lead') {
    sheet.appendRow([now, 'Lead', data.name, data.email, data.phone, data.job || '', '', '']);
  } else if (data.type === 'payment') {
    sheet.appendRow([now, 'Thanh toán', '', '', '', '', data.amount, data.content || '']);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const phone = e.parameter.phone || '';
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Sheet1');
  const data = sheet.getDataRange().getValues();

  let found = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === 'Lead' && String(data[i][4]).includes(phone)) {
      found = { name: data[i][2], email: data[i][3], phone: data[i][4] };
      // Không break — lấy dòng cuối cùng (đăng ký mới nhất)
    }
  }

  return ContentService.createTextOutput(JSON.stringify(found || {}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. **Deploy → New deployment**
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
4. Copy URL deployment → dùng ở Phase 5

---

## Phase 2 — Setup Sepay

1. Đăng ký tại [my.sepay.vn](https://my.sepay.vn) → liên kết tài khoản ngân hàng
2. Vào **Tài khoản ngân hàng** → copy **Số tài khoản ảo** (Virtual Account)
3. Vào **Webhook** → thêm URL: `https://[project].vercel.app/api/sepay-webhook`
4. Copy **API Key** của webhook

Lưu lại:
- `SEPAY_VIRTUAL_ACCOUNT` = số tài khoản ảo
- `SEPAY_API_KEY` = API key webhook (format: `sepay-[slug]-[random]`)

---

## Phase 3 — Landing Page HTML

Tạo file `thcn-ai.html` (hoặc tên phù hợp). Cấu trúc gồm 3 phần:

### 3.1 Lead Form Modal

```html
<!-- Trigger -->
<button onclick="openLead()">Đăng ký ngay</button>

<!-- Modal -->
<div id="leadModal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl p-8 max-w-md w-full">
    <h2>Đăng ký [Tên sản phẩm]</h2>
    <form id="leadForm" onsubmit="submitLead(event)">
      <input name="name" placeholder="Họ và tên *" required />
      <input name="email" type="email" placeholder="Email *" required />
      <input name="phone" type="tel" placeholder="Số điện thoại *" required />
      <input name="job" placeholder="Ngành nghề" />
      <button type="submit" id="leadBtn">Tiếp tục thanh toán →</button>
    </form>
  </div>
</div>
```

### 3.2 QR Modal

```html
<div id="payModal" class="hidden fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl p-8 max-w-md w-full text-center">
    <button onclick="closePay();openLead()">← Sửa thông tin đăng ký</button>
    <h2>Quét mã thanh toán</h2>
    <img id="qrImg" src="" alt="QR" class="mx-auto w-56 h-56" />
    <p>Số tiền: <strong>[GIÁ BÁN]đ</strong></p>
    <p>Nội dung gợi ý (có thể chỉnh):</p>
    <input id="payNote" type="text" class="w-full border rounded p-2 text-center" />
    <table>
      <tr><td>Ngân hàng</td><td>[NGÂN HÀNG]</td></tr>
      <tr><td>Số TK</td><td>[SỐ TK ẢO]</td></tr>
      <tr><td>Chủ TK</td><td>[TÊN CHỦ TK]</td></tr>
    </table>
    <p>Sau khi chuyển khoản, chụp biên lai gửi Zalo <strong>[SĐT ZALO]</strong></p>
  </div>
</div>
```

### 3.3 JavaScript

```javascript
let customerName = '';
let customerPhone = '';

// Nếu URL có ?pay=1 → mở thẳng QR, bỏ qua form
if (new URLSearchParams(location.search).get('pay') === '1') {
  window.addEventListener('DOMContentLoaded', () => openPay());
}

function openLead() {
  document.getElementById('leadModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLead() {
  document.getElementById('leadModal').classList.add('hidden');
  document.body.style.overflow = '';
}

function openPay() {
  closeLead();
  const modal = document.getElementById('payModal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  // Nội dung gợi ý: Tên viết tắt + SĐT
  const lastName = customerName ? customerName.split(' ').pop() : '[Ten]';
  const phone = customerPhone || '[SDT]';
  document.getElementById('payNote').value = `[TEN_SAN_PHAM] ${lastName} ${phone}`;
  document.getElementById('qrImg').src =
    `https://img.vietqr.io/image/[BANK_CODE]-[SO_TK_AO]-compact2.jpg?accountName=[TEN_CHU_TK_ENCODED]`;
}

function closePay() {
  document.getElementById('payModal').classList.add('hidden');
  document.body.style.overflow = '';
}

async function submitLead(e) {
  e.preventDefault();
  const btn = document.getElementById('leadBtn');
  btn.disabled = true;
  btn.textContent = 'Đang xử lý...';

  const form = e.target;
  customerName = form.name.value.trim();
  customerPhone = form.phone.value.trim();

  const data = {
    name: customerName,
    email: form.email.value.trim(),
    phone: customerPhone,
    job: form.job?.value.trim() || '',
  };

  try {
    await fetch('/api/submit-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (_) {}

  openPay();
  btn.disabled = false;
  btn.textContent = 'Tiếp tục thanh toán →';
}
```

**Thay thế các placeholder**: `[TEN_SAN_PHAM]`, `[NGAN_HANG]`, `[SO_TK_AO]`, `[TEN_CHU_TK]`, `[GIA_BAN]`, `[SDT_ZALO]`, `[BANK_CODE]`, `[TEN_CHU_TK_ENCODED]`

Bank code VietQR: BIDV=`BIDV`, Vietcombank=`VCB`, Techcombank=`TCB`, MB=`MB`, ACB=`ACB`, VPBank=`VPB`

---

## Phase 4 — Resend + Domain Email

1. Đăng ký [resend.com](https://resend.com) → vào **API Keys → Create API Key**
2. Copy key (chỉ hiện 1 lần) → lưu làm `RESEND_API_KEY`
3. Vào **Domains → Add Domain** → nhập domain của khách
4. Thêm các DNS record vào nhà cung cấp domain (tenten.vn / godaddy / cloudflare...)
5. Chờ verify (thường 5-15 phút)
6. Sender mặc định: `noreply@[domain]`

---

## Phase 5 — Vercel Functions

Tạo folder `api/` cùng cấp với HTML file.

### 5.1 `api/submit-lead.js`

```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, job } = req.body || {};
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const SHEET_URL = process.env.SHEET_URL;
  const COACH_NAME = process.env.COACH_NAME;
  const PRODUCT_NAME = process.env.PRODUCT_NAME;
  const COACH_EMAIL = process.env.COACH_EMAIL;
  const ZALO_PHONE = process.env.ZALO_PHONE;
  const BANK_NAME = process.env.BANK_NAME;
  const BANK_ACCOUNT = process.env.BANK_ACCOUNT;
  const BANK_OWNER = process.env.BANK_OWNER;
  const SITE_URL = process.env.SITE_URL;

  // Ghi vào Sheet (không await để không delay response)
  fetch(SHEET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'lead', name, email, phone, job: job || '' }),
  }).catch(() => {});

  const lastName = name.split(' ').pop();
  const transferNote = `${PRODUCT_NAME} ${lastName} ${phone}`;

  await Promise.all([
    // Email cho khách
    sendEmail({
      to: email,
      subject: `${name} ơi — ${COACH_NAME} đã nhận thông tin của bạn!`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1f2937">
          <p>Chào <strong>${name}</strong>,</p>
          <p>${COACH_NAME} đã nhận được thông tin đăng ký của bạn cho chương trình <strong>${PRODUCT_NAME}</strong>.</p>
          <p><strong>Bước tiếp theo:</strong></p>
          <ol>
            <li>Chuyển khoản theo thông tin bên dưới hoặc <a href="${SITE_URL}?pay=1">quét mã QR tại đây</a></li>
            <li>Chụp màn hình biên lai giao dịch</li>
            <li>Gửi biên lai qua Zalo <strong>${ZALO_PHONE}</strong> — Coach xác nhận ngay</li>
          </ol>
          <table style="border-collapse:collapse;width:100%;font-size:14px;margin:16px 0">
            <tr><td style="padding:6px;color:#6b7280;width:140px">Ngân hàng</td><td style="padding:6px;font-weight:600">${BANK_NAME}</td></tr>
            <tr><td style="padding:6px;color:#6b7280">Số tài khoản</td><td style="padding:6px;font-weight:700">${BANK_ACCOUNT}</td></tr>
            <tr><td style="padding:6px;color:#6b7280">Chủ tài khoản</td><td style="padding:6px;font-weight:600">${BANK_OWNER}</td></tr>
            <tr><td style="padding:6px;color:#6b7280">Nội dung CK</td><td style="padding:6px;font-weight:600;color:#EC4899">${transferNote}</td></tr>
          </table>
          <p style="color:#6b7280;font-size:14px">Có câu hỏi? Nhắn Zalo: <strong>${ZALO_PHONE}</strong></p>
        </div>
      `,
    }),
    // Email cho coach
    sendEmail({
      to: COACH_EMAIL,
      subject: `Lead mới — ${name} (${phone})`,
      html: `<h3>Có người đăng ký ${PRODUCT_NAME}</h3>
        <p>Tên: ${name}<br>Email: ${email}<br>SĐT: ${phone}<br>Ngành: ${job || '—'}</p>`,
    }),
  ]);

  return res.status(200).json({ success: true });
}

async function sendEmail({ to, subject, html }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_SENDER,
      to,
      subject,
      html,
    }),
  });
  if (!r.ok) throw new Error(await r.text());
}
```

### 5.2 `api/sepay-webhook.js`

```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const authHeader = req.headers['authorization'] || '';
  if (process.env.SEPAY_API_KEY && authHeader !== `Apikey ${process.env.SEPAY_API_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { transferAmount, content, transferType, id: transactionId } = req.body || {};
  if (transferType !== 'in') return res.status(200).json({ success: true });

  const SHEET_URL = process.env.SHEET_URL;

  // Ghi vào Sheet
  await fetch(SHEET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'payment', amount: transferAmount, content: content || '' }),
  }).catch(() => {});

  if (process.env.RESEND_API_KEY) {
    // Tìm SĐT trong nội dung (10 số, bắt đầu 0)
    const phoneMatch = (content || '').match(/\b(0\d{9,10})\b/);
    const phone = phoneMatch ? phoneMatch[1] : null;

    let customerEmail = null;
    let customerName = null;

    if (phone) {
      // Thử cả 0xxxxxxxxx và xxxxxxxxx
      const variants = [phone, phone.replace(/^0/, '')];
      try {
        for (const p of variants) {
          const r = await fetch(`${SHEET_URL}?phone=${p}`);
          const d = await r.json();
          if (d.email) { customerEmail = d.email; customerName = d.name; break; }
        }
      } catch (_) {}
    }

    // Email xác nhận cho khách
    if (customerEmail) {
      await sendEmail({
        to: customerEmail,
        subject: `${customerName || 'Bạn'} ơi — ${process.env.COACH_NAME} đã nhận được thanh toán!`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto">
            <p>Chào <strong>${customerName || 'bạn'}</strong>,</p>
            <p>${process.env.COACH_NAME} đã nhận được khoản thanh toán của bạn.</p>
            <p>Số tiền: <strong>${transferAmount?.toLocaleString('vi-VN')}đ</strong></p>
            <p>Coach sẽ liên hệ Zalo <strong>${process.env.ZALO_PHONE}</strong> trong 24h để xác nhận lịch buổi 1.</p>
          </div>
        `,
      });
    }

    // Email thông báo cho coach
    await sendEmail({
      to: process.env.COACH_EMAIL,
      subject: `Có thanh toán mới — ${transferAmount?.toLocaleString('vi-VN')}đ`,
      html: `<h3>Giao dịch mới</h3>
        <p>Số tiền: ${transferAmount?.toLocaleString('vi-VN')}đ<br>
        Nội dung: ${content || '—'}<br>
        Khách: ${customerName || '—'} ${customerEmail ? `(${customerEmail})` : '(chưa tìm thấy)'}<br>
        Mã GD: ${transactionId}</p>`,
    });
  }

  return res.status(200).json({ success: true });
}

async function sendEmail({ to, subject, html }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: process.env.EMAIL_SENDER, to, subject, html }),
  });
  if (!r.ok) throw new Error(await r.text());
}
```

---

## Phase 6 — Deploy Vercel

### 6.1 Cấu trúc thư mục

```
project/
├── index.html          (hoặc tên-slug.html)
├── api/
│   ├── submit-lead.js
│   └── sepay-webhook.js
├── package.json
└── vercel.json
```

### 6.2 `package.json`

```json
{
  "name": "project-slug",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": "24.x" }
}
```

### 6.3 `vercel.json`

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### 6.4 Environment Variables

Set các env vars sau trên Vercel (dashboard hoặc `vercel env add`):

| Key | Giá trị |
|-----|---------|
| `RESEND_API_KEY` | Key từ resend.com |
| `SEPAY_API_KEY` | API key từ Sepay webhook |
| `SHEET_URL` | Apps Script deployment URL |
| `COACH_NAME` | Tên coach |
| `PRODUCT_NAME` | Tên sản phẩm |
| `COACH_EMAIL` | Email coach nhận thông báo |
| `ZALO_PHONE` | SĐT Zalo coach |
| `BANK_NAME` | Tên ngân hàng |
| `BANK_ACCOUNT` | Số tài khoản ảo Sepay |
| `BANK_OWNER` | Tên chủ tài khoản |
| `SITE_URL` | URL trang bán hàng (vd: https://domain.com/san-pham) |
| `EMAIL_SENDER` | noreply@domain.com |

### 6.5 Deploy

```bash
cd project/
vercel --prod --yes
```

Sau deploy → copy production URL → cập nhật `SITE_URL` env var → redeploy.

### 6.6 Cấu hình Sepay Webhook

Vào Sepay dashboard → Webhook → điền URL:
```
https://[project].vercel.app/api/sepay-webhook
```

---

## Phase 7 — Test

Chạy lần lượt 3 test sau:

### Test 1 — Form + Email

Mở trang → điền form → kiểm tra:
- Email xác nhận gửi đến khách ✓
- Email thông báo gửi đến coach ✓
- Dòng Lead xuất hiện trong Sheet ✓

### Test 2 — Webhook giả lập

Thay `[PROJECT]`, `[SEPAY_API_KEY]`, `[PHONE]` rồi chạy PowerShell:

```powershell
$body = '{"id":"TEST001","transferAmount":6800000,"content":"[TEN_SP] Ten 0[PHONE]","accountNumber":"[SO_TK_AO]","transferType":"in"}'
$headers = @{
  "Content-Type" = "application/json"
  "Authorization" = "Apikey [SEPAY_API_KEY]"
}
Invoke-RestMethod -Uri "https://[PROJECT].vercel.app/api/sepay-webhook" -Method POST -Headers $headers -Body $body | ConvertTo-Json
```

Kiểm tra:
- Dòng Thanh toán xuất hiện trong Sheet ✓
- Email xác nhận gửi đến khách (nếu SĐT có trong Sheet) ✓
- Email thông báo gửi đến coach ✓

### Test 3 — Link ?pay=1

Mở `https://[domain]/[slug]?pay=1` → kiểm tra modal QR mở thẳng không qua form.

---

## Lưu ý quan trọng

- **Nội dung chuyển khoản phải có SĐT** — gợi ý trên trang: `[Tên SP] [Tên] [SĐT]`
- **Sheet name phải là `Sheet1`** — không có khoảng trắng, phân biệt hoa thường
- **Apps Script phải deploy lại** mỗi khi sửa code (New deployment)
- **Resend API Key chỉ hiện 1 lần** — copy ngay khi tạo
- **Domain email phải verify** trên Resend trước khi gửi được cho người ngoài
