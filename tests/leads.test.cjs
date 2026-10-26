const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webkit } = require('C:/Users/kapus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
async function browserTests() {
 const b = await webkit.launch();
 const context = await b.newContext({viewport:{width:390,height:844}});
 let requests = [], reject = true;
 await context.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.hostname === 'script.google.com') {
   const payload = JSON.parse(route.request().postData()); requests.push(payload);
   return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(reject ? {ok:false} : {ok:true,request_id:payload.request_id})});
  }
  if (url.hostname !== 'kapustina-ann.github.io') return route.abort();
  const file = path.join(root,decodeURIComponent(url.pathname.replace(/^\/redstar-site\//,'')));
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return route.abort();
  return route.fulfill({path:file});
 });
 await context.addInitScript(() => {Object.defineProperty(window,'REDSTAR_LEADS_ENDPOINT',{get:()=> 'https://script.google.com/macros/s/test/exec',set:()=>{}})});
 const p = await context.newPage();
 const base = 'https://kapustina-ann.github.io/redstar-site/';
 async function fill(form) {
  await form.locator('[name="name"],[name="Name"]').fill('Тест');
  await form.locator('[type="tel"]').fill('+7 (999) 123-45-67');
  await form.locator('[name="personal_data_consent"],[name="Checkbox"]').check();
  await form.locator('[name="privacy_consent"],[name="Checkbox_2"]').check();
 }
 await p.goto(base+'index.html');
 await p.locator('.home-intro .btn--primary').click();
 await p.waitForURL('**/kontakty.html#zayavka');
 const form = p.locator('.unified-form'); await fill(form);
 await form.locator('[type="submit"]').click();
 await form.locator('.form__note').filter({hasText:'Не удалось'}).waitFor();
 assert.equal(await form.locator('[name="name"]').inputValue(),'Тест');
 reject = false;
 await form.locator('[type="submit"]').click();
 await form.locator('.form__note').filter({hasText:'Заявка получена'}).waitFor();
 assert.equal(requests.length,2); assert.equal(requests[0].request_id,requests[1].request_id);
 assert.equal(requests[1].source_block,'Главный баннер');
 assert.match(requests[1].source_page,/index.html$/);
 assert.match(requests[1].page_url,/kontakty.html$/);
 assert.equal(requests[1].source_button,'Обсудить проект');
 await p.goto(base+'kontakty.html'); await fill(form);
 await form.locator('[type="submit"]').click();
 await form.locator('.form__note').filter({hasText:'Заявка получена'}).waitFor();
 assert.equal(requests.at(-1).source_block,'Без перехода по кнопке');
 await p.goto(base+'uslugi-geo.html');
 await p.locator('.hero a[href="#zayavka"]').first().click();
 await fill(form); await form.locator('[type="submit"]').click();
 await form.locator('.form__note').filter({hasText:'Заявка получена'}).waitFor();
 assert.equal(requests.at(-1).source_block,'Главный баннер');
 // Tilda submit buttons must use only the shared transport, even with legacy listeners.
 await p.goto(base+'uslugi-podderzhka.html');
 const popup = p.locator('form.t-form').first();
 await p.evaluate(()=>{const f=document.querySelector('form.t-form');f.closest('.t-popup').style.cssText='display:block!important;visibility:visible!important;opacity:1!important;position:relative!important';});
 await popup.evaluate(f => {
  f.querySelector('[name="Name"]').value='Тест';
  var phone=f.querySelector('[name="Phone"]');phone.value='+7 (999) 123-45-67';phone.dispatchEvent(new Event('input',{bubbles:true}));
  f.querySelectorAll('input[type="checkbox"]').forEach(el=>{el.checked=true});
 }); const before = requests.length;
 await popup.locator('[type="submit"]').evaluate(el=>el.click());
 await popup.locator('.form__note').filter({hasText:'Заявка получена'}).waitFor({state:'attached'});
 assert.equal(requests.length,before+1);
 await b.close(); console.log('PASS frontend: cross-page source, same-page source, direct form, error/retry ID, Tilda transport');
}
function backendTests() {
 let rows=[], deliveries=0, failTelegram=true;
 const cache=new Map();
 const sheet={getLastRow:()=>rows.length,appendRow:r=>rows.push(r),getRange:(r,c,n=1,m=1)=>({
  getValues:()=>rows.slice(r-1,r-1+n).map(row=>row.slice(c-1,c-1+m)),
  setValues:values=>values.forEach((row,i)=>row.forEach((v,j)=>{rows[r-1+i][c-1+j]=v})),
  createTextFinder:id=>({matchEntireCell:()=>({findNext:()=>rows.slice(1).some(row=>row[0]===id)?{}:null})})
 })};
 const env={console,PropertiesService:{getScriptProperties:()=>({getProperty:k=>({TELEGRAM_BOT_TOKEN:'fake',TELEGRAM_CHAT_ID:'-123'}[k])})},
  SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush:()=>{}},
  LockService:{getScriptLock:()=>({tryLock:()=>true,hasLock:()=>true,releaseLock:()=>{}})},
  CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v)})},
  Utilities:{formatDate:()=> '2026-10-26 12:00:00'},
  ContentService:{MimeType:{JSON:'json'},createTextOutput:t=>({setMimeType:()=>JSON.parse(t)})},
  UrlFetchApp:{fetch:()=>{deliveries++;return {getResponseCode:()=>failTelegram?503:200,getContentText:()=>JSON.stringify({ok:!failTelegram,result:{message_id:1}})}}}
 };
 vm.createContext(env);vm.runInContext(fs.readFileSync(path.join(root,'integrations/google-apps-script/Code.gs'),'utf8'),env);
 rows.push(Array.from(vm.runInContext('HEADERS',env)));
 const data={request_id:'12345678-1234-1234-1234-123456789012',name:'=IMPORTXML("x")',phone:'+7 (999) 123-45-67',task:'Тест',page_url:'https://redstaragency.ru/kontakty.html',personal_data_consent:true,privacy_consent:true};
 const post=d=>env.doPost({postData:{contents:JSON.stringify(d)}});
 assert.equal(post(data).ok,true);assert.equal(rows.length,2);assert.equal(rows[1][13],'Повторить отправку');
 assert.equal(rows[1][2][0],"'"); assert.equal(post(data).ok,true); assert.equal(rows.length,2);assert.equal(deliveries,1);
 failTelegram=false;env.retryTelegram();assert.equal(rows[1][13],'Отправлено');assert.equal(deliveries,2);
 env.retryTelegram();assert.equal(deliveries,2);
 assert.equal(post({...data,personal_data_consent:false}).ok,false);
 assert.equal(post({...data,phone:'123'}).ok,false);
 assert.equal(post({...data,website:'spam'}).ok,false);
 assert.equal(post({...data,page_url:'https://evil.example/'}).ok,false);
 console.log('PASS backend: durable save, duplicate ID, queued Telegram retry, formula escaping, validation');
}
backendTests();browserTests().catch(e=>{console.error(e);process.exit(1)});
