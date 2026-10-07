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


})();
