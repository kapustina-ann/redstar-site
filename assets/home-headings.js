(() => {
  const titles = [...document.querySelectorAll('.home-page main .section-title')];
  if (!titles.length) return;
  const root = document.documentElement;
  let scheduled = false;
  function fit() {
    scheduled = false;
    root.style.removeProperty('--home-heading-size');
    const base = parseFloat(getComputedStyle(titles[0]).fontSize);
    let size = base;
    for (const title of titles) {
      if (!title.clientWidth || !title.scrollWidth) continue;
      size = Math.min(size, base * Math.max(1, title.clientWidth - 2) / title.scrollWidth);
    }
    root.style.setProperty('--home-heading-size', `${Math.floor(size * 4) / 4}px`);
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(fit);
  }
  window.addEventListener('resize', schedule, {passive:true});
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(schedule);
    for (const title of titles) observer.observe(title.parentElement);
  }
  if (document.fonts) document.fonts.ready.then(schedule);
  schedule();
})();
