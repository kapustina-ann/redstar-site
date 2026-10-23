/* The cases menu opens the journal as a dedicated cases listing. */
(function () {
  var heading = document.querySelector('[data-journal-heading]');
  if (!heading) return;
  var crumb = document.querySelector('[data-journal-crumb]');
  var intro = document.querySelector('[data-journal-intro]');
  var filters = document.querySelector('[data-journal-filters]');
  var originalIntro = intro.textContent;
  function update(key) {
    var casesOnly = key === 'keysy';
    var title = casesOnly ? 'Кейсы' : 'Журнал';
    heading.textContent = title;
    crumb.textContent = title;
    document.title = title + ' — Редстар';
    intro.textContent = casesOnly ? 'Проекты клиентов: задачи, решения и результаты нашей работы.' : originalIntro;
    filters.hidden = casesOnly;
    if (casesOnly) {
      document.querySelectorAll('.feed [data-tags]').forEach(function (card) {
        card.hidden = card.dataset.tags.split(' ').indexOf('keysy') === -1;
      });
    }
    document.querySelectorAll('.nav__link').forEach(function (link) {
      if (link.getAttribute('href') === 'zhurnal.html' || link.getAttribute('href') === 'zhurnal.html?rubrika=keysy') {
        link.classList.toggle('is-active', link.getAttribute('href') === (casesOnly ? 'zhurnal.html?rubrika=keysy' : 'zhurnal.html'));
      }
    });
  }
  document.querySelectorAll('.filter').forEach(function (button) {
    button.addEventListener('click', function () { update(button.dataset.filter); });
  });
  update(new URLSearchParams(location.search).get('rubrika'));
})();
