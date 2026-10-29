/* Shared lead delivery and CTA attribution. No personal data is stored in browser storage. */
(function () {
  'use strict';
  var pendingKey = 'redstar-lead-transition-v1';
  var contexts = new WeakMap();
  var attempts = new WeakMap();
  var sending = new WeakSet();
  var forms = Array.from(document.querySelectorAll('.unified-form'));
  function text(node, limit) { return node ? node.textContent.replace(/\s+/g, ' ').trim().slice(0, limit || 180) : ''; }
  function pageUrl() { return (location.origin + location.pathname).slice(0, 500); }
  function read(key) { try { return JSON.parse(sessionStorage.getItem(key)); } catch (_) { return null; } }
  function store(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function remove(key) { try { sessionStorage.removeItem(key); } catch (_) {} }
  function blockName(trigger) {
    var block = trigger.closest('[data-lead-block],.hero,.cta,article,.card,header,footer,section,.t-rec');
    if (!block) return 'Кнопка на странице';
    if (block.dataset.leadBlock) return block.dataset.leadBlock;
    if (block.matches('.hero')) return 'Главный баннер';
    if (block.matches('header')) return 'Шапка сайта';
    if (block.matches('footer')) return 'Подвал сайта';
    return text(block.querySelector('h2,h3,h1,.t-title,.t-heading')) || text(block.querySelector('.tn-atom[field^="tn_text"]')) || block.id || 'Блок на странице';
  }
  function targetForm(hash, modal) {
    var id;
    try { id = decodeURIComponent((modal || hash || '').replace(/^#/, '')); } catch (_) { return null; }
    var container = document.getElementById(id);
    if (container) {
      if (container.matches('form.unified-form')) return container;
      var nested = container.querySelector('.unified-form');
      if (nested) return nested;
    }
    var popup = Array.from(document.querySelectorAll('[data-tooltip-hook]')).find(function (p) {
      return p.getAttribute('data-tooltip-hook') === '#' + id;
    });
    return popup && popup.querySelector('.unified-form');
  }
  var query = new URLSearchParams(location.search);
  var campaign = read('redstar-lead-campaign-v1') || {};
  if (['utm_source', 'utm_medium', 'utm_campaign'].some(function (k) { return query.has(k); })) {
    campaign = {};
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) { campaign[k] = (query.get(k) || '').slice(0, k === 'utm_campaign' ? 150 : 100); });
    store('redstar-lead-campaign-v1', campaign);
  }
  var pending = read(pendingKey);
  remove(pendingKey);
  if (pending && Date.now() - pending.time < 30 * 60 * 1000 && pending.path === location.pathname && pending.hash === location.hash) {
    var arrivedForm = targetForm(location.hash);
    if (arrivedForm) contexts.set(arrivedForm, pending.context);
  }
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('a[href],[data-modal]');
    if (!trigger) return;
    var url;
    try { url = new URL(trigger.getAttribute('href') || location.href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin) return;
    var context = {source_page: pageUrl(), source_block: blockName(trigger), source_button: text(trigger, 120)};
    if (url.pathname === location.pathname) {
      var form = targetForm(url.hash, trigger.dataset.modal);
      if (form) {
        var offer = form.querySelector('[name="tildaspec-formname"]');
        if (offer) context.source_block = (context.source_block + ' / ' + offer.value).slice(0, 180);
        contexts.set(form, context);
      }
    } else if (/\/kontakty\.html$/.test(url.pathname) && url.hash === '#zayavka') {
      // One navigation only; consumed at the destination, never reused for unrelated forms.
      store(pendingKey, {path: url.pathname, hash: url.hash, time: Date.now(), context: context});
    }
  }, true);

  forms.forEach(function (form) {
    var trap = document.createElement('input');
    trap.type = 'text'; trap.name = 'website'; trap.tabIndex = -1;
    trap.autocomplete = 'off'; trap.setAttribute('aria-hidden', 'true');
    trap.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;opacity:0;pointer-events:none';
    form.appendChild(trap);
    var area = form.querySelector('textarea[name="task"]');
    if (area) area.maxLength = 1500;
    var name = form.querySelector('[name="name"],[name="Name"]');
    if (name) name.maxLength = 120;
  });
  function field(form, name) { var el = form.elements.namedItem(name); return el ? el.value : ''; }
  function checked(form, name) { var el = form.elements.namedItem(name); return !!(el && el.checked); }
  function note(form, message) {
    var el = form.querySelector('.form__note');
    if (!el) { el = document.createElement('p'); el.className = 'form__note'; el.setAttribute('role', 'status'); form.appendChild(el); }
    el.hidden = false; el.textContent = message;
  }
  function uuid() { return crypto.randomUUID ? crypto.randomUUID() : 'lead-' + Date.now() + '-' + Array.from(crypto.getRandomValues(new Uint32Array(3))).join('-'); }
  function endpoint() { return window.REDSTAR_LEADS_ENDPOINT || ''; }
  async function submit(form) {
    if (sending.has(form) || !form.reportValidity()) return;
    var context = contexts.get(form) || {source_page: '', source_block: 'Без перехода по кнопке', source_button: ''};
    var payload = Object.assign({
      name: field(form, 'name') || field(form, 'Name'), phone: field(form, 'phone') || field(form, 'Phone'),
      task: field(form, 'task'), website: field(form, 'website'),
      personal_data_consent: (checked(form, 'personal_data_consent') || checked(form, 'Checkbox')), privacy_consent: (checked(form, 'privacy_consent') || checked(form, 'Checkbox_2')),
      page_url: pageUrl(), page_title: document.title.slice(0, 180), form_id: (form.id || 'contact-form').slice(0, 100)
    }, context, campaign);
    var signature = JSON.stringify(payload);
    var attempt = attempts.get(form);
    if (!attempt || attempt.signature !== signature) { attempt = {signature: signature, id: uuid()}; attempts.set(form, attempt); }
    payload.request_id = attempt.id;
    sending.add(form);
    var buttons = Array.from(form.querySelectorAll('[type="submit"]'));
    var disabled = buttons.map(function (b) { return b.disabled; });
    buttons.forEach(function (b) { b.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    note(form, 'Отправляем заявку…');
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 40000);
    try {
      // text/plain avoids a CORS preflight; require readable JSON, never no-cors/opaque success.
      var response = await fetch(endpoint(), {method: 'POST', headers: {'Content-Type': 'text/plain;charset=UTF-8'},
        body: JSON.stringify(payload), credentials: 'omit', redirect: 'follow', signal: controller.signal});
      if (!response.ok) throw new Error('http');
      var result = await response.json();
      if (result.ok !== true || result.request_id !== payload.request_id) throw new Error('delivery');
      note(form, 'Заявка получена. Свяжемся с вами в течение рабочего дня.');
      if (window.ym) window.ym(35628860, 'reachGoal', 'lead');
      form.reset(); attempts.delete(form); contexts.delete(form); remove(pendingKey);
    } catch (_) {
      note(form, 'Не удалось подтвердить отправку. Попробуйте ещё раз или позвоните: 8 (4852) 31-94-04.');
    } finally {
      clearTimeout(timer); sending.delete(form); form.removeAttribute('aria-busy');
      buttons.forEach(function (b, i) { b.disabled = disabled[i]; });
    }
  }
  // Capture before old demonstration handlers and Tilda's transport to prevent duplicate sends.
  window.addEventListener('submit', function (event) {
    if (!endpoint() || !event.target.matches('.unified-form')) return;
    event.preventDefault(); event.stopImmediatePropagation(); submit(event.target);
  }, true);
  window.addEventListener('click', function (event) {
    var button = event.target.closest('.unified-form .t-submit');
    if (!endpoint() || !button) return;
    event.preventDefault(); event.stopImmediatePropagation(); submit(button.closest('form'));
  }, true);
})();
