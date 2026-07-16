// Lead capture — nhận thông tin đăng ký + gửi email xác nhận cho khách
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, job } = req.body || {};
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzFCfeN4dMmb8ZPFwfqHgvmhFAat5vxIqFdScDcpztptMLgvFiULhQy8qHf_Vr70rVS/exec';

  try {
    // Ghi vào Google Sheet
    fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'lead', name, email, phone, job: job || '' }),
    }).catch(() => {});

    await Promise.all([
      // Email xác nhận gửi cho KHÁCH
      sendEmail({
        to: email,
        subject: `${name} ơi — Coach Bạch Đằng đã nhận thông tin của bạn!`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1f2937">
            <div style="background:linear-gradient(135deg,#EC4899,#F97316);padding:32px;border-radius:16px 16px 0 0;text-align:center">
              <h1 style="color:white;margin:0;font-size:24px">KOL AI Blueprint</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Coach Bạch Đằng</p>
            </div>
            <div style="padding:32px;background:#fff;border:1px solid #f3f4f6;border-radius:0 0 16px 16px">
              <p style="font-size:18px">Chào <strong>${name}</strong>,</p>
              <p>Coach Bạch Đằng đã nhận được thông tin đăng ký của bạn cho chương trình <strong>KOL AI Blueprint</strong>.</p>
              <div style="background:#fdf2f8;border-left:4px solid #EC4899;padding:16px;border-radius:8px;margin:20px 0">
                <p style="margin:0;font-weight:600">Bước tiếp theo:</p>
                <p style="margin:8px 0 0">Hoàn tất thanh toán để giữ chỗ. Coach sẽ liên hệ qua Zalo <strong>0784313668</strong> trong vòng 24h để xác nhận lịch buổi 1.</p>
              </div>
              <p style="color:#6b7280;font-size:14px">Nếu bạn có bất kỳ câu hỏi nào, nhắn tin Zalo cho Coach Bạch Đằng: <strong>0784313668</strong></p>
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
              <p style="color:#9ca3af;font-size:12px;text-align:center">© 2026 Coach Bạch Đằng · hoangbachdang.com</p>
            </div>
          </div>
        `,
      }),

      // Email thông báo cho COACH
      sendEmail({
        to: 'hoangbachdang@gmail.com',
        subject: `🙋 Lead mới — ${name} (${phone})`,
        html: `
          <h2>Có người đăng ký KOL AI Blueprint</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #eee"><b>Tên</b></td><td style="padding:8px;border:1px solid #eee">${name}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee"><b>Email</b></td><td style="padding:8px;border:1px solid #eee">${email}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee"><b>SĐT</b></td><td style="padding:8px;border:1px solid #eee">${phone}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee"><b>Ngành</b></td><td style="padding:8px;border:1px solid #eee">${job || '—'}</td></tr>
          </table>
          <p>Đang ở bước thanh toán — theo dõi email Sepay webhook để xác nhận chuyển khoản.</p>
        `,
      }),
    ]);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('submit-lead error:', err);
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
      from: 'Coach Bạch Đằng <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  });
  if (!r.ok) throw new Error(await r.text());
}
