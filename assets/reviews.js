(() => {
  const reviews = document.getElementById('client-reviews');
  if (!reviews || reviews.children.length <= 6) return;
  const actions = reviews.nextElementSibling;
  const button = actions.querySelector('button');
  reviews.classList.add('reviews--collapsed');
  actions.hidden = false;
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    reviews.classList.toggle('reviews--collapsed', !expanded);
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? 'Скрыть отзывы' : 'Посмотреть все отзывы';
    if (!expanded) button.scrollIntoView({ block: 'nearest' });
  });
})();
