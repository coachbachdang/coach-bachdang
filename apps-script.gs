var SHEET_NAME   = 'Đăng ký tư vấn';
var COACH_EMAIL  = 'hoangbachdang@gmail.com';
var CALENDAR_URL = 'https://calendar.app.google/FachrnGSrjeT1ote9';
var PREP_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScOfWNRsgYB74s5Krq4mfH2hYrKqhqi9JozFMAjRaFI9P_uhA/viewform';
var TZ = 'Asia/Ho_Chi_Minh';

function doGet(e) {
  try {
    _saveToSheet(
      e.parameter.name    || '',
      e.parameter.phone   || '',
      e.parameter.email   || '',
      e.parameter.goal    || '',
      e.parameter.message || ''
    );
  } catch (err) {}
  return ContentService.createTextOutput('ok');
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    _saveToSheet(
      data.name    || '',
      data.phone   || '',
      data.email   || '',
      data.goal    || '',
      data.message || ''
    );
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function _saveToSheet(name, phone, clientEmail, goal, message) {
  if (!name && !phone && !clientEmail) return;
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Thời gian gửi', 'Họ và tên', 'Số điện thoại/Zalo', 'Email', 'Chủ đề', 'Lịch xác nhận', 'Chia sẻ thêm']);
  }
  sheet.appendRow([new Date(), name, phone, clientEmail, goal, '', message]);
}

// Trigger chạy mỗi 1 phút — gửi email cho row mới
function checkNewRegistrations() {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var sheet   = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  var props   = PropertiesService.getScriptProperties();
  var lastSent = parseInt(props.getProperty('lastSentRow') || '1');

  if (lastRow <= lastSent) return;

  var data = sheet.getDataRange().getValues();
  for (var r = lastSent + 1; r <= lastRow; r++) {
    var row = data[r - 1];
    var name        = row[1] || '';
    var phone       = row[2] || '';
    var clientEmail = row[3] || '';
    var goal        = row[4] || '';
    var message     = row[6] || '';
    if (name || phone || clientEmail) {
      _sendEmails(name, phone, clientEmail, goal, message);
    }
  }
  props.setProperty('lastSentRow', lastRow.toString());
}

function _sendEmails(name, phone, clientEmail, goal, message) {
  // Email gửi cho khách hàng
  if (clientEmail) {
    var clientSubject = 'Xác nhận đăng ký tư vấn — Coach Bạch Đằng | Ageas Life';
    var clientHtml = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">'
      + '<h2 style="color:#8B6914">Coach Bạch Đằng | Ageas Life™</h2>'
      + '<p>Xin chào <strong>' + name + '</strong>,</p>'
      + '<p>Coach Bạch Đằng đã nhận được yêu cầu tư vấn của bạn.</p>'
      + '<hr style="border:1px solid #e8d5a3">'
      + '<h3 style="color:#8B6914">THÔNG TIN ĐĂNG KÝ</h3>'
      + '<ul>'
      + '<li><strong>Họ tên:</strong> ' + name + '</li>'
      + '<li><strong>Số điện thoại/Zalo:</strong> ' + phone + '</li>'
      + '<li><strong>Chủ đề:</strong> ' + goal + '</li>'
      + '</ul>'
      + '<hr style="border:1px solid #e8d5a3">'
      + '<h3 style="color:#8B6914">BƯỚC TIẾP THEO</h3>'
      + '<ol>'
      + '<li>Chọn khung giờ phù hợp tại: <a href="' + CALENDAR_URL + '">' + CALENDAR_URL + '</a></li>'
      + '<li>Coach sẽ xác nhận lịch trong vòng 24 giờ</li>'
      + '<li>Trước buổi hẹn 24h, bạn sẽ nhận email nhắc kèm form chuẩn bị</li>'
      + '</ol>'
      + '<p>Nếu cần hỗ trợ, nhắn Zalo: <strong>0784 313 668</strong></p>'
      + '<p>Trân trọng,<br><strong>Coach Hoàng Bạch Đằng</strong><br>Founder Ageas Life™</p>'
      + '</div>';
    MailApp.sendEmail(clientEmail, clientSubject, '', { htmlBody: clientHtml });
  }

  // Email gửi cho Coach
  var coachSubject = '[Ageas Life] Khách hàng mới đặt lịch tư vấn';
  var coachBody = 'Coach Bạch Đằng ơi,\n\n'
    + 'Vừa có khách hàng mới đăng ký:\n\n'
    + '- Họ tên: ' + name + '\n'
    + '- Số điện thoại/Zalo: ' + phone + '\n'
    + '- Email: ' + clientEmail + '\n'
    + '- Chủ đề: ' + goal + '\n'
    + '- Chia sẻ thêm: ' + message + '\n\n'
    + 'Thời gian đăng ký: ' + Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm') + '\n\n'
    + 'Vui lòng xác nhận lịch trong vòng 24 giờ.\n\n'
    + 'Ageas Life™ — Hệ thống tự động';
  MailApp.sendEmail(COACH_EMAIL, coachSubject, coachBody);
}

