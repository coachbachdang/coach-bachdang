const SHEET_ID = 'PASTE_SHEET_ID_HERE';
const COURSE_PRICE = 1768686; // Học phí cố định — Khóa Học Giọng Nói Truyền Cảm Hứng

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
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
