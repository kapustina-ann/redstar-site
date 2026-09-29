/* Редстар — поведение общих компонентов */
(function () {
  'use strict';

  /* Мобильное меню */
  var burger = document.querySelector('.burger');
  var mobile = document.querySelector('.mobile-menu');
  if (burger && mobile) {
    burger.addEventListener('click', function () {
      var open = mobile.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* Выпадающее меню: держим список открытым ещё мгновение после ухода курсора,
     чтобы до пунктов можно было дойти по диагонали */
  document.querySelectorAll('.has-drop').forEach(function (item) {
    var timer;
    var open = function () { clearTimeout(timer); item.classList.add('is-open'); };
    var close = function (delay) {
      clearTimeout(timer);
      timer = setTimeout(function () { item.classList.remove('is-open'); }, delay);
    };
    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', function () { close(260); });
    item.addEventListener('focusin', open);
    item.addEventListener('focusout', function (e) {
      if (!item.contains(e.relatedTarget)) close(0);
    });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(0); item.querySelector('.nav__link').focus(); }
    });
  });

  /* Модальное окно с формой. Без JS кнопка просто ведёт к форме на странице. */
  document.querySelectorAll('[data-modal]').forEach(function (trigger) {
    var dlg = document.getElementById(trigger.dataset.modal);
    if (!dlg || typeof dlg.showModal !== 'function') return;

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      dlg.showModal();
      var first = dlg.querySelector('input:not([type="checkbox"])');
      if (first) setTimeout(function () { first.focus(); }, 60);
    });

    dlg.querySelectorAll('[data-modal-close]').forEach(function (b) {
      b.addEventListener('click', function () { dlg.close(); });
    });
    // клик по подложке за пределами окна
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) dlg.close();
    });
  });

  /* Аккордеон вопросов */
  document.querySelectorAll('.faq__q').forEach(function (q) {
    var item = q.closest('.faq__item');
    var panel = item.querySelector('.faq__a');
    var open = item.classList.contains('is-open');
    panel.hidden = !open;
    q.setAttribute('aria-expanded', open ? 'true' : 'false');
    q.addEventListener('click', function () {
      var nowOpen = !item.classList.contains('is-open');
      item.classList.toggle('is-open', nowOpen);
      panel.hidden = !nowOpen;
      q.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
    });
  });

  /* Рубрики: фильтр списка и адрес вида blog.html?rubrika=keysy */
  var filters = document.querySelectorAll('.filter');
  if (filters.length) {
    var apply = function (key, pushUrl) {
      filters.forEach(function (b) { b.classList.toggle('is-on', b.dataset.filter === key); });
      document.querySelectorAll('[data-tags]').forEach(function (card) {
        var match = key === 'all' || card.dataset.tags.split(' ').indexOf(key) > -1;
        card.hidden = !match;
      });
      if (pushUrl && window.history && history.replaceState) {
        var url = location.pathname + (key === 'all' ? '' : '?rubrika=' + key);
        history.replaceState(null, '', url);
      }
    };

    filters.forEach(function (btn) {
      btn.addEventListener('click', function () { apply(btn.dataset.filter, true); });
    });

    // рубрика из адреса — по ней приходят из меню
    var wanted = (location.search.match(/[?&]rubrika=([\w-]+)/) || [])[1];
    if (wanted && document.querySelector('.filter[data-filter="' + wanted + '"]')) {
      apply(wanted, false);
      // пришли по пункту меню — его и подсвечиваем
      var menuItem = document.querySelector('.nav__link[href*="rubrika=' + wanted + '"]');
      if (menuItem) {
        document.querySelectorAll('.nav__link.is-active').forEach(function (l) { l.classList.remove('is-active'); });
        menuItem.classList.add('is-active');
      }
    }
  }

  /* Формы — демонстрационная отправка */
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    var note = form.querySelector('.form__note');
    if (note) note.hidden = true;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!note) return;
      note.hidden = false;
      note.textContent = 'Заявка отправлена. Свяжемся в течение рабочего дня.';
      form.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], textarea').forEach(function (f) { f.value = ''; });
    });
  });

  /* Бегущая строка: достраиваем содержимое под ширину экрана,
     чтобы на ленте не оставалось пустот, и держим одинаковую скорость */
  var tracks = [].slice.call(document.querySelectorAll('.band__track'));
  if (tracks.length) {
    tracks.forEach(function (track) { track.dataset.base = track.innerHTML; });

    var layoutBands = function () {
      tracks.forEach(function (track) {
        var band = track.parentElement;
        var base = track.dataset.base;

        track.style.animation = 'none';
        track.innerHTML = base;

        // повторяем набор, пока одна «лента» не перекроет ширину полосы
        var guard = 0;
        while (track.scrollWidth < band.offsetWidth && guard < 40) {
          track.insertAdjacentHTML('beforeend', base);
          guard++;
        }
        // и удваиваем — прокрутка на -50% получается бесшовной
        track.innerHTML = track.innerHTML + track.innerHTML;

        var speed = band.classList.contains('band--red') ? 62 : 48; // пикселей в секунду
        track.style.animation = '';
        track.style.animationDuration = Math.max(12, Math.round(track.scrollWidth / 2 / speed)) + 's';
      });
    };

    layoutBands();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutBands);
    var bandsTimer;
    window.addEventListener('resize', function () {
      clearTimeout(bandsTimer);
      bandsTimer = setTimeout(layoutBands, 200);
    });
  }
})();
