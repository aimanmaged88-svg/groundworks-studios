/* ============================================================
   GROUNDWORK LABS — motion polish
   Sections rise in smoothly as they enter the viewport.
   ============================================================ */

(() => {
  const targets = document.querySelectorAll(
    '.strip-item, .community .eyebrow, .community h2, .community .hero-sub, .community-cta,' +
    '.pricing .eyebrow, .pricing h2, .pricing .hero-sub, .p-card,' +
    '.intake-head, .chat-shell, .brief-panel, .foot,' +
    '.fb-wrap .eyebrow, .fb-title, .fb-wrap .hero-sub, .fb-incentive, .fb-form'
  );
  if (!targets.length || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in'));
    return;
  }
  let stagger = 0;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  targets.forEach((el, i) => {
    el.classList.add('reveal');
    // gentle stagger for siblings that arrive together
    if (i % 3 === 1) el.classList.add('d1');
    if (i % 3 === 2) el.classList.add('d2');
    io.observe(el);
  });

  // safety net: whatever happens (odd in-app browsers, paint quirks),
  // nothing stays hidden for more than a moment
  setTimeout(() => targets.forEach(el => el.classList.add('in')), 2500);
})();
