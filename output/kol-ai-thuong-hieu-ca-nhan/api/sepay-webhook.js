// Sepay webhook handler — nhận thông báo giao dịch + gửi email xác nhận
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify API key từ Sepay
  const authHeader = req.headers['authorization'] || '';
  const expectedKey = `Apikey ${process.env.SEPAY_API_KEY}`;
  if (process.env.SEPAY_API_KEY && authHeader !== expectedKey) {
    console.warn('Unauthorized webhook attempt:', authHeader);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const data = req.body;
    const { transferAmount, content, accountNumber, transferType, id: transactionId } = data;

    console.log('=== SEPAY TRANSACTION ===');
    console.log('ID:', transactionId);
    console.log('Amount:', transferAmount?.toLocaleString('vi-VN'), 'VNĐ');
    console.log('Content:', content);

    // Chỉ xử lý tiền vào
    if (transferType !== 'in') {
      return res.status(200).json({ success: true, message: 'Ignored outgoing' });
    }

    const FULL_PRICE    = 6800000;
    const INSTALL_PRICE = 3400000;

    let packageType = 'other';
    let packageLabel = `Giao dịch ${transferAmount?.toLocaleString('vi-VN')}đ`;
    if (transferAmount >= FULL_PRICE) {
      packageType  = 'full';
      packageLabel = 'KOL AI Blueprint — Thanh toán đầy đủ';
    } else if (transferAmount >= INSTALL_PRICE) {
      packageType  = 'installment';
      packageLabel = 'KOL AI Blueprint — Đợt 1/2';
    }

    // Ghi vào Google Sheet
    const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxJ6JVJ0N1YvjhmBlubwCQ3Z_f459wkjSwE1-_sWukxnu0nthA5XVKtjshiJPhzYdz6/exec';
    await fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'payment', amount: transferAmount, content: content || '' }),
    }).catch(() => {});

    if (process.env.RESEND_API_KEY) {
      // Tìm SĐT trong nội dung CK (10-11 số)
      const phoneMatch = (content || '').match(/\b(0\d{9,10})\b/);
      const phone = phoneMatch ? phoneMatch[1] : null;

      // Tìm email khách trong Sheet theo SĐT
      let customerEmail = null;
      let customerName = null;
      if (phone) {
        const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxJ6JVJ0N1YvjhmBlubwCQ3Z_f459wkjSwE1-_sWukxnu0nthA5XVKtjshiJPhzYdz6/exec';
        // Thử cả hai dạng: có số 0 đầu và không có
        const phoneVariants = [phone, phone.replace(/^0/, '')];
        try {
          for (const p of phoneVariants) {
            const r = await fetch(`${SHEET_URL}?phone=${p}`);
            const d = await r.json();
            if (d.email) { customerEmail = d.email; customerName = d.name; break; }
          }
        } catch (_) {}
      }

      // Gửi email xác nhận cho khách nếu tìm được
      if (customerEmail) {
        await sendEmail({
          to: customerEmail,
          subject: `${customerName || 'Bạn'} ơi — Coach Bạch Đằng đã nhận được thanh toán!`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1f2937">
              <div style="background:linear-gradient(135deg,#EC4899,#F97316);padding:32px;border-radius:16px 16px 0 0;text-align:center">
                <h1 style="color:white;margin:0;font-size:24px">KOL AI Blueprint</h1>
                <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Coach Bạch Đằng</p>
              </div>
              <div style="padding:32px;background:#fff;border:1px solid #f3f4f6;border-radius:0 0 16px 16px">
                <p style="font-size:18px">Chào <strong>${customerName || 'bạn'}</strong>,</p>
                <p>Coach Bạch Đằng đã nhận được khoản thanh toán của bạn.</p>
                <div style="background:#fdf2f8;border-left:4px solid #EC4899;padding:16px;border-radius:8px;margin:20px 0">
                  <table style="width:100%;font-size:14px">
                    <tr><td style="color:#6b7280;padding:4px 0;width:140px">Số tiền</td><td style="font-weight:700;color:#EC4899">${transferAmount?.toLocaleString('vi-VN')}đ</td></tr>
                    <tr><td style="color:#6b7280;padding:4px 0">Nội dung CK</td><td style="font-weight:600">${content || '—'}</td></tr>
                  </table>
                </div>
                <p>Coach sẽ liên hệ qua Zalo <strong>0784313668</strong> trong vòng 24h để xác nhận lịch buổi 1.</p>
                <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
                <p style="color:#9ca3af;font-size:12px;text-align:center">© 2026 Coach Bạch Đằng · hoangbachdang.com</p>
              </div>
            </div>
          `,
        });
        console.log('Email sent to customer:', customerEmail);
      }

      // Gửi email thông báo cho Coach Bạch Đằng
      await sendEmail({
        to: 'hoangbachdang@gmail.com',
        subject: `💰 Có thanh toán mới — ${transferAmount?.toLocaleString('vi-VN')}đ`,
        html: `
          <h2>Giao dịch mới nhận được</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #eee"><b>Gói</b></td><td style="padding:8px;border:1px solid #eee">${packageLabel}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee"><b>Số tiền</b></td><td style="padding:8px;border:1px solid #eee">${transferAmount?.toLocaleString('vi-VN')}đ</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee"><b>Nội dung CK</b></td><td style="padding:8px;border:1px solid #eee">${content || '—'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee"><b>Khách</b></td><td style="padding:8px;border:1px solid #eee">${customerName || '—'} ${customerEmail ? `(${customerEmail})` : '(không tìm thấy)'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee"><b>Mã GD</b></td><td style="padding:8px;border:1px solid #eee">${transactionId}</td></tr>
          </table>
          <p style="margin-top:16px">Liên hệ học viên để xác nhận lịch coaching buổi 1.</p>
        `,
      });
      console.log('Email sent to coach');
    }

    return res.status(200).json({ success: true, transactionId, amount: transferAmount, packageType });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(200).json({ success: false, error: err.message });
  }
}

async function sendEmail({ to, subject, html }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Coach Bạch Đằng <noreply@hoangbachdang.com>',
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Resend error: ${err}`);
  }
  return response.json();
}
