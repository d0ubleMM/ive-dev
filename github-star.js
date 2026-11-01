/* Decorative, finite animation. The GitHub link works before JS and at every frame. */
(() => {
  const sections = document.querySelectorAll('[data-github-star]');
  if (!sections.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  sections.forEach(section => {
    const replay = section.querySelector('[data-star-replay]');
    let frame = 0;
    let timer = 0;
    let played = false;
    const stop = () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      section.classList.remove('is-playing');
    };
    const play = () => {
      stop();
      if (reduced.matches || document.hidden) return;
      played = true;
      // One intervening paint restarts the CSS timeline when Replay is pressed.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          section.classList.add('is-playing');
          timer = setTimeout(stop, 2400);
        });
      });
    };
    const syncMotion = () => {
      replay.hidden = reduced.matches;
      if (reduced.matches) stop();
    };
    replay.addEventListener('click', play);
    reduced.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    syncMotion();

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= .35 && !played) play();
          else if (!entry.isIntersecting) stop();
        }
      }, { threshold: [0, .35] });
      observer.observe(section);
    }
  });
})();
