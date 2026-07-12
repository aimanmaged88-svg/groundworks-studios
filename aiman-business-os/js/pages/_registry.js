/* ============================================================
   BUSINESS STUDIO OS — Page registry
   Each page file registers: Pages.<name> = (param) => html
   Optional mount hook:      Pages._mount.<name> = (param) => void
   ============================================================ */

const Pages = { _mount: {} };

Pages.afterRender = (page, param) => Pages._mount[page]?.(param);

/* shared page helpers */
function pageHead(title, sub, actions = '') {
  return `<div class="page-head">
    <div><div class="page-title">${title}</div>${sub ? `<div class="page-sub">${sub}</div>` : ''}</div>
    <div class="page-actions">${actions}</div>
  </div>`;
}

function wireTabs(container, onChange) {
  container.querySelectorAll('[data-tab]').forEach(btn =>
    btn.addEventListener('click', () => {
      container.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(+btn.dataset.tab);
    }));
}

function wireSeg(container, onChange) {
  container.querySelectorAll('[data-seg]').forEach(btn =>
    btn.addEventListener('click', () => {
      btn.closest('.seg').querySelectorAll('[data-seg]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(+btn.dataset.seg);
    }));
}
