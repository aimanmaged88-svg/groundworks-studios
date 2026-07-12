/* ============================================================
   Calendar — month grid (July 2026) with typed events + week view
   ============================================================ */

let calView = 2; // 0 day, 1 week, 2 month

Pages.calendar = () => {
  return pageHead('Calendar', 'July 2026 · meetings, deadlines, tasks and content in one river — click a day to add, click an event to remove',
    UI.seg(['Day', 'Week', 'Month'], calView)
    + `<button class="btn primary" data-new-event>${icon('plus')}New event</button>`)
    + `${Charts.legend([
      { color: 'var(--info)', label: 'Meetings' },
      { color: 'var(--bad)', label: 'Deadlines' },
      { color: 'var(--text-3)', label: 'Tasks' },
      { color: 'var(--accent)', label: 'Content' },
    ])}<div style="height:14px"></div>
    <div id="cal-body">${calBody()}</div>`;
};

function calBody() {
  if (calView === 2) return monthGrid();
  if (calView === 1) return weekView();
  return dayView();
}

/* July 2026: the 1st is a Wednesday. */
function monthGrid() {
  const dows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const firstDow = 2; // Wednesday index (0=Mon)
  const daysInMonth = 31;
  const leading = firstDow;
  const cells = [];
  for (let i = 0; i < leading; i++) cells.push({ label: 28 + i + 1, dim: true }); // Jun 29, 30
  for (let d = 1; d <= daysInMonth; d++) cells.push({ label: d, day: d });
  while (cells.length % 7) cells.push({ label: cells.length - leading - daysInMonth + 1, dim: true });

  return `<div class="cal-grid">
    ${dows.map(d => `<div class="cal-dow">${d}</div>`).join('')}
    ${cells.map(c => {
      const evs = c.day ? DB.events.map((e, idx) => ({ ...e, idx })).filter(e => e.day === c.day) : [];
      return `<div class="cal-cell ${c.dim ? 'dim' : ''} ${c.day === TODAY_DAY ? 'today' : ''}" ${c.day ? `data-cal-day="${c.day}"` : ''}>
        <span class="cd">${c.label}</span>
        ${evs.slice(0, 3).map(e => `<div class="cal-ev ${e.type}" data-ev-idx="${e.idx}" title="${UI.esc(e.title)} — click to remove">${e.time ? e.time + ' · ' : ''}${UI.esc(e.title)}</div>`).join('')}
        ${evs.length > 3 ? `<div class="tiny t3" style="margin-top:4px">+${evs.length - 3} more</div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

function weekView() {
  const days = [['Mon', 6], ['Tue', 7], ['Wed', 8], ['Thu', 9], ['Fri', 10], ['Sat', 11], ['Sun', 12]];
  return `<div class="card" style="padding:0;overflow:hidden">
    <div class="week-grid" style="border-top:none">
      <div></div>
      ${days.map(([n, d]) => `<div class="cal-dow" style="background:transparent;display:flex;gap:6px;align-items:center">${n}
        <span class="${d === 9 ? 'cd' : 'tiny t3'}" style="${d === 9 ? 'display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-size:11px' : ''}">${d}</span></div>`).join('')}
    </div>
    <div class="week-grid">
      ${[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => `
        <div class="week-hour">${h}:00</div>
        ${days.map(([, d]) => {
          const evs = DB.events.filter(e => e.day === d && e.time && parseInt(e.time) === h);
          return `<div class="week-slot">${evs.map(e =>
            `<div class="cal-ev ${e.type}" style="position:absolute;inset:3px;overflow:hidden">${UI.esc(e.title)}</div>`).join('')}</div>`;
        }).join('')}`).join('')}
    </div>
  </div>`;
}

function dayView() {
  const evs = DB.events.map((e, idx) => ({ ...e, idx })).filter(e => e.day === TODAY_DAY);
  return UI.card({
    title: `Today, ${TODAY_DAY} July`, icon: 'calendar',
    body: evs.length ? evs.map(e => `
      <div class="row">
        <span class="badge ${e.type === 'meeting' ? 'info' : e.type === 'content' ? 'gold' : e.type === 'deadline' ? 'bad' : ''}" style="min-width:70px;justify-content:center">${e.time || 'All day'}</span>
        <div class="row-main"><div class="row-title">${UI.esc(e.title)}</div><div class="row-sub" style="text-transform:capitalize">${e.type}</div></div>
        <button class="row-del" data-ev-idx="${e.idx}" title="Remove">${icon('x')}</button>
      </div>`).join('') : UI.empty('calendar', 'Clear day', 'Nothing scheduled — protect the deep work.'),
  });
}

function wireCal() {
  const body = document.querySelector('#cal-body');
  if (!body || body.dataset.wired) return;
  body.dataset.wired = '1';
  body.addEventListener('click', e => {
    const ev = e.target.closest('[data-ev-idx]');
    if (ev) {
      const evt = DB.events[+ev.dataset.evIdx];
      if (evt && confirm(`Remove "${evt.title}"?`)) {
        DB.events.splice(+ev.dataset.evIdx, 1);
        saveDB();
        body.innerHTML = calBody();
        wireCal();
        UI.toast('Event removed');
      }
      return;
    }
    const cell = e.target.closest('[data-cal-day]');
    if (cell) Create.event({ day: +cell.dataset.calDay });
  });
}

Pages._mount.calendar = () => {
  wireSeg(document.querySelector('.page'), i => {
    calView = i;
    document.querySelector('#cal-body').innerHTML = calBody();
    wireCal();
  });
  document.querySelector('[data-new-event]')?.addEventListener('click', () => Create.event());
  wireCal();
};
