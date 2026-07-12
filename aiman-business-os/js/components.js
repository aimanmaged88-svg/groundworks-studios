/* ============================================================
   BUSINESS STUDIO OS — Reusable UI components (render helpers)
   ============================================================ */

const UI = (() => {

  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  function card({ title, icon: ic, link, linkHref, body, cls = '', head = true }) {
    return `<div class="card ${cls}">
      ${head && title ? `<div class="card-head">
        <span class="card-title">${ic ? icon(ic) : ''}${title}</span>
        ${link ? `<a class="card-link" href="${linkHref || '#'}">${link} ${icon('arrowUpRight')}</a>` : ''}
      </div>` : ''}
      ${body}
    </div>`;
  }

  function statusBadge(status) {
    const map = {
      'Active': 'good', 'Paid': 'good', 'Done': 'good', 'Completed': 'good', 'Published': 'good', 'Ready': 'good',
      'Sent': 'info', 'In Progress': 'info', 'Review': 'info', 'Testing': 'info', 'Planned': 'info',
      'Overdue': 'bad', 'Blocked': 'bad',
      'Draft': '', 'Lead': '', 'Idea': '', 'Ideas': '',
      'Proposal': 'warn', 'Planning': 'warn', 'Design': 'gold', 'Development': 'gold',
    };
    const cls = map[status] ?? '';
    return `<span class="badge ${cls}"><span class="bdot"></span>${esc(status)}</span>`;
  }

  function priorityBadge(p) {
    const cls = p === 'High' ? 'bad' : p === 'Medium' ? 'warn' : '';
    return `<span class="badge ${cls}">${esc(p)}</span>`;
  }

  function avatar(initials, size = 'a32', tint = false) {
    return `<span class="avatar ${size} ${tint ? 'tint' : ''}">${esc(initials)}</span>`;
  }

  function progress(pct, cls = '') {
    return `<div class="progress ${cls}"><i style="width:${pct}%"></i></div>`;
  }

  function empty(ic, title, sub, action) {
    return `<div class="empty">
      <div class="empty-icon">${icon(ic)}</div>
      <b>${esc(title)}</b><p>${esc(sub)}</p>
      ${action ? `<button class="btn sm" style="margin-top:10px">${icon('plus')}${esc(action)}</button>` : ''}
    </div>`;
  }

  function table(cols, rows) {
    return `<div style="overflow-x:auto"><table class="table">
      <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
  }

  function taskRow(t) {
    const proj = t.projectId ? projectById(t.projectId) : null;
    const cli = t.clientId ? clientById(t.clientId) : null;
    const dueBad = t.due === 'Today' && !t.done;
    return `<div class="row ${t.done ? 'task-done' : ''}" data-task="${t.id}">
      <button class="check ${t.done ? 'done' : ''}" data-check="${t.id}" aria-label="toggle">${icon('check')}</button>
      <div class="row-main">
        <div class="row-title">${esc(t.title)}</div>
        <div class="row-sub">${[proj?.name, cli?.name].filter(Boolean).join(' · ') || 'Studio'}</div>
      </div>
      ${t.tags.map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}
      ${priorityBadge(t.priority)}
      <span class="small ${dueBad ? '' : 't3'}" style="${dueBad ? 'color:var(--warn);font-weight:550' : ''};min-width:62px;text-align:right">${esc(t.due)}</span>
      <button class="row-del" data-del-task="${t.id}" title="Delete task">${icon('x')}</button>
    </div>`;
  }

  function tabs(items, activeIdx, attr = 'data-tab') {
    return `<div class="tabs">${items.map((t, i) =>
      `<button class="tab ${i === activeIdx ? 'active' : ''}" ${attr}="${i}">${esc(t)}</button>`).join('')}</div>`;
  }

  function seg(items, activeIdx, attr = 'data-seg') {
    return `<div class="seg">${items.map((s, i) =>
      `<button class="${i === activeIdx ? 'active' : ''}" ${attr}="${i}">${esc(s)}</button>`).join('')}</div>`;
  }

  function toast(msg) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${icon('check')}<span>${esc(msg)}</span>`;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 300ms'; setTimeout(() => t.remove(), 320); }, 2600);
  }

  /* ---- Modal form builder ---- */
  function fieldHTML(f) {
    const full = f.full ? 'full' : '';
    const req = f.required ? 'required' : '';
    if (f.type === 'select') return `<label class="field ${full}"><span class="label">${esc(f.label)}</span>
      <select class="select" name="${f.name}">${f.options.map(o => `<option ${o === f.value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
    if (f.type === 'textarea') return `<label class="field ${full}"><span class="label">${esc(f.label)}</span>
      <textarea class="textarea" name="${f.name}" placeholder="${esc(f.placeholder || '')}">${esc(f.value || '')}</textarea></label>`;
    return `<label class="field ${full}"><span class="label">${esc(f.label)}</span>
      <input class="input" name="${f.name}" type="${f.type || 'text'}" value="${esc(f.value ?? '')}" placeholder="${esc(f.placeholder || '')}" ${f.min !== undefined ? `min="${f.min}"` : ''} ${req}></label>`;
  }

  function modal({ title, fields, submitLabel = 'Save', onSubmit }) {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.style.placeItems = 'center';
    ov.style.paddingTop = '0';
    ov.innerHTML = `<div class="modal">
      <div class="modal-head"><b>${esc(title)}</b><button type="button" class="icon-btn" data-close>${icon('x')}</button></div>
      <div class="modal-body"><form><div class="form-grid">${fields.map(fieldHTML).join('')}</div>
      <div class="modal-foot"><button type="button" class="btn" data-close>Cancel</button>
      <button type="submit" class="btn primary">${icon('check')}${esc(submitLabel)}</button></div></form></div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('mousedown', e => { if (e.target === ov) ov.remove(); });
    ov.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => ov.remove()));
    ov.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      const vals = Object.fromEntries(new FormData(e.target).entries());
      ov.remove();
      onSubmit(vals);
    });
    setTimeout(() => ov.querySelector('input, select, textarea')?.focus(), 30);
  }

  /* Wire task checkboxes + deletes anywhere on the page (delegated once) */
  document.addEventListener('click', e => {
    const chk = e.target.closest('[data-check]');
    if (chk) {
      e.stopPropagation();
      const t = DB.tasks.find(x => x.id === chk.dataset.check);
      if (!t) return;
      t.done = !t.done;
      t.status = t.done ? 'Done' : 'Todo';
      saveDB();
      chk.classList.toggle('done', t.done);
      chk.closest('.row')?.classList.toggle('task-done', t.done);
      if (t.done) toast('Task completed — nice.');
      return;
    }
    const del = e.target.closest('[data-del-task]');
    if (del) {
      e.stopPropagation(); e.preventDefault();
      DB.tasks = DB.tasks.filter(t => t.id !== del.dataset.delTask);
      saveDB();
      del.closest('.row')?.remove();
      toast('Task deleted');
    }
  });

  return { esc, card, statusBadge, priorityBadge, avatar, progress, empty, table, taskRow, tabs, seg, toast, modal };
})();
