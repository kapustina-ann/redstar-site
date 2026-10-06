(function () {
  'use strict';
  var dialog = document.querySelector('.vc-lightbox');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  var image = dialog.querySelector('img');
  var caption = dialog.querySelector('#vc-lightbox-title');
  var trigger;
  document.querySelectorAll('[data-case-image]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      caption.textContent = image.alt;
      document.body.classList.add('vc-viewing');
      dialog.showModal();
      dialog.scrollTop = 0;
    });
  });
  dialog.querySelector('button').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    if (event.target !== dialog) return;
    var box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', function () {
    document.body.classList.remove('vc-viewing');
    image.removeAttribute('src');
    if (trigger) trigger.focus({ preventScroll: true });
  });
})();

/* Move the original image node, preserving its mobile position and zoom handler. */
(function () {
 'use strict';
 var gallery = document.querySelector('.vc-comparison');
 var previous = document.querySelector('#task > .vc-figure');
 if (!gallery || !previous) return;
 var anchor = document.createComment('Previous site image: original mobile position');
 previous.before(anchor);
 var desktop = window.matchMedia('(min-width:651px)');
 function arrange() {
  if (desktop.matches) gallery.appendChild(previous);
  else anchor.parentNode.insertBefore(previous, anchor.nextSibling);
 }
 arrange();
 desktop.addEventListener('change', arrange);
})();
