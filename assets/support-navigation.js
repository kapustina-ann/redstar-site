/* Редстар — поведение общих компонентов */
(function () {
  'use strict';

  /* Keep the tariff heading below the sticky header; bypass legacy Tilda scrolling. */
  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href="#price"]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    var heading = document.querySelector('.support-prices h2');
    if (!heading) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var header = document.querySelector('.topbar');
    var offset = (header ? header.getBoundingClientRect().height : 0) + 16;
    if (location.hash !== '#price') history.pushState(null, '', '#price');
    window.scrollTo({
      top: window.scrollY + heading.getBoundingClientRect().top - offset,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  }, true);
  /* Мобильное меню */
  var burger = document.querySelector('.burger');
  var mobile = document.querySelector('.mobile-menu');
  if (burger && mobile) {
    function setMenu(open, restoreFocus) {
      mobile.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      if (open || restoreFocus) burger.focus();
    }
    burger.addEventListener('click', function () { setMenu(!mobile.classList.contains('is-open'), false); });
    document.addEventListener('keydown', function (event) {
      if (!mobile.classList.contains('is-open')) return;
      if (event.key === 'Escape') { event.preventDefault(); setMenu(false, true); return; }
      if (event.key !== 'Tab') return;
      var items = [burger].concat(Array.from(mobile.querySelectorAll('a[href],button:not([disabled])')).filter(function (el) { return el.getClientRects().length; }));
      var i = items.indexOf(document.activeElement);
      event.preventDefault();
      var next = i < 0 ? 0 : (i + (event.shiftKey ? -1 : 1) + items.length) % items.length;
      items[next].focus();
    });
    mobile.addEventListener('click', function (event) { if (event.target.closest('a[href]')) setMenu(false, false); });
    window.addEventListener('resize', function () { if (!burger.getClientRects().length) setMenu(false, false); });
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


})();
