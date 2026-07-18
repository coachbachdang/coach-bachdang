const SHEET_ID = 'PASTE_SHEET_ID_HERE';
const COURSE_PRICE = 1768686; // Học phí cố định — Khóa Học Giọng Nói Truyền Cảm Hứng
const API_KEY = '044d4690578d6df280ca71005a209eaeeadc073f546144a4'; // Phải khớp với SHEET_API_KEY trên Vercel

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data.key !== API_KEY) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Sheet1');
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  if (data.type === 'lead') {
    sheet.appendRow([now, 'Lead', data.name, data.email, data.phone, data.job || '', COURSE_PRICE, '']);
  } else if (data.type === 'payment') {
    sheet.appendRow([now, 'Thanh toán', '', '', '', '', data.amount, data.content || '']);
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
