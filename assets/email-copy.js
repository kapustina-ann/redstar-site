/* Copy email addresses without navigating away from the current page. */
(function () {
  'use strict';
  var copyIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
  var doneIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
  var status = document.createElement('span');
  status.className = 'email-copy-status'; status.setAttribute('role', 'status');
  document.body.appendChild(status);
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
    if (link.closest('.email-copy-wrap')) return;
    var email = decodeURIComponent(link.getAttribute('href').slice(7).split('?')[0]);
    var wrap = document.createElement('span'); wrap.className = 'email-copy-wrap';
    if (link.classList.contains('btn')) wrap.classList.add('email-copy-wrap--button');
    link.before(wrap); wrap.appendChild(link);
    var button = document.createElement('button'); button.type = 'button';
    button.className = 'email-copy'; button.innerHTML = copyIcon;
    button.title = 'Скопировать почту'; button.setAttribute('aria-label', 'Скопировать ' + email);
    wrap.appendChild(button);
    var timer;
    button.addEventListener('click', async function () {
      clearTimeout(timer);
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
        } else {
          var field = document.createElement('textarea');
          field.value = email; field.readOnly = true;
          field.style.cssText = 'position:fixed;left:-10000px;top:0';
          document.body.appendChild(field); field.select();
          var copied;
          try { copied = document.execCommand('copy'); } finally { field.remove(); button.focus({preventScroll:true}); }
          if (!copied) throw new Error('Copy failed');
        }
        button.innerHTML = doneIcon; button.title = 'Готово';
        button.setAttribute('aria-label', 'Готово: почта скопирована');
        status.textContent = 'Почта ' + email + ' скопирована';
        timer = setTimeout(function () {
          button.innerHTML = copyIcon; button.title = 'Скопировать почту';
          button.setAttribute('aria-label', 'Скопировать ' + email);
        }, 3000);
      } catch (_) {
        button.innerHTML = copyIcon; button.title = 'Не удалось скопировать — попробуйте ещё раз';
        button.setAttribute('aria-label', button.title);
        status.textContent = 'Не удалось скопировать почту. Выделите адрес и скопируйте вручную.';
      }
    });
  });
})();
