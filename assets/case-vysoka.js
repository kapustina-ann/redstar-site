(() => {
  const button = document.getElementById('case-sound');
  const audio = document.getElementById('case-audio');
  const status = document.getElementById('case-sound-status');
  const sync = () => {
    const playing = !audio.paused;
    button.setAttribute('aria-pressed', String(playing));
    button.textContent = playing ? 'Выключить звук' : 'Послушать лес';
  };
  audio.volume = 0.35;
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  button.addEventListener('click', async () => {
    status.textContent = '';
    if (!audio.paused) { audio.pause(); return; }
    button.disabled = true;
    try { await audio.play(); }
    catch { status.textContent = 'Звук не загрузился. Попробуйте ещё раз.'; }
    finally { button.disabled = false; sync(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause();
  });
})();