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
    const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwmpFdEGbKSCJ6eID7FoHU79cZhbrj1imbfbRStm3aJHY9oabEx-oLSfzVqPoBvFbZW/exec';
    await fetch(SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'payment', amount: transferAmount, content: content || '' }),
    }).catch(() => {});

    if (process.env.RESEND_API_KEY) {
      // Gửi email thông báo cho Coach Bạch Đằng
      await sendEmail({
        to: 'hoangbachdang@gmail.com',
        subject: `💰 Có học viên mới — ${transferAmount?.toLocaleString('vi-VN')}đ`,
        html: `
          <h2>Giao dịch mới nhận được</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #eee"><b>Gói</b></td><td style="padding:8px;border:1px solid #eee">${packageLabel}</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee"><b>Số tiền</b></td><td style="padding:8px;border:1px solid #eee">${transferAmount?.toLocaleString('vi-VN')}đ</td></tr>
            <tr><td style="padding:8px;border:1px solid #eee"><b>Nội dung CK</b></td><td style="padding:8px;border:1px solid #eee">${content || '—'}</td></tr>
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
