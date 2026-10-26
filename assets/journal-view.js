/* Separate the cases section from journal category filtering. */
(function () {
  var heading = document.querySelector('[data-journal-heading]');
  if (!heading) return;
  var crumb = document.querySelector('[data-journal-crumb]');
  var intro = document.querySelector('[data-journal-intro]');
  var originalIntro = intro.textContent;
  var filterRow = document.querySelector('.filters');
  var journalFilters = filterRow.innerHTML;
  var sectionCases = heading.hasAttribute('data-cases-page');
  if (!sectionCases && new URLSearchParams(location.search).get('section') === 'cases') {
    var legacyDirection = new URLSearchParams(location.search).get('direction');
    location.replace('keysy.html' + (legacyDirection ? '?direction=' + encodeURIComponent(legacyDirection) : ''));
    return;
  }
  var buttons = [];
  var cards = Array.from(document.querySelectorAll('.feed [data-tags]'));
  function apply(key, write) {
    var casesOnly = sectionCases;
    var title = casesOnly ? 'Кейсы' : 'Журнал';
    heading.textContent = crumb.textContent = title;
    document.title = title + ' — Редстар';
    intro.textContent = casesOnly ? 'Проекты клиентов: задачи, решения и результаты нашей работы.' : originalIntro;
    cards.forEach(function (card) {
      var tags = card.dataset.tags.split(/\s+/);
      card.hidden = (sectionCases && !tags.includes('keysy')) || (key !== 'all' && !tags.includes(key));
    });
    buttons.forEach(function (button) {
      var filter = button.dataset.filter;
      button.hidden = false;
      button.classList.toggle('is-on', filter === key);
      button.setAttribute('aria-pressed', String(filter === key));
    });
    document.querySelectorAll('.nav__link').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === 'zhurnal.html' || href === 'keysy.html') link.classList.toggle('is-active', href === (sectionCases ? 'keysy.html' : 'zhurnal.html'));
    });
    if (write) {
      var query = new URLSearchParams();
      if (key !== 'all') query.set(sectionCases ? 'direction' : 'rubrika', key);
      history.replaceState(null, '', location.pathname + (query.size ? '?' + query : ''));
    }
  }
  function restore() {
    var query = new URLSearchParams(location.search);
    if (sectionCases) {
      var directions = [['all', 'Все'], ['razrabotka', 'Разработка'], ['seo', 'SEO'], ['podderzhka', 'Техническая поддержка'], ['kontekst', 'Реклама'], ['geo', 'GEO']];
      filterRow.innerHTML = '';
      directions.forEach(function (item) {
        if (item[0] !== 'all' && !cards.some(function (card) { var tags = card.dataset.tags.split(/\s+/); return tags.includes('keysy') && tags.includes(item[0]); })) return;
        var button = document.createElement('button');
        button.type = 'button'; button.className = 'filter'; button.dataset.filter = item[0]; button.textContent = item[1];
        filterRow.appendChild(button);
      });
    } else { filterRow.innerHTML = journalFilters; }
    buttons = Array.from(filterRow.querySelectorAll('.filter'));
    buttons.forEach(function (button) { button.addEventListener('click', function () { apply(button.dataset.filter, true); }); });
    var key = query.get(sectionCases ? 'direction' : 'rubrika') || 'all';
    if (!buttons.some(function (b) { return b.dataset.filter === key; })) key = 'all';
    apply(key, false);
  }
  window.addEventListener('popstate', restore);
  restore();
})();
