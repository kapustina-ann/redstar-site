/* Shared Russian phone mask; no network requests or form delivery changes. */
(function () {
  'use strict';
  function national(value) {
    var digits = value.replace(/\D/g, '');
    if (digits[0] === '7' || digits[0] === '8') digits = digits.slice(1);
    return digits.slice(0, 10);
  }
  function format(d) {
    if (!d) return '';
    var value = '+7 (' + d.slice(0, 3);
    if (d.length >= 3) value += ') ';
    if (d.length > 3) value += d.slice(3, 6);
    if (d.length > 6) value += '-' + d.slice(6, 8);
    if (d.length > 8) value += '-' + d.slice(8, 10);
    return value;
  }
  document.addEventListener('submit', function (event) {
    if (event.target.matches('.unified-form') && !event.target.checkValidity()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.target.reportValidity();
    }
  }, true);
  document.querySelectorAll('[data-phone-mask]').forEach(function (input) {
    function update() {
      var old = input.value, pos = input.selectionStart || 0;
      var before = old.slice(0, pos).replace(/\D/g, '').length;
      var d = national(old);
      input.value = format(d);
      var target = input.value.length;
      if (pos < old.length) {
        var count = 0;
        for (var i = 0; i < input.value.length; i++) {
          if (/\d/.test(input.value[i])) count++;
          if (count >= before) { target = i + 1; break; }
        }
      }
      input.setSelectionRange(target, target);
      input.setCustomValidity(d.length && d.length !== 10 ? 'Введите телефон полностью: +7 (999) 999-99-99' : '');
    }
    input.addEventListener('input', update);
    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Backspace' && event.key !== 'Delete') return;
      var start = input.selectionStart, end = input.selectionEnd;
      if (start !== end) return;
      var value = input.value, index = event.key === 'Backspace' ? start - 1 : start;
      var step = event.key === 'Backspace' ? -1 : 1;
      while (index >= 0 && index < value.length && !/\d/.test(value[index])) index += step;
      if (index <= 1) return;
      event.preventDefault();
      input.value = value.slice(0, index) + value.slice(index + 1);
      input.setSelectionRange(index, index);
      update();
    });
    update();
  });
})();
