/* Redstar website leads: Google Sheets only. No bot or token required. */
const SHEET_ID = '1R_l94R9Qu84GR18RoVctYjZt0dSp9kTFhKioUBzFFV0';
const TAB_NAME = 'Заявки сайта';
const HEADERS = ['ID заявки', 'Дата (Москва)', 'Имя', 'Телефон', 'Задача',
  'Страница формы', 'Название страницы', 'Страница перехода', 'Блок кнопки',
  'Текст кнопки', 'Форма', 'Согласие на обработку', 'Политика конфиденциальности',
  'UTM source', 'UTM medium', 'UTM campaign'];

// Run once manually to prepare the sheet.
function setup() {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const book = SpreadsheetApp.openById(SHEET_ID);
    let sheet = book.getSheetByName(TAB_NAME);
    if (!sheet) sheet = book.insertSheet(TAB_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#0d3674').setFontColor('#ffffff');
    }
    validateHeaders_(sheet);
  } finally { lock.releaseLock(); }
  console.log('Готово. Создан лист «Заявки сайта». Теперь разверните веб-приложение.');
}

function doPost(e) {
  let lock;
  try {
    const body = e && e.postData && e.postData.contents;
    if (!body || body.length > 16000) return json_({ok: false, code: 'invalid'});
    const data = JSON.parse(body);
    if (!valid_(data)) return json_({ok: false, code: 'invalid'});
    lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) return json_({ok: false, code: 'busy'});
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB_NAME);
    validateHeaders_(sheet);
    const match = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).createTextFinder(data.request_id).matchEntireCell(true).findNext() : null;
    if (match) return json_({ok: true, request_id: data.request_id});
    // A small per-phone burst limit; not a replacement for a CAPTCHA under attack.
    const cache = CacheService.getScriptCache();
    const rateKey = 'phone:' + data.phone.replace(/\D/g, '');
    if (Number(cache.get(rateKey) || 0) >= 5) return json_({ok: false, code: 'rate_limit'});
    const row = [data.request_id, stamp_(), data.name, data.phone, data.task || '',
      data.page_url, data.page_title || '', data.source_page || '', data.source_block || 'Без перехода по кнопке',
      data.source_button || '', data.form_id || '', 'Да', 'Да',
      data.utm_source || '', data.utm_medium || '', data.utm_campaign || ''];
    sheet.appendRow(row.map(safeCell_));
    SpreadsheetApp.flush(); // Confirm success only after the row is saved.
    cache.put(rateKey, String(Number(cache.get(rateKey) || 0) + 1), 600);
    return json_({ok: true, request_id: data.request_id});
  } catch (_) {
    return json_({ok: false, code: 'unavailable'});
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function valid_(d) {
  if (!d || typeof d !== 'object' || d.website || d.personal_data_consent !== true || d.privacy_consent !== true) return false;
  const limits = {request_id: 80, name: 120, phone: 30, task: 1500, page_url: 500, page_title: 180,
    source_page: 500, source_block: 180, source_button: 120, form_id: 100, utm_source: 100, utm_medium: 100, utm_campaign: 150};
  for (const key in limits) if (d[key] != null && (typeof d[key] !== 'string' || d[key].length > limits[key])) return false;
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(d.request_id || '') || !(d.name || '').trim()) return false;
  if (!/^7\d{10}$/.test((d.phone || '').replace(/\D/g, ''))) return false;
  // Origin data is client-supplied attribution, not authentication.
  return /^https:\/\/(?:redstar\.agency|www\.redstar\.agency|redstaragency\.ru|www\.redstaragency\.ru|kapustina-ann\.github\.io)(?:\/|$)/.test(d.page_url || '');
}
function safeCell_(v) { return typeof v === 'string' && /^[\s]*[=+\-@]/.test(v) ? "'" + v : v; }
function stamp_() { return Utilities.formatDate(new Date(), 'Europe/Moscow', 'yyyy-MM-dd HH:mm:ss'); }
function validateHeaders_(sheet) {
  if (!sheet || JSON.stringify(sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0]) !== JSON.stringify(HEADERS)) {
    throw new Error('Не меняйте порядок колонок листа «Заявки сайта».');
  }
}
function json_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
