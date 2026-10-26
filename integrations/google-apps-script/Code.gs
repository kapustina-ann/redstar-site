/* Redstar website leads. Secrets belong ONLY in Apps Script > Script Properties. */
const SHEET_ID = '1R_l94R9Qu84GR18RoVctYjZt0dSp9kTFhKioUBzFFV0';
const TAB_NAME = 'Заявки сайта';
const CHAT_TITLE = 'Редстар — продажи';
const HEADERS = ['ID заявки', 'Дата (Москва)', 'Имя', 'Телефон', 'Задача',
  'Страница формы', 'Название страницы', 'Страница перехода', 'Блок кнопки',
  'Текст кнопки', 'Форма', 'Согласие на обработку', 'Политика конфиденциальности',
  'Telegram', 'Попытки Telegram', 'Последняя попытка', 'UTM source', 'UTM medium', 'UTM campaign'];

// Run once manually after saving TELEGRAM_BOT_TOKEN in Script Properties.
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('TELEGRAM_BOT_TOKEN')) throw new Error('Добавьте TELEGRAM_BOT_TOKEN в свойства скрипта.');
  if (!props.getProperty('TELEGRAM_CHAT_ID')) {
    const updates = telegram_('getUpdates', {allowed_updates: ['message', 'my_chat_member'], limit: 100});
    const chats = {};
    updates.forEach(function (u) {
      const item = u.message || u.my_chat_member;
      const chat = item && item.chat;
      if (chat && ['group', 'supergroup'].indexOf(chat.type) !== -1 && chat.title === CHAT_TITLE) chats[String(chat.id)] = true;
    });
    const ids = Object.keys(chats);
    if (ids.length !== 1) throw new Error('Не удалось однозначно найти группу «' + CHAT_TITLE + '». Отправьте в ней /start@redstaragency_leads_bot и снова запустите setup.');
    props.setProperty('TELEGRAM_CHAT_ID', ids[0]);
  }
  telegram_('getChat', {chat_id: props.getProperty('TELEGRAM_CHAT_ID')});
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
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'retryTelegram')) {
    ScriptApp.newTrigger('retryTelegram').timeBased().everyMinutes(5).create();
  }
  console.log('Готово. Создан лист «Заявки сайта», группа подключена. Теперь разверните веб-приложение.');
}

function doPost(e) {
  let lock;
  try {
    const body = e && e.postData && e.postData.contents;
    if (!body || body.length > 16000) return json_({ok: false, code: 'invalid'});
    const data = JSON.parse(body);
    if (!valid_(data)) return json_({ok: false, code: 'invalid'});
    const props = PropertiesService.getScriptProperties();
    if (!props.getProperty('TELEGRAM_BOT_TOKEN') || !props.getProperty('TELEGRAM_CHAT_ID')) return json_({ok: false, code: 'not_configured'});
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
      data.source_button || '', data.form_id || '', 'Да', 'Да', 'Ожидает отправки', 0, '',
      data.utm_source || '', data.utm_medium || '', data.utm_campaign || ''];
    sheet.appendRow(row.map(safeCell_));
    SpreadsheetApp.flush(); // The durable sheet row is the source of truth, before Telegram delivery.
    cache.put(rateKey, String(Number(cache.get(rateKey) || 0) + 1), 600);
    const rowNumber = sheet.getLastRow();
    try { deliver_(sheet, rowNumber, row); } catch (_) { /* the retry trigger will recover */ }
    return json_({ok: true, request_id: data.request_id});
  } catch (_) {
    return json_({ok: false, code: 'unavailable'});
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function retryTelegram() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(TAB_NAME);
    validateHeaders_(sheet);
    if (sheet.getLastRow() < 2) return;
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
    let count = 0;
    rows.forEach(function (row, i) {
      if (row[13] !== 'Отправлено' && count < 10) {
        count++;
        try { deliver_(sheet, i + 2, row); } catch (_) { /* retain row for next run */ }
      }
    });
  } finally { lock.releaseLock(); }
}

function deliver_(sheet, rowNumber, row) {
  const props = PropertiesService.getScriptProperties();
  const clean = v => String(v || '').replace(/^'/, '');
  const message = [
    'Новая заявка с сайта Редстар', 'ID: ' + clean(row[0]), 'Дата: ' + clean(row[1]),
    'Имя: ' + clean(row[2]), 'Телефон: ' + clean(row[3]), 'Задача: ' + clean(row[4]),
    '', 'Страница формы: ' + clean(row[5]), 'Название страницы: ' + clean(row[6]),
    'Страница перехода: ' + (clean(row[7]) || '—'), 'Блок: ' + clean(row[8]),
    'Кнопка: ' + (clean(row[9]) || 'Без перехода по кнопке'), 'Форма: ' + clean(row[10]),
    'Оба согласия: получены', 'UTM: ' + [row[16], row[17], row[18]].map(clean).filter(Boolean).join(' / ')
  ].join('\n');
  const status = sheet.getRange(rowNumber, 14, 1, 3);
  status.setValues([['Ожидает отправки', Number(row[14]) + 1, stamp_()]]);
  try {
    telegram_('sendMessage', {chat_id: props.getProperty('TELEGRAM_CHAT_ID'), text: message, link_preview_options: {is_disabled: true}});
    status.setValues([['Отправлено', Number(row[14]) + 1, stamp_()]]);
  } catch (_) {
    status.setValues([['Повторить отправку', Number(row[14]) + 1, stamp_()]]);
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
  return /^https:\/\/(?:redstaragency\.ru|www\.redstaragency\.ru|kapustina-ann\.github\.io)(?:\/|$)/.test(d.page_url || '');
}
function safeCell_(v) { return typeof v === 'string' && /^[\s]*[=+\-@]/.test(v) ? "'" + v : v; }
function stamp_() { return Utilities.formatDate(new Date(), 'Europe/Moscow', 'yyyy-MM-dd HH:mm:ss'); }
function validateHeaders_(sheet) {
  if (!sheet || JSON.stringify(sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0]) !== JSON.stringify(HEADERS)) {
    throw new Error('Не меняйте порядок колонок листа «Заявки сайта».');
  }
}
function json_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function telegram_(method, payload) {
  const token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  // Do not log responses or exceptions: URLs contain the token.
  let response;
  try { response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true
  }); } catch (_) { throw new Error('Telegram временно недоступен.'); }
  let result;
  try { result = JSON.parse(response.getContentText()); } catch (_) { throw new Error('Некорректный ответ Telegram.'); }
  if (response.getResponseCode() !== 200 || !result.ok) throw new Error('Проверьте токен бота и его доступ к группе.');
  return result.result;
}
