/* ============================================================
   Projects — kanban board + project detail with workspaces
   ============================================================ */

const STAGE_COLORS = {
  Ideas: 'var(--text-3)', Planning: 'var(--warn)', Design: 'var(--accent)',
  Development: 'var(--info)', Testing: 'var(--series-2)', Review: 'var(--info)',
  Ready: 'var(--good)', Completed: 'var(--good)',
};

Pages.projects = (id) => id ? projectDetail(id) : projectBoard();

function projectBoard() {
  return pageHead('Projects', `${DB.projects.filter(p => p.stage !== 'Completed').length} in motion across ${DB.stages.length} stages`,
    `<button class="btn" data-sync-netlify>${icon('refresh')}Sync Netlify</button>
     <button class="btn primary" data-new-project>${icon('plus')}New project</button>`)
    + `<div class="kanban">
      ${DB.stages.map(stage => {
        const items = DB.projects.filter(p => p.stage === stage);
        return `<div class="kcol">
          <div class="kcol-head">
            <span class="kdot" style="background:${STAGE_COLORS[stage]}"></span>${stage}
            <span class="kcount">${items.length}</span>
          </div>
          <div class="kcol-body">
            ${items.length ? items.map(p => {
              const c = p.clientId ? clientById(p.clientId) : null;
              return `<a class="kcard" href="#/projects/${p.id}">
                <div class="kcard-title">${UI.esc(p.name)}${p.netlifyUrl ? ` <span class="badge good" style="font-size:10px;padding:1px 7px;vertical-align:2px"><span class="bdot"></span>Live</span>` : ''}</div>
                <div class="kcard-meta">
                  ${UI.avatar(c ? c.initials : 'ST', 'a32', !c)}
                  <span class="tiny t3" style="flex:1">${c ? UI.esc(c.name) : 'Internal'}</span>
                  <span class="tiny t3">${p.due}</span>
                </div>
                ${p.progress ? `<div style="margin-top:11px">${UI.progress(p.progress)}</div>` : ''}
                <div class="kcard-meta" style="margin-top:10px">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
              </a>`;
            }).join('') : `<div class="tiny t3" style="text-align:center;padding:14px 0">No projects</div>`}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

const PROJECT_TABS = ['Overview', 'Tasks', 'Milestones', 'Claude Workspace', 'ChatGPT Workspace', 'Meeting Notes', 'Files', 'Feature Requests'];

function projectDetail(id) {
  const p = projectById(id);
  if (!p) return UI.empty('projects', 'Project not found', 'This project may have been removed.');
  const c = p.clientId ? clientById(p.clientId) : null;
  return `
    <a class="back-link" href="#/projects">${icon('chevronLeft')}Board</a>
    <div class="detail-hero">
      ${UI.avatar(c ? c.initials : 'ST', 'a56', !c)}
      <div style="flex:1">
        <div class="page-title" style="font-size:26px">${UI.esc(p.name)}</div>
        <div class="page-sub">${c ? `<a href="#/clients/${c.id}" style="color:var(--accent)">${UI.esc(c.name)}</a> · ` : 'Internal · '}due ${p.due} · ${p.hours}h logged${p.netlifyUrl ? ` · <a href="${UI.esc(p.netlifyUrl)}" target="_blank" rel="noopener" style="color:var(--good)">● Live site ↗</a>` : ''}</div>
      </div>
      <select class="select" data-stage-select style="width:auto;padding:7px 11px">${DB.stages.map(s => `<option ${s === p.stage ? 'selected' : ''}>${s}</option>`).join('')}</select>
      <div style="width:150px" class="stack">
        <input type="range" class="slider" data-progress-slider min="0" max="100" step="5" value="${p.progress}">
        <span class="tiny t3" style="text-align:right"><span data-progress-val>${p.progress}</span>% complete</span>
      </div>
      <button class="btn danger-ghost sm" data-del-project title="Delete project" style="color:var(--bad)">${icon('x')}Delete</button>
    </div>
    ${UI.tabs(PROJECT_TABS, 0)}
    <div id="project-tab-body">${projectTabBody(p, 0)}</div>`;
}

function projectTabBody(p, tab) {
  const name = PROJECT_TABS[tab];
  const ts = DB.tasks.filter(t => t.projectId === p.id);

  if (name === 'Overview') {
    return `<div class="dash-grid">
      <div class="span-8">
        ${UI.card({ title: 'Brief', icon: 'fileText', body: `<p class="brief-text small t2" style="font-size:13.5px;line-height:1.7">${UI.esc(p.desc)}</p>` })}
        <div style="height:16px"></div>
        ${UI.card({
          title: 'Open tasks', icon: 'tasks',
          body: ts.filter(t => !t.done).length ? ts.filter(t => !t.done).map(t => UI.taskRow(t)).join('')
            : UI.empty('check', 'Nothing open', 'All tasks for this project are done.', 'Add task'),
        })}
      </div>
      <div class="span-4">
        ${UI.card({
          title: 'Progress', icon: 'target',
          body: `<div style="display:grid;place-items:center;padding:10px 0">${Charts.ring(p.progress, { size: 120, stroke: 9 })}</div>
            <div class="info-list">
              <div class="il-row">${icon('flag')}<span>Stage</span><b>${p.stage}</b></div>
              <div class="il-row">${icon('calendar')}<span>Due</span><b>${p.due}</b></div>
              <div class="il-row">${icon('clock')}<span>Logged</span><b>${p.hours} hours</b></div>
              <div class="il-row">${icon('hash')}<span>Tags</span><b>${p.tags.join(', ')}</b></div>
            </div>`,
        })}
        <div style="height:16px"></div>
        ${UI.card({
          title: 'Milestones', icon: 'flag',
          body: milestonesFor(p).map(m => `
            <div class="milestone-row">
              <span class="check ${m.done ? 'done' : ''}">${icon('check')}</span>
              <div class="row-main"><div class="row-title small" style="${m.done ? 'color:var(--text-3)' : ''}">${m.label}</div></div>
              <span class="tiny t3">${m.when}</span>
            </div>`).join(''),
        })}
      </div>
    </div>`;
  }

  if (name === 'Tasks') {
    return UI.card({
      title: `${ts.length} tasks`, icon: 'tasks',
      body: `<div class="quick-add" style="margin-bottom:12px">${icon('plus')}<input placeholder="Add a task to ${UI.esc(p.name)}…"></div>`
        + (ts.length ? ts.map(t => UI.taskRow(t)).join('') : UI.empty('tasks', 'No tasks yet', 'Break the project down into first steps.')),
    });
  }

  if (name === 'Milestones') {
    return UI.card({
      title: 'Milestones', icon: 'flag',
      body: milestonesFor(p).map(m => `
        <div class="milestone-row">
          <span class="check ${m.done ? 'done' : ''}">${icon('check')}</span>
          <div class="row-main"><div class="row-title" style="${m.done ? 'color:var(--text-3)' : ''}">${m.label}</div>
          <div class="row-sub">${m.detail}</div></div>
          <span class="small t3">${m.when}</span>
        </div>`).join(''),
    });
  }

  if (name === 'Claude Workspace' || name === 'ChatGPT Workspace') {
    const isClaude = name.startsWith('Claude');
    const chats = DB.aiChats.filter(a => a.source === (isClaude ? 'Claude' : 'ChatGPT'));
    return `<div class="dash-grid">
      <div class="span-7">${UI.card({
        title: name, icon: 'ai',
        body: `
          <div class="workspace-msg"><div class="wm-head">${UI.avatar(isClaude ? 'C' : 'G', 'a32', true)} ${isClaude ? 'Claude' : 'ChatGPT'}</div>
            ${isClaude
              ? 'Saved context for this project lives here — architecture calls, naming decisions, and the current build thread. Paste a conversation or link a chat to keep the project\'s brain in one place.'
              : 'Marketing copy, captions and alternative angles for this project. Everything generated for it stays attached to it.'}
          </div>
          <div class="workspace-msg me"><div class="wm-head">${UI.avatar('AM', 'a32')} Aiman</div>
            Next session: ${isClaude ? 'finalise the ' + UI.esc(p.name) + ' handover checklist before deploy.' : 'draft the launch announcement for ' + UI.esc(p.name) + '.'}
          </div>
          <div class="quick-add" style="margin-top:14px">${icon('paperclip')}<input placeholder="Paste a chat link or note to attach…"><button class="btn sm primary">${icon('send')}Save</button></div>`,
      })}</div>
      <div class="span-5">${UI.card({
        title: 'Linked chats', icon: 'message', link: 'AI Hub', linkHref: '#/aihub',
        body: chats.map(a => `
          <div class="row">
            <div class="row-main"><div class="row-title">${UI.esc(a.title)}</div><div class="row-sub">${UI.esc(a.preview)}</div></div>
            <span class="tiny t3">${a.time}</span>
          </div>`).join(''),
      })}</div>
    </div>`;
  }

  if (name === 'Meeting Notes') {
    return UI.card({
      title: 'Meeting notes', icon: 'calendar',
      body: DB.meetingNotes.slice(0, 2).map(m => `
        <div class="row" style="align-items:flex-start">
          <div class="row-main">
            <div class="row-title">${UI.esc(m.title)} <span class="tiny t3" style="font-weight:400">· ${m.date}</span></div>
            <ul class="small t2" style="margin-top:5px;line-height:1.7">${m.points.map(pt => `<li>— ${UI.esc(pt)}</li>`).join('')}</ul>
          </div>
        </div>`).join(''),
    });
  }

  if (name === 'Files') {
    const files = DB.documents.filter(d => d.type !== 'folder').slice(0, 3);
    return UI.card({ title: 'Project files', icon: 'folder', body: files.map(d => docRow(d)).join('') });
  }

  if (name === 'Feature Requests') {
    return UI.card({
      title: 'Feature requests', icon: 'lightbulb',
      body: p.id === 'p1'
        ? `<div class="row"><div class="row-main"><div class="row-title">Arabic-language menu</div><div class="row-sub">Requested by Sam · phase 2</div></div>${UI.statusBadge('Planned')}</div>
           <div class="row"><div class="row-main"><div class="row-title">Counter QR poster</div><div class="row-sub">Print asset for in-store ordering</div></div>${UI.statusBadge('Idea')}</div>`
        : UI.empty('lightbulb', 'No requests yet', 'Client feature requests get logged and triaged here.', 'Log request'),
    });
  }
  return '';
}

function milestonesFor(p) {
  const base = [
    { label: 'Scope agreed', detail: 'Fixed price and deliverables signed off', when: 'Done', done: true },
    { label: 'Design approved', detail: 'Visual direction locked with client', when: p.progress >= 40 ? 'Done' : p.due, done: p.progress >= 40 },
    { label: 'Build complete', detail: 'All screens functional end-to-end', when: p.progress >= 80 ? 'Done' : p.due, done: p.progress >= 80 },
    { label: 'Verified & launched', detail: 'Tested, deployed, handed over', when: p.progress === 100 ? 'Done' : p.due, done: p.progress === 100 },
  ];
  return base;
}

/* ============================================================
   Netlify sync — pull every live site on the account, import the
   ones worth tracking, and flag board projects whose site has
   been deleted from Netlify.
   ============================================================ */
const SITES_URL = 'https://aiman-business-os.netlify.app/.netlify/functions/sites';

const prettySiteName = n => n.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()).replace(/ Demo 2026| 2026/gi, ' (demo)');

