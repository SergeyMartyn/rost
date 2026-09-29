/**
 * Receives paid orders from the Cloudflare Worker and appends a row to the tab
 * named in the request. Bound to the "Tickets" spreadsheet.
 *
 * Setup: Extensions → Apps Script → paste this file → Project settings → Script properties:
 *   SHEETS_TOKEN = <same random value as the Worker secret SHEETS_TOKEN>
 * Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 * Put the resulting /exec URL into the Worker secret SHEETS_WEBHOOK_URL.
 */
var HEADER = ['Оплачен (UTC)', 'ID заказа', 'Билет', 'Имя', 'Способ связи', 'Контакт', 'Email (Stripe)', 'Сумма, €', 'Статус'];

function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  var token = PropertiesService.getScriptProperties().getProperty('SHEETS_TOKEN');
  if (!token || body.token !== token) {
    return ContentService.createTextOutput('forbidden');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(body.tab) || ss.insertSheet(body.tab);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADER);
    var ids = sheet.getRange(1, 2, sheet.getLastRow(), 1).getValues().flat();
    if (ids.indexOf(body.row[1]) === -1) sheet.appendRow(body.row); // idempotent by order id
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}
