/* ============================================================
   Tasks — list + board views, quick add, filters
   ============================================================ */

let taskView = 0; // 0 list, 1 board

Pages.tasks = () => {
  const open = DB.tasks.filter(t => !t.done);
  return pageHead('Tasks', `${open.length} open · ${DB.tasks.filter(t => t.due === 'Today' && !t.done).length} due today`,
    UI.seg(['List', 'Board'], taskView) + `<button class="btn">${icon('filter')}Filter</button>`)
    + `<div class="task-toolbar">
      <div class="quick-add">${icon('plus')}<input id="task-add" placeholder="Quick add — try “Send Kahil launch checklist tomorrow”…"><span class="kbd">Enter</span></div>
    </div>
    <div id="task-body">${taskView ? taskBoard() : taskList()}</div>`;
};

function taskList() {
  const groups = [
    { label: 'Today', filt: t => !t.done && t.due === 'Today' },
    { label: 'This week', filt: t => !t.done && ['Tomorrow', 'Fri', 'Jul 12', 'Jul 14'].includes(t.due) },
    { label: 'Later', filt: t => !t.done && !['Today', 'Tomorrow', 'Fri', 'Jul 12', 'Jul 14'].includes(t.due) },
    { label: 'Done', filt: t => t.done },
  ];
  return `<div class="card" style="padding:8px 20px 14px">
    ${groups.map(g => {
      const items = DB.tasks.filter(g.filt);
      if (!items.length) return '';
      return `<div class="task-group-head">
        <span class="label">${g.label}</span>
        <span class="tiny t3">${items.length}</span>
      </div>${items.map(t => UI.taskRow(t)).join('')}`;
    }).join('')}
  </div>`;
}

function taskBoard() {
  const cols = [
    { label: 'To do', color: 'var(--text-3)', filt: t => t.status === 'Todo' },
    { label: 'In progress', color: 'var(--info)', filt: t => t.status === 'In Progress' },
    { label: 'Done', color: 'var(--good)', filt: t => t.status === 'Done' },
  ];
  return `<div class="kanban">
    ${cols.map(c => {
      const items = DB.tasks.filter(c.filt);
      return `<div class="kcol" style="width:320px">
        <div class="kcol-head"><span class="kdot" style="background:${c.color}"></span>${c.label}<span class="kcount">${items.length}</span></div>
        <div class="kcol-body">
          ${items.map(t => {
            const proj = t.projectId ? projectById(t.projectId) : null;
            return `<div class="kcard">
              <div class="kcard-title" style="${t.done ? 'text-decoration:line-through;color:var(--text-3)' : ''}">${UI.esc(t.title)}</div>
              <div class="kcard-meta">
                ${UI.priorityBadge(t.priority)}
                <span class="tiny t3" style="flex:1">${proj ? UI.esc(proj.name.split('—')[0].trim()) : 'Studio'}</span>
                <span class="tiny t3">${t.due}</span>
              </div>
            </div>`;
          }).join('') || '<div class="tiny t3" style="text-align:center;padding:14px 0">Empty</div>'}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

Pages._mount.tasks = () => {
  wireSeg(document.querySelector('.page'), i => {
    taskView = i;
    document.querySelector('#task-body').innerHTML = i ? taskBoard() : taskList();
  });
  const input = document.querySelector('#task-add');
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim()) {
      DB.tasks.unshift({
        id: uid('t'), title: input.value.trim(),
        projectId: null, clientId: null, priority: 'Medium', due: 'Today', status: 'Todo', tags: ['quick'], done: false,
      });
      saveDB();
      input.value = '';
      document.querySelector('#task-body').innerHTML = taskView ? taskBoard() : taskList();
      UI.toast('Task added to Today');
    }
  });
};