// Trigger chạy mỗi 1 phút — đồng bộ lịch từ Google Calendar
function syncCalendarToSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  // Xóa toàn bộ cột F trước khi ghi lại
  sheet.getRange(2, 6, lastRow - 1, 1).clearContent();

  var cal    = CalendarApp.getDefaultCalendar();
  var now    = new Date();
  var end    = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  var events = cal.getEvents(now, end);

  var data = sheet.getDataRange().getValues();

  // Tìm email → sự kiện sớm nhất trong tương lai
  var emailToEvent = {};
  for (var j = 0; j < events.length; j++) {
    var ev = events[j];
    var guests = ev.getGuestList();
    for (var k = 0; k < guests.length; k++) {
      var gEmail = guests[k].getEmail().toLowerCase().trim();
      if (!gEmail) continue;
      if (!emailToEvent[gEmail] || ev.getStartTime() < emailToEvent[gEmail].getStartTime()) {
        emailToEvent[gEmail] = ev;
      }
    }
  }

  // Tìm row CUỐI CÙNG cho mỗi email
  var emailToLastRow = {};
  for (var i = 1; i < data.length; i++) {
    var rowEmail = (data[i][3] || '').toString().toLowerCase().trim();
    if (rowEmail) emailToLastRow[rowEmail] = i + 1; // 1-based sheet row
  }

  // Ghi lịch vào row cuối cùng của từng email
  for (var email in emailToEvent) {
    if (emailToLastRow[email]) {
      var timeStr = Utilities.formatDate(
        emailToEvent[email].getStartTime(),
        TZ,
        'dd/MM/yyyy HH:mm'
      );
      sheet.getRange(emailToLastRow[email], 6).setValue(timeStr);
    }
  }
}

// Trigger chạy mỗi ngày lúc 8h — nhắc lịch trước 24h
function sendReminderEmails() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var now  = new Date();

  for (var i = 1; i < data.length; i++) {
    var name        = data[i][1];
    var clientEmail = data[i][3];
    var calTime     = data[i][5];
    if (!clientEmail || !calTime) continue;

    var parts = calTime.toString().split(' ');
    if (parts.length < 2) continue;
    var dateParts = parts[0].split('/');
    var timeParts = parts[1].split(':');
    if (dateParts.length < 3 || timeParts.length < 2) continue;

    var apptDate = new Date(
      parseInt(dateParts[2]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[0]),
      parseInt(timeParts[0]),
      parseInt(timeParts[1])
    );

    var hoursLeft = (apptDate - now) / (1000 * 60 * 60);
    if (hoursLeft > 0 && hoursLeft <= 26) {
      var subject = 'Nhắc lịch tư vấn ngày mai — Coach Bạch Đằng';
      var body = 'Xin chào ' + name + ',\n\n'
        + 'Nhắc nhở: bạn có buổi tư vấn với Coach Bạch Đằng vào ' + calTime + '.\n\n'
        + 'Để buổi tư vấn hiệu quả nhất, vui lòng điền form chuẩn bị trước:\n'
        + PREP_FORM_URL + '\n\n'
        + 'Nếu cần đổi lịch, nhắn Zalo: 0784 313 668\n\n'
        + 'Trân trọng,\n'
        + 'Coach Hoàng Bạch Đằng\n'
        + 'Founder Ageas Life™';
      MailApp.sendEmail(clientEmail, subject, body);
    }
  }
}

// Chạy 1 lần sau khi paste code mới: xóa trigger cũ, tạo lại đúng
function createTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger('checkNewRegistrations').timeBased().everyMinutes(1).create();
  ScriptApp.newTrigger('syncCalendarToSheet').timeBased().everyMinutes(1).create();
  ScriptApp.newTrigger('sendReminderEmails').timeBased().everyDays(1).atHour(8).create();
}

// Chạy 1 lần sau khi paste code mới: reset tracking về row hiện tại
function resetTracking() {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var sheet   = ss.getSheetByName(SHEET_NAME);
  var lastRow = sheet ? sheet.getLastRow() : 1;
  PropertiesService.getScriptProperties().setProperty('lastSentRow', lastRow.toString());
  Logger.log('lastSentRow reset to: ' + lastRow);
}
