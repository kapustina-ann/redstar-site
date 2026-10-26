/* Keep service filters within the cases listing when entered via Cases. */
(function () {
  var heading = document.querySelector('[data-journal-heading]');
  if (!heading) return;
  var crumb = document.querySelector('[data-journal-crumb]');
  var intro = document.querySelector('[data-journal-intro]');
  var originalIntro = intro.textContent;
  var buttons = Array.from(document.querySelectorAll('.filter'));
  var cards = Array.from(document.querySelectorAll('.feed [data-tags]'));
  var casesOnly = false;
  function apply(key, write) {
    var title = casesOnly ? 'Кейсы' : 'Журнал';
    heading.textContent = crumb.textContent = title;
    document.title = title + ' — Редстар';
    intro.textContent = casesOnly ? 'Проекты клиентов: задачи, решения и результаты нашей работы.' : originalIntro;
    cards.forEach(function (card) {
      var tags = card.dataset.tags.split(/\s+/);
      card.hidden = (casesOnly && !tags.includes('keysy')) || (key !== 'all' && !tags.includes(key));
    });
    buttons.forEach(function (button) {
      var filter = button.dataset.filter;
      button.hidden = casesOnly && (filter === 'keysy' || (filter !== 'all' && !cards.some(function (card) { var tags = card.dataset.tags.split(/\s+/); return tags.includes('keysy') && tags.includes(filter); })));
      button.classList.toggle('is-on', filter === key);
      button.setAttribute('aria-pressed', String(filter === key));
    });
    document.querySelectorAll('.nav__link').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === 'zhurnal.html' || href === 'zhurnal.html?rubrika=keysy') link.classList.toggle('is-active', href === (casesOnly ? 'zhurnal.html?rubrika=keysy' : 'zhurnal.html'));
    });
    if (write) {
      var query = new URLSearchParams();
      if (casesOnly) { query.set('rubrika', 'keysy'); if (key !== 'all') query.set('direction', key); }
      else if (key !== 'all') query.set('rubrika', key);
      history.replaceState(null, '', location.pathname + (query.size ? '?' + query : ''));
    }
  }
  function restore() {
    var query = new URLSearchParams(location.search);
    casesOnly = query.get('rubrika') === 'keysy';
    var key = (casesOnly ? query.get('direction') : query.get('rubrika')) || 'all';
    if (!buttons.some(function (b) { return b.dataset.filter === key; })) key = 'all';
    apply(key, false);
  }
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var key = button.dataset.filter;
      if (key === 'keysy') { casesOnly = true; key = 'all'; }
      apply(key, true);
    });
  });
  window.addEventListener('popstate', restore);
  restore();
})();
