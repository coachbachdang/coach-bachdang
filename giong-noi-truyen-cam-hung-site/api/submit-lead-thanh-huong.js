// Lead capture — Coach Thanh Hương (Khóa Học Giọng Nói Truyền Cảm Hứng)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, job } = req.body || {};
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzjPNrW1pUxj1jzDbOs6BJoduXqKpiUX7nduGg309FZlu1YpFm3h4m-7u8gaRxVMe8L/exec';

  try {
    // Ghi vào Google Sheet
    fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: process.env.SHEET_API_KEY, type: 'lead', name, email, phone, job: job || '' }),
    }).catch(() => {});

    await Promise.all([
      // Email xác nhận gửi cho KHÁCH
      sendEmail({
        to: email,
        subject: `${name} ơi — Coach Thanh Hương đã nhận thông tin của bạn!`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#3A2E22">
            <div style="background:linear-gradient(135deg,#C99A4B,#9C6B2E);padding:32px;border-radius:16px 16px 0 0;text-align:center">
              <h1 style="color:white;margin:0;font-size:24px">Giọng Nói Truyền Cảm Hứng</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Coach Thanh Hương</p>
            </div>
            <div style="padding:32px;background:#fff;border:1px solid #F3E9D7;border-radius:0 0 16px 16px">
              <p style="font-size:18px">Chào <strong>${name}</strong>,</p>
              <p>Coach Thanh Hương đã nhận được thông tin đăng ký của bạn cho <strong>Khóa Học Giọng Nói Truyền Cảm Hứng</strong>.</p>
              <div style="background:#FBF3E4;border-left:4px solid #9C6B2E;padding:16px;border-radius:8px;margin:20px 0">
                <p style="margin:0;font-weight:600">Bước tiếp theo:</p>
                <ol style="margin:8px 0 0;padding-left:20px;line-height:1.8">
                  <li>Chuyển khoản theo thông tin bên dưới hoặc <a href="https://giong-noi-truyen-cam-hung.vercel.app?pay=1" style="color:#9C6B2E">quét mã QR tại đây</a></li>
                  <li><strong>Chụp màn hình biên lai</strong> giao dịch</li>
                  <li>Gửi biên lai qua Zalo <strong>0933 44 35 11</strong> — Coach xác nhận ngay và hẹn lịch buổi 1</li>
                </ol>
              </div>

              <!-- Thông tin chuyển khoản -->
              <div style="background:#FBF6EC;border-radius:12px;padding:20px;margin:20px 0">
                <p style="margin:0 0 12px;font-weight:700;font-size:15px">Thông tin chuyển khoản</p>
                <table style="width:100%;border-collapse:collapse;font-size:14px">
                  <tr><td style="padding:6px 0;color:#8B7355;width:140px">Ngân hàng</td><td style="padding:6px 0;font-weight:600">Vietinbank</td></tr>
                  <tr><td style="padding:6px 0;color:#8B7355">Số tài khoản</td><td style="padding:6px 0;font-weight:700;letter-spacing:1px">0345945168</td></tr>
                  <tr><td style="padding:6px 0;color:#8B7355">Chủ tài khoản</td><td style="padding:6px 0;font-weight:600">BÙI THỊ THANH HƯƠNG</td></tr>
                  <tr><td style="padding:6px 0;color:#8B7355">Số tiền</td><td style="padding:6px 0;font-weight:700;color:#9C6B2E">1.768.686đ</td></tr>
                  <tr><td style="padding:6px 0;color:#8B7355">Nội dung CK</td><td style="padding:6px 0;font-weight:600;color:#9C6B2E">Giong noi ${name.split(' ').pop()} ${phone}</td></tr>
                </table>
              </div>

              <p style="color:#8B7355;font-size:14px">Có câu hỏi? Nhắn Zalo cho Coach Thanh Hương: <strong>0933 44 35 11</strong></p>
              <hr style="border:none;border-top:1px solid #F3E9D7;margin:24px 0">
              <p style="color:#B4A48D;font-size:12px;text-align:center">© 2026 Coach Thanh Hương</p>
            </div>
          </div>
        `,
      }),

      // Email thông báo cho COACH
      sendEmail({
        to: 'Ztruyenthong@gmail.com',
        subject: `🙋 Lead mới — ${name} (${phone})`,
        html: `
          <h2>Có người đăng ký Khóa Học Giọng Nói Truyền Cảm Hứng</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #eee"><b>Tên</b></td><td style="padding:8px;border:1px solid #eee">${name}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee"><b>Email</b></td><td style="padding:8px;border:1px solid #eee">${email}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee"><b>SĐT</b></td><td style="padding:8px;border:1px solid #eee">${phone}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee"><b>Ngành</b></td><td style="padding:8px;border:1px solid #eee">${job || '—'}</td></tr>
          </table>
          <p>Đang ở bước thanh toán — kiểm tra tài khoản Vietinbank để xác nhận chuyển khoản thủ công.</p>
        `,
      }),
    ]);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('submit-lead-thanh-huong error:', err);
    return res.status(200).json({ success: false });
  }
}

async function sendEmail({ to, subject, html }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_SENDER_THANH_HUONG || 'Coach Thanh Hương <noreply@hoangbachdang.com>',
      to,
      subject,
      html,
    }),
  });
  if (!r.ok) throw new Error(await r.text());
}
