var SHEET_NAME = 'Đăng ký tư vấn';
var COACH_EMAIL = 'hoangbachdang@gmail.com';
var CALENDAR_URL = 'https://calendar.app.google/FachrnGSrjeT1ote9';
var PREP_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScOfWNRsgYB74s5Krq4mfH2hYrKqhqi9JozFMAjRaFI9P_uhA/viewform';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var name        = data.name    || '';
    var phone       = data.phone   || '';
    var clientEmail = data.email   || '';
    var goal        = data.goal    || '';
    var message     = data.message || '';

    // Ghi vào Google Sheets
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Thời gian gửi','Họ và tên','Số điện thoại/Zalo','Email','Chủ đề','Lịch xác nhận','Chia sẻ thêm']);
    }
    sheet.appendRow([new Date(), name, phone, clientEmail, goal, '', message]);

    // Email xác nhận gửi cho khách
    if (clientEmail) {
      var clientSubject = 'Xác nhận đăng ký tư vấn — Coach Bạch Đằng | Ageas Life';
      var clientBody = 'Xin chào ' + name + ',\n\n'
        + 'Coach Bạch Đằng đã nhận được yêu cầu tư vấn của bạn.\n\n'
        + 'THÔNG TIN ĐĂNG KÝ\n'
        + '- Họ tên: ' + name + '\n'
        + '- Số điện thoại/Zalo: ' + phone + '\n'
        + '- Chủ đề: ' + goal + '\n\n'
        + 'BƯỚC TIẾP THEO\n'
        + '1. Chọn khung giờ phù hợp tại: ' + CALENDAR_URL + '\n'
        + '2. Coach sẽ xác nhận lịch trong vòng 24 giờ\n'
        + '3. Trước buổi hẹn 24h, bạn sẽ nhận email nhắc kèm form chuẩn bị\n\n'
        + 'Nếu cần hỗ trợ, nhắn Zalo: 0784 313 668\n\n'
        + 'Trân trọng,\n'
        + 'Coach Hoàng Bạch Đằng\n'
        + 'Founder Ageas Life™';
      GmailApp.sendEmail(clientEmail, clientSubject, clientBody);
    }

    // Email thông báo cho Coach
    var coachSubject = '[Ageas Life] Khách hàng mới đặt lịch tư vấn';
    var coachBody = 'Coach Bạch Đằng ơi,\n\n'
      + 'Vừa có khách hàng mới đăng ký:\n\n'
      + '- Họ tên: ' + name + '\n'
      + '- Số điện thoại/Zalo: ' + phone + '\n'
      + '- Email: ' + clientEmail + '\n'
      + '- Chủ đề: ' + goal + '\n'
      + '- Chia sẻ thêm: ' + message + '\n\n'
      + 'Thời gian đăng ký: ' + new Date().toLocaleString('vi-VN') + '\n\n'
      + 'Vui lòng xác nhận lịch trong vòng 24 giờ.\n\n'
      + 'Ageas Life™ — Hệ thống tự động';
    GmailApp.sendEmail(COACH_EMAIL, coachSubject, coachBody);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function syncCalendarToSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  var cal   = CalendarApp.getDefaultCalendar();
  var now   = new Date();
  var start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  var end   = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  var events = cal.getEvents(start, end);

  var data      = sheet.getDataRange().getValues();
  var emailCol  = 3; // cột Email (index 0)
  var calCol    = 5; // cột Lịch xác nhận

  for (var i = 1; i < data.length; i++) {
    var rowEmail = data[i][emailCol].toString().toLowerCase().trim();
    if (!rowEmail) continue;
    for (var j = 0; j < events.length; j++) {
      var ev = events[j];
      var guests = ev.getGuestList();
      for (var k = 0; k < guests.length; k++) {
        if (guests[k].getEmail().toLowerCase() === rowEmail) {
          var timeStr = Utilities.formatDate(ev.getStartTime(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
          sheet.getRange(i + 1, calCol + 1).setValue(timeStr);
        }
      }
    }
  }
}

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
      GmailApp.sendEmail(clientEmail, subject, body);
    }
  }
}

function createTriggers() {
  // Xóa trigger cũ tránh trùng
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  // Đồng bộ Calendar mỗi giờ
  ScriptApp.newTrigger('syncCalendarToSheet')
    .timeBased().everyHours(1).create();
  // Gửi email nhắc lịch mỗi ngày lúc 8h sáng
  ScriptApp.newTrigger('sendReminderEmails')
    .timeBased().everyDays(1).atHour(8).create();
}
