(function () {
  document.querySelectorAll('.unified-form:not(.t-form)').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var note = form.querySelector('.form__note');
      note.hidden = false;
      note.textContent = 'Отправка через эту форму пока не подключена. Свяжитесь с нами по телефону 8 (4852) 31-94-04 или через Telegram в шапке сайта.';
    });
  });
})();
