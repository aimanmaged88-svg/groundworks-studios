/* ============================================================
   AI Hub — the studio's brain. Chats, prompts, decisions,
   ideas, voice notes, meeting notes. API-ready, no API yet.
   ============================================================ */

const HUB_SECTIONS = [
  { id: 'chats', label: 'AI Chats', icon: 'message' },
  { id: 'prompts', label: 'Prompt Library', icon: 'book' },
  { id: 'decisions', label: 'Architecture Decisions', icon: 'gitBranch' },
  { id: 'ideas', label: 'Business Ideas', icon: 'lightbulb' },
  { id: 'voice', label: 'Voice Notes', icon: 'mic' },
  { id: 'meetings', label: 'Meeting Notes', icon: 'calendar' },
  { id: 'summaries', label: 'Daily Summaries', icon: 'fileText' },
];

let hubSection = 'chats';

Pages.aihub = () => {
  return pageHead('AI Hub', 'Every conversation, prompt and decision — searchable, in one place.',
    `<button class="btn" data-new-prompt>${icon('book')}New prompt</button>
     <button class="btn" data-new-idea>${icon('lightbulb')}New idea</button>
     <button class="btn primary" data-new-chat>${icon('plus')}Save a chat</button>`)
    + `<div class="ai-search">${icon('ai')}<input placeholder="Ask your second brain — “what did we decide about single-file apps?”"><span class="kbd">AI Search · Phase 2</span></div>
    <div class="hub-layout">
      <nav class="hub-nav">
        ${HUB_SECTIONS.map(s => `<button class="nav-item ${s.id === hubSection ? 'active' : ''}" data-hub="${s.id}">${icon(s.icon)}<span>${s.label}</span></button>`).join('')}
      </nav>
      <div id="hub-body">${hubBody()}</div>
    </div>`;
};

function hubBody() {
  if (hubSection === 'chats') {
    return `<div class="grid" style="grid-template-columns:1fr 1fr">
      ${DB.aiChats.map(a => `
        <div class="card hoverable">
          <div class="spread" style="margin-bottom:9px">
            <span class="badge ${a.source === 'Claude' ? 'gold' : 'info'}">${a.source}</span>
            <span class="flex" style="gap:6px">${a.pinned ? `<span style="color:var(--accent)">${icon('star')}</span>` : ''}<span class="tiny t3">${a.time}</span></span>
          </div>
          <div class="row-title" style="font-size:13.5px;white-space:normal">${UI.esc(a.title)}</div>
          <p class="small t3" style="margin-top:6px;line-height:1.55">${UI.esc(a.preview)}</p>
          <div class="flex" style="margin-top:12px;gap:6px">${a.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>
        </div>`).join('')}
    </div>`;
  }

  if (hubSection === 'prompts') {
    return `<div class="grid" style="grid-template-columns:1fr 1fr">
      ${DB.prompts.map(p => `
        <div class="card hoverable prompt-card">
          <div class="spread">
            <span class="row-title" style="font-size:13.5px">${UI.esc(p.title)}</span>
            <span class="tiny t3">used ${p.uses}×</span>
          </div>
          <div class="pc-body">${UI.esc(p.body)}</div>
          <div class="spread" style="margin-top:12px">
            <div class="flex" style="gap:6px">${p.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>
            <button class="btn sm" data-copy-prompt="${UI.esc(p.title)}">${icon('paperclip')}Copy</button>
          </div>
        </div>`).join('')}
    </div>`;
  }

  if (hubSection === 'decisions') {
    return DB.decisions.map(d => `
      <div class="card" style="margin-bottom:14px">
        <div class="spread" style="margin-bottom:8px">
          <span class="row-title" style="font-size:14px">${UI.esc(d.title)}</span>
          <span class="flex" style="gap:8px"><span class="tag">${d.tag}</span><span class="tiny t3">${d.date}</span></span>
        </div>
        <p class="small t2" style="line-height:1.65">${UI.esc(d.body)}</p>
      </div>`).join('');
  }

  if (hubSection === 'ideas') {
    return `<div class="grid" style="grid-template-columns:1fr 1fr 1fr">
      ${DB.ideas.map(i => `
        <div class="card hoverable">
          <span style="color:var(--accent)">${icon('lightbulb')}</span>
          <div class="row-title" style="font-size:13.5px;margin-top:10px;white-space:normal">${UI.esc(i.title)}</div>
          <p class="small t3" style="margin-top:6px;line-height:1.55">${UI.esc(i.body)}</p>
          <div class="tiny t3" style="margin-top:12px">${i.date}</div>
        </div>`).join('')}
    </div>`;
  }

  if (hubSection === 'voice') {
    return UI.card({
      title: 'Voice notes', icon: 'mic',
      body: DB.voiceNotes.map(v => `
        <div class="row">
          <button class="icon-btn" style="border-color:var(--border);background:var(--card-2)">${icon('mic')}</button>
          <div class="row-main"><div class="row-title">${UI.esc(v.title)}</div><div class="row-sub">${v.length} · ${v.date}</div></div>
          <button class="btn sm ghost">Transcribe <span class="tiny t3">Phase 2</span></button>
        </div>`).join(''),
    });
  }

  if (hubSection === 'meetings') {
    return DB.meetingNotes.map(m => `
      <div class="card" style="margin-bottom:14px">
        <div class="spread" style="margin-bottom:8px">
          <span class="row-title" style="font-size:14px">${UI.esc(m.title)}</span>
          <span class="tiny t3">${m.date}</span>
        </div>
        <ul class="small t2" style="line-height:1.8">${m.points.map(p => `<li>— ${UI.esc(p)}</li>`).join('')}</ul>
      </div>`).join('');
  }

  if (hubSection === 'summaries') {
    return UI.card({
      title: 'Daily summaries', icon: 'fileText',
      body: UI.empty('ai', 'Summaries start in Phase 2', 'Once the AI connection is live, each day ends with an automatic summary of what moved.', 'Preview format'),
    });
  }
  return '';
}

function wireHubBody() {
  document.querySelectorAll('[data-copy-prompt]').forEach(b =>
    b.addEventListener('click', () => {
      const p = DB.prompts.find(x => x.title === b.dataset.copyPrompt);
      if (!p) return;
      p.uses++;
      saveDB();
      (navigator.clipboard?.writeText(p.body) || Promise.reject()).then(
        () => UI.toast('Prompt copied to clipboard'),
        () => UI.toast('Copy blocked by browser — select the text instead'));
    }));
}

Pages._mount.aihub = () => {
  document.querySelectorAll('[data-hub]').forEach(btn =>
    btn.addEventListener('click', () => {
      hubSection = btn.dataset.hub;
      document.querySelectorAll('[data-hub]').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelector('#hub-body').innerHTML = hubBody();
      wireHubBody();
    }));
  document.querySelector('[data-new-chat]')?.addEventListener('click', () => Create.aiChat());
  document.querySelector('[data-new-prompt]')?.addEventListener('click', () => Create.prompt());
  document.querySelector('[data-new-idea]')?.addEventListener('click', () => Create.idea());
  wireHubBody();
};
