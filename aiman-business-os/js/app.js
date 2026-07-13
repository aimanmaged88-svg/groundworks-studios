/* ============================================================
   BUSINESS STUDIO OS — Shell: router, palette, popovers, theme
   ============================================================ */

const App = (() => {

  const NAV = [
    { section: 'Workspace', items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'enquiries', label: 'Enquiries', icon: 'mail' },
      { id: 'prospects', label: 'Lead Finder', icon: 'target' },
      { id: 'clients', label: 'Clients', icon: 'clients' },
      { id: 'projects', label: 'Projects', icon: 'projects' },
      { id: 'tasks', label: 'Tasks', icon: 'tasks' },
      { id: 'calendar', label: 'Calendar', icon: 'calendar' },
    ]},
    { section: 'Studio', items: [
      { id: 'aihub', label: 'AI Hub', icon: 'ai' },
      { id: 'content', label: 'Content Studio', icon: 'content' },
      { id: 'finance', label: 'Finance', icon: 'finance' },
      { id: 'documents', label: 'Documents', icon: 'documents' },
      { id: 'analytics', label: 'Analytics', icon: 'analytics' },
    ]},
    { section: 'System', items: [
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ]},
  ];

  const TITLES = {
    dashboard: 'Dashboard', enquiries: 'Enquiries', prospects: 'Lead Finder', clients: 'Clients', projects: 'Projects', tasks: 'Tasks',
    calendar: 'Calendar', aihub: 'AI Hub', content: 'Content Studio', finance: 'Finance',
    documents: 'Documents', analytics: 'Analytics', settings: 'Settings',
  };

  /* ---------- Theme ---------- */
  function setTheme(mode, save = true) {
    if (mode === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
    if (save) try { localStorage.setItem('bsos-theme', mode); } catch (e) {}
    const btn = document.querySelector('#theme-btn');
    if (btn) btn.innerHTML = icon(mode === 'light' ? 'moon' : 'sun');
  }
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  /* ---------- Shell render ---------- */
  function renderShell() {
    document.body.innerHTML = `
      <div class="shell">
        <aside class="sidebar">
          <a class="brand" href="#/dashboard">
            <div class="brand-mark" style="padding:6px">
              <svg viewBox="0 0 122 122" width="17" height="17" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <g fill="#FFFFFF"><rect x="31.3" y="0" width="28" height="28"/><rect x="62.6" y="0" width="28" height="28"/><rect x="94" y="0" width="28" height="28"/><rect x="62.6" y="62.6" width="28" height="28"/><rect x="94" y="62.6" width="28" height="28"/></g>
                <g fill="#FFFFFF" opacity="0.6"><rect x="0" y="0" width="28" height="28"/><rect x="0" y="31.3" width="28" height="28"/><rect x="0" y="62.6" width="28" height="28"/><rect x="0" y="94" width="28" height="28"/><rect x="31.3" y="94" width="28" height="28"/><rect x="62.6" y="94" width="28" height="28"/><rect x="94" y="94" width="28" height="28"/></g>
              </svg>
            </div>
            <div class="brand-text">
              <div class="brand-name">${DB.user.business}</div>
              <div class="brand-sub">Business Systems Studio</div>
            </div>
          </a>
          ${NAV.map(g => `
            <div class="nav-section">
              <span class="label">${g.section}</span>
              ${g.items.map(it => `
                <a class="nav-item" data-nav="${it.id}" href="#/${it.id}">
                  ${icon(it.icon)}<span>${it.label}</span>
                </a>`).join('')}
            </div>`).join('')}
          <div class="sidebar-foot">
            <div class="storage-chip">
              <div class="spread"><span class="tiny t3">Groundwork OS</span><span class="tiny" style="color:var(--accent)">v2.0</span></div>
              <div class="progress" style="margin-top:8px"><i style="width:80%"></i></div>
              <div class="tiny t3" style="margin-top:6px" id="sync-status">Local only — connect sync in Settings</div>
            </div>
          </div>
        </aside>
        <div class="main">
          <header class="topbar">
            <div class="crumb" id="crumb"><b>Dashboard</b></div>
            <button class="topbar-search" id="open-palette">
              ${icon('search')}<span>Search anything…</span><span class="kbd">Ctrl K</span>
            </button>
            <button class="icon-btn" id="quick-create" title="Quick create">${icon('plus')}</button>
            <button class="icon-btn" id="sound-btn" title="Sounds">${icon('volume')}</button>
            <button class="icon-btn" id="theme-btn" title="Toggle theme">${icon('sun')}</button>
            <button class="icon-btn" id="notif-btn" title="Notifications">${icon('bell')}<span class="dot"></span></button>
            <button class="avatar-btn" id="profile-btn">${DB.user.initials}</button>
          </header>
          <main class="view" id="view"></main>
        </div>
      </div>
      <nav class="bottom-nav" id="bottom-nav">
        <a data-bnav="dashboard" href="#/dashboard">${icon('dashboard')}<span>Home</span></a>
        <a data-bnav="projects" href="#/projects">${icon('projects')}<span>Projects</span></a>
        <a data-bnav="tasks" href="#/tasks">${icon('tasks')}<span>Tasks</span></a>
        <a data-bnav="calendar" href="#/calendar">${icon('calendar')}<span>Calendar</span></a>
        <button id="bnav-more">${icon('dots')}<span>More</span></button>
      </nav>`;

    document.querySelector('#theme-btn').addEventListener('click', () =>
      setTheme(currentTheme() === 'light' ? 'dark' : 'light'));
    document.querySelector('#open-palette').addEventListener('click', openPalette);
    document.querySelector('#notif-btn').addEventListener('click', e => togglePopover('notif', e.currentTarget));
    document.querySelector('#profile-btn').addEventListener('click', e => togglePopover('profile', e.currentTarget));
    document.querySelector('#quick-create').addEventListener('click', e => togglePopover('create', e.currentTarget));
    document.querySelector('#bnav-more').addEventListener('click', openMoreSheet);
  }

  /* ---------- Router ---------- */
  function route() {
    const hash = location.hash.replace(/^#\/?/, '') || 'dashboard';
    const [page, param] = hash.split('/');
    const target = Pages[page] ? page : 'dashboard';

    document.querySelectorAll('.nav-item[data-nav]').forEach(el =>
      el.classList.toggle('active', el.dataset.nav === target));
    document.querySelectorAll('#bottom-nav [data-bnav]').forEach(el =>
      el.classList.toggle('active', el.dataset.bnav === target));

    const crumb = document.querySelector('#crumb');
    let sub = '';
    if (target === 'clients' && param) sub = clientById(param)?.name;
    if (target === 'projects' && param) sub = projectById(param)?.name;
    crumb.innerHTML = sub
      ? `<span>${TITLES[target]}</span>${icon('chevronRight')}<b>${UI.esc(sub)}</b>`
      : `<b>${TITLES[target]}</b>`;

    const view = document.querySelector('#view');
    view.scrollTop = 0;
    view.innerHTML = `<div class="page">${Pages[target](param) }</div>`;
    Pages.afterRender?.(target, param);
  }

  /* ---------- Command palette ---------- */
  function paletteItems() {
    const nav = NAV.flatMap(g => g.items).map(it => ({
      group: 'Go to', icon: it.icon, label: it.label, action: () => location.hash = '#/' + it.id,
    }));
    const clients = DB.clients.map(c => ({
      group: 'Clients', icon: 'clients', label: c.name, action: () => location.hash = '#/clients/' + c.id,
    }));
    const projects = DB.projects.slice(0, 6).map(p => ({
      group: 'Projects', icon: 'projects', label: p.name, action: () => location.hash = '#/projects/' + p.id,
    }));
    const actions = [
      { group: 'Actions', icon: 'plus', label: 'New task', action: () => { location.hash = '#/tasks'; UI.toast('Focus the quick-add bar to create a task'); } },
      { group: 'Actions', icon: 'receipt', label: 'New invoice', action: () => { location.hash = '#/finance'; UI.toast('Invoice creation ships in Phase 2'); } },
      { group: 'Actions', icon: currentTheme() === 'light' ? 'moon' : 'sun', label: 'Toggle theme', action: () => setTheme(currentTheme() === 'light' ? 'dark' : 'light') },
    ];
    return [...actions, ...nav, ...clients, ...projects];
  }

  let palState = { open: false, sel: 0, items: [] };

  function openPalette() {
    closePopovers();
    if (palState.open) return;
    palState = { open: true, sel: 0, items: paletteItems() };
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'palette-ov';
    ov.innerHTML = `<div class="palette">
      <div class="palette-input">${icon('search')}<input id="pal-in" placeholder="Search pages, clients, projects, actions…" autocomplete="off"><span class="kbd">Esc</span></div>
      <div class="palette-list" id="pal-list"></div>
    </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('mousedown', e => { if (e.target === ov) closePalette(); });
    const input = ov.querySelector('#pal-in');
    input.focus();
    input.addEventListener('input', () => { palState.sel = 0; renderPaletteList(input.value); });
    input.addEventListener('keydown', e => {
      const vis = filteredPalette(input.value);
      if (e.key === 'ArrowDown') { e.preventDefault(); palState.sel = Math.min(vis.length - 1, palState.sel + 1); renderPaletteList(input.value); }
      if (e.key === 'ArrowUp') { e.preventDefault(); palState.sel = Math.max(0, palState.sel - 1); renderPaletteList(input.value); }
      if (e.key === 'Enter') { vis[palState.sel]?.action(); closePalette(); }
      if (e.key === 'Escape') closePalette();
    });
    renderPaletteList('');
  }

  function filteredPalette(q) {
    q = q.trim().toLowerCase();
    return palState.items.filter(it => !q || it.label.toLowerCase().includes(q) || it.group.toLowerCase().includes(q));
  }

  function renderPaletteList(q) {
    const list = document.querySelector('#pal-list');
    if (!list) return;
    const vis = filteredPalette(q);
    if (!vis.length) { list.innerHTML = UI.empty('search', 'No results', 'Try a client, project or page name.'); return; }
    let html = '', lastGroup = '';
    vis.forEach((it, i) => {
      if (it.group !== lastGroup) { html += `<div class="palette-group label">${it.group}</div>`; lastGroup = it.group; }
      html += `<button class="palette-item ${i === palState.sel ? 'sel' : ''}" data-pi="${i}">${icon(it.icon)}${UI.esc(it.label)}</button>`;
    });
    list.innerHTML = html;
    list.querySelectorAll('[data-pi]').forEach(el =>
      el.addEventListener('click', () => { vis[+el.dataset.pi].action(); closePalette(); }));
  }

  function closePalette() {
    document.querySelector('#palette-ov')?.remove();
    palState.open = false;
  }

  /* ---------- Popovers ---------- */
  let popOpen = null;
  function closePopovers() {
    document.querySelectorAll('.popover').forEach(p => p.remove());
    popOpen = null;
  }

  function togglePopover(kind, anchor) {
    if (popOpen === kind) return closePopovers();
    closePopovers();
    popOpen = kind;
    const pop = document.createElement('div');
    pop.className = 'popover';

    if (kind === 'notif') {
      pop.style.width = '340px';
      pop.innerHTML = `
        <div class="pop-head">Notifications <span class="badge gold">${DB.notifications.filter(n => n.unread).length} new</span></div>
        <div style="max-height:320px;overflow-y:auto;padding:6px 0">
          ${DB.notifications.map(n => `
            <div class="pop-item" style="align-items:flex-start;padding:11px 16px">
              <span style="margin-top:1px;${n.unread ? 'color:var(--accent)' : ''}">${icon(n.icon)}</span>
              <span style="flex:1;line-height:1.5">${n.text}<br><span class="tiny t3">${n.time}</span></span>
              ${n.unread ? '<span style="width:7px;height:7px;border-radius:50%;background:var(--accent);margin-top:6px;flex-shrink:0"></span>' : ''}
            </div>`).join('')}
        </div>
        <div class="pop-sep" style="margin:0"></div>
        <button class="pop-item" style="justify-content:center;color:var(--text-3);padding:11px">Mark all as read</button>`;
    }

    if (kind === 'profile') {
      pop.innerHTML = `
        <div class="pop-head" style="gap:11px;justify-content:flex-start">
          ${UI.avatar(DB.user.initials, 'a40', true)}
          <span class="stack" style="gap:1px"><b style="font-size:13.5px">${DB.user.name}</b><span class="tiny t3">${DB.user.business} · ${DB.user.role}</span></span>
        </div>
        <div style="padding:6px 0">
          <button class="pop-item" data-go="#/settings">${icon('user')}Profile</button>
          <button class="pop-item" data-go="#/settings">${icon('building')}Business settings</button>
          <button class="pop-item" data-go="#/settings">${icon('palette')}Appearance</button>
          <div class="pop-sep"></div>
          <button class="pop-item" id="pop-logout">${icon('logout')}Sign out <span class="tiny t3" style="margin-left:auto">Phase 2</span></button>
        </div>`;
    }

    if (kind === 'create') {
      pop.innerHTML = `
        <div class="pop-head">Quick create</div>
        <div style="padding:6px 0">
          <button class="pop-item" data-create="task">${icon('tasks')}Task</button>
          <button class="pop-item" data-create="project">${icon('projects')}Project</button>
          <button class="pop-item" data-create="client">${icon('clients')}Client</button>
          <button class="pop-item" data-create="invoice">${icon('receipt')}Invoice</button>
          <button class="pop-item" data-create="event">${icon('calendar')}Calendar event</button>
          <button class="pop-item" data-create="note">${icon('note')}Note</button>
          <button class="pop-item" data-create="contentPost">${icon('content')}Content post</button>
          <button class="pop-item" data-create="idea">${icon('lightbulb')}Business idea</button>
        </div>`;
    }

    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    const w = pop.offsetWidth;
    pop.style.top = (r.bottom + 10) + 'px';
    pop.style.left = Math.min(r.right - w, window.innerWidth - w - 12) + 'px';

    pop.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
      location.hash = b.dataset.go; closePopovers();
    }));
    pop.querySelectorAll('[data-create]').forEach(b => b.addEventListener('click', () => {
      closePopovers(); Create[b.dataset.create]();
    }));
    pop.querySelector('#pop-logout')?.addEventListener('click', () => {
      UI.toast('Auth arrives in Phase 2 — you\'re safe here.'); closePopovers();
    });
  }

  document.addEventListener('mousedown', e => {
    if (popOpen && !e.target.closest('.popover') && !e.target.closest('.icon-btn') && !e.target.closest('.avatar-btn')) closePopovers();
  });

  /* ---------- Mobile "More" sheet ---------- */
  function openMoreSheet() {
    const current = (location.hash.replace(/^#\/?/, '') || 'dashboard').split('/')[0];
    const ov = document.createElement('div');
    ov.className = 'sheet-overlay';
    ov.innerHTML = `<div class="sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-title">All sections</div>
      <div class="sheet-grid">
        ${NAV.flatMap(g => g.items).map(it => `
          <a class="sheet-item ${it.id === current ? 'active' : ''}" href="#/${it.id}" data-sheet-go>
            ${icon(it.icon)}<span>${it.label}</span>
          </a>`).join('')}
      </div>
    </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('mousedown', e => { if (e.target === ov) ov.remove(); });
    ov.querySelectorAll('[data-sheet-go]').forEach(a => a.addEventListener('click', () => ov.remove()));
  }

  /* ---------- Keyboard ---------- */
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palState.open ? closePalette() : openPalette(); }
    if (e.key === 'Escape') { closePalette(); closePopovers(); }
  });

  /* ---------- Boot ---------- */
  function boot() {
    let saved = 'light';
    try { saved = localStorage.getItem('bsos-theme') || 'light'; } catch (e) {}
    renderShell();
    setTheme(saved, false);
    window.addEventListener('hashchange', route);
    route();
  }

  return { boot, setTheme, currentTheme, refresh: route };
})();

document.addEventListener('DOMContentLoaded', App.boot);