async function syncNetlify() {
  if (typeof leadsKey !== 'function' || !leadsKey()) {
    UI.toast('Connect your access key on the Enquiries page first');
    location.hash = '#/enquiries';
    return;
  }
  UI.toast('Talking to Netlify…');
  let sites;
  try {
    const r = await fetch(SITES_URL + '?key=' + encodeURIComponent(leadsKey()));
    if (!r.ok) { UI.toast('Netlify sync failed (' + r.status + ') — try again in a minute'); return; }
    sites = (await r.json()).sites || [];
  } catch (e) { UI.toast('No connection — try again'); return; }

  const linked = id => DB.projects.find(p => p.netlifyId === id);
  const gone = DB.projects.filter(p => p.netlifyId && !sites.some(s => s.id === p.netlifyId));

  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="palette" style="max-height:82vh;display:flex;flex-direction:column">
    <div class="spread" style="padding:18px 20px 10px">
      <div><b style="font-size:16px">Netlify — ${sites.length} live site${sites.length === 1 ? '' : 's'}</b>
      <div class="tiny t3" style="margin-top:2px">Import the ones you want on your board. Delete unused sites in Netlify, sync again, and I'll flag them here.</div></div>
      <button class="icon-btn" data-close>${icon('x')}</button>
    </div>
    <div style="overflow-y:auto;padding:4px 12px 14px">
      ${gone.length ? `<div class="ql-group-label" style="color:var(--bad)">Gone from Netlify — site was deleted</div>
        ${gone.map(p => `<div class="ql-row">
          <span class="ql-fav" style="color:var(--bad)">${icon('x')}</span>
          <span class="ql-main"><span class="ql-name">${UI.esc(p.name)}</span><span class="ql-url">not on Netlify anymore</span></span>
          <div class="ql-actions">
            <button class="btn sm" data-ns-complete="${p.id}">Mark Completed</button>
            <button class="btn sm ghost" data-ns-unlink="${p.id}">Unlink</button>
          </div>
        </div>`).join('')}` : ''}
      <div class="ql-group-label">Live on Netlify</div>
      ${sites.map((s, i) => {
        const p = linked(s.id);
        const when = s.publishedAt || s.updated;
        return `<div class="ql-row">
          <a class="ql-open" href="${UI.esc(s.url)}" target="_blank" rel="noopener">
            <span class="ql-fav">${icon('globe')}</span>
            <span class="ql-main">
              <span class="ql-name">${UI.esc(prettySiteName(s.name))}</span>
              <span class="ql-url">${UI.esc(s.url.replace('https://', ''))}${when ? ' · updated ' + new Date(when).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : ''}</span>
            </span>
          </a>
          <div class="ql-actions">
            ${p ? `<span class="badge good"><span class="bdot"></span>On board</span>`
                : `<button class="btn sm primary" data-ns-import="${i}">${icon('plus')}Import</button>`}
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
  document.body.appendChild(ov);

  const close = () => ov.remove();
  ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
  ov.querySelector('[data-close]').addEventListener('click', close);

  ov.querySelectorAll('[data-ns-import]').forEach(b => b.addEventListener('click', () => {
    const s = sites[+b.dataset.nsImport];
    if (!s || DB.projects.some(p => p.netlifyId === s.id)) return;
    DB.projects.unshift({
      id: uid('p'), name: prettySiteName(s.name), clientId: null,
      stage: 'Ready', progress: 90, due: '—', tags: ['Live', 'Netlify'], hours: 0,
      desc: 'Live at ' + s.url + ' — imported from Netlify. Set the real stage and notes as you go.',
      netlifyId: s.id, netlifyUrl: s.url,
    });
    saveDB();
    b.outerHTML = `<span class="badge good"><span class="bdot"></span>On board</span>`;
    UI.toast(prettySiteName(s.name) + ' added to your board');
  }));

  ov.querySelectorAll('[data-ns-complete]').forEach(b => b.addEventListener('click', () => {
    const p = DB.projects.find(x => x.id === b.dataset.nsComplete);
    if (!p) return;
    p.stage = 'Completed'; p.progress = 100; delete p.netlifyId; delete p.netlifyUrl;
    saveDB(); b.closest('.ql-row').remove(); App.refresh(); UI.toast(p.name + ' marked Completed');
  }));
  ov.querySelectorAll('[data-ns-unlink]').forEach(b => b.addEventListener('click', () => {
    const p = DB.projects.find(x => x.id === b.dataset.nsUnlink);
    if (!p) return;
    delete p.netlifyId; delete p.netlifyUrl;
    saveDB(); b.closest('.ql-row').remove(); App.refresh(); UI.toast('Unlinked — it stays on your board');
  }));
}

Pages._mount.projects = (id) => {
  if (!id) {
    document.querySelector('[data-new-project]')?.addEventListener('click', () => Create.project());
    document.querySelector('[data-sync-netlify]')?.addEventListener('click', syncNetlify);
    return;
  }
  const p = projectById(id);
  if (!p) return;
  wireTabs(document.querySelector('.page'), tab => {
    document.querySelector('#project-tab-body').innerHTML = projectTabBody(p, tab);
  });
  document.querySelector('[data-stage-select]')?.addEventListener('change', e => {
    p.stage = e.target.value;
    if (p.stage === 'Completed') p.progress = 100;
    saveDB(); App.refresh(); UI.toast('Moved to ' + p.stage);
  });
  const slider = document.querySelector('[data-progress-slider]');
  slider?.addEventListener('input', () => {
    document.querySelector('[data-progress-val]').textContent = slider.value;
  });
  slider?.addEventListener('change', () => {
    p.progress = +slider.value;
    saveDB(); App.refresh();
  });
  document.querySelector('[data-del-project]')?.addEventListener('click', () => {
    if (!confirm(`Delete "${p.name}"? Its tasks stay but lose the project link.`)) return;
    DB.tasks.forEach(t => { if (t.projectId === p.id) t.projectId = null; });
    DB.projects = DB.projects.filter(x => x.id !== p.id);
    saveDB();
    location.hash = '#/projects';
    UI.toast('Project deleted');
  });
};
