/* ============================================================
   Clients — card grid + full client detail with tabs
   ============================================================ */

Pages.clients = (id) => id ? clientDetail(id) : clientIndex();

function clientIndex() {
  return pageHead('Clients', `${DB.clients.length} relationships · ${fmt$(DB.clients.reduce((a, c) => a + (+c.value || 0), 0))} lifetime value`,
    `<button class="btn primary" data-new-client>${icon('plus')}New client</button>`)
    + `<div class="client-grid">
      ${DB.clients.map(c => `
        <a class="card hoverable client-card" href="#/clients/${c.id}">
          <div class="cc-top">
            ${UI.avatar(c.initials, 'a40', true)}
            <div class="row-main">
              <div class="row-title" style="font-size:14.5px">${UI.esc(c.name)}</div>
              <div class="row-sub">${UI.esc(c.industry)}</div>
            </div>
            ${UI.statusBadge(c.status)}
          </div>
          <p class="small t2" style="line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${UI.esc(c.summary)}</p>
          <div class="cc-stats">
            <div class="cc-stat"><b>${fmt$(c.value)}</b><span>Value</span></div>
            <div class="cc-stat"><b>${c.projects}</b><span>Projects</span></div>
            <div class="cc-stat"><b>${c.since}</b><span>Since</span></div>
          </div>
        </a>`).join('')}
    </div>`;
}

const CLIENT_TABS = ['Overview', 'Messages', 'Projects', 'Files', 'Invoices', 'Meetings', 'Timeline', 'Tasks', 'Notes'];

function clientDetail(id) {
  const c = clientById(id);
  if (!c) return UI.empty('clients', 'Client not found', 'This client may have been removed.');
  return `
    <a class="back-link" href="#/clients">${icon('chevronLeft')}All clients</a>
    <div class="detail-hero">
      ${UI.avatar(c.initials, 'a56', true)}
      <div style="flex:1">
        <div class="page-title" style="font-size:26px">${UI.esc(c.name)}</div>
        <div class="page-sub">${UI.esc(c.industry)} · ${UI.esc(c.location)} · Client since ${c.since}</div>
      </div>
      ${UI.statusBadge(c.status)}
      <div class="flex" style="gap:8px;flex-wrap:wrap;justify-content:flex-end">
        <button class="btn" data-edit-client>${icon('note')}Edit</button>
        ${c.phone && c.phone !== '—' ? `<a class="btn" href="tel:${UI.esc(c.phone.replace(/\s/g, ''))}">${icon('phone')}Call</a>` : ''}
        ${c.phone && c.phone !== '—' ? `<a class="btn" href="sms:${UI.esc(c.phone.replace(/\s/g, ''))}" data-text-client>${icon('message')}Text</a>` : ''}
        <button class="btn" data-email-client>${icon('mail')}Email</button>
        <button class="btn primary" data-new-project-for>${icon('plus')}New project</button>
        <button class="btn sm" data-del-client title="Delete client" style="color:var(--bad)">${icon('x')}</button>
      </div>
    </div>
    ${UI.tabs(CLIENT_TABS, 0)}
    <div id="client-tab-body">${clientTabBody(c, 0)}</div>`;
}

function clientTabBody(c, tab) {
  const name = CLIENT_TABS[tab];

  if (name === 'Overview') {
    const projs = projectsFor(c.id);
    const invs = DB.invoices.filter(i => i.client === c.name);
    return `<div class="dash-grid">
      <div class="span-8">
        ${UI.card({ title: 'AI Summary', icon: 'ai', cls: 'briefing', body: `<p class="brief-text">${UI.esc(c.summary)}</p>` })}
        <div style="height:16px"></div>
        ${UI.card({
          title: 'Active work', icon: 'projects',
          body: projs.length ? projs.map(p => `
            <a class="row clickable" href="#/projects/${p.id}">
              <div class="row-main"><div class="row-title">${UI.esc(p.name)}</div><div class="row-sub">due ${p.due} · ${p.hours}h logged</div></div>
              ${UI.statusBadge(p.stage)}
              <div style="width:110px">${UI.progress(p.progress)}</div>
            </a>`).join('') : UI.empty('projects', 'No projects yet', 'Start the first project for this client.', 'New project'),
        })}
        <div style="height:16px"></div>
        ${UI.card({
          title: 'Recent invoices', icon: 'receipt',
          body: invs.length ? UI.table(['Invoice', 'Status', 'Due', 'Amount'],
            invs.map(i => [`<span class="strong">${i.id}</span>`, UI.statusBadge(i.status), i.due, `<span class="strong num">${fmt$(i.amount)}</span>`]))
            : UI.empty('receipt', 'No invoices', 'Invoices for this client will appear here.'),
        })}
      </div>
      <div class="span-4">
        ${UI.card({
          title: 'Contact', icon: 'user',
          body: `<div class="info-list">
            <div class="il-row">${icon('user')}<span>Contact</span><b>${UI.esc(c.contact)}</b></div>
            <div class="il-row">${icon('mail')}<span>Email</span><b>${UI.esc(c.email)}</b></div>
            <div class="il-row">${icon('phone')}<span>Phone</span><b>${UI.esc(c.phone)}</b></div>
            <div class="il-row">${icon('globe')}<span>Site</span><b>${UI.esc(c.site)}</b></div>
            <div class="il-row">${icon('building')}<span>Location</span><b>${UI.esc(c.location)}</b></div>
          </div>`,
        })}
        <div style="height:16px"></div>
        ${UI.card({
          title: 'Timeline', icon: 'clock',
          body: `<div class="tl">${c.timeline.map(t => `
            <div class="tl-item">
              <div class="row-title small">${UI.esc(t.text)}</div>
              <div class="tiny t3">${t.date}</div>
            </div>`).join('')}</div>`,
        })}
      </div>
    </div>`;
  }

  if (name === 'Messages') {
    const comms = c.comms || [];
    return UI.card({
      title: 'Messages', icon: 'message',
      body: `
        <div class="msg-thread">${comms.length ? comms.map(m => `
          <div class="msg-bubble ${m.dir === 'out' ? 'out' : 'in'}">
            <div class="msg-text">${UI.esc(m.text)}</div>
            <div class="msg-meta">${m.channel === 'email' ? icon('mail') : icon('message')}${m.dir === 'out' ? 'Sent' : 'Received'} · ${UI.esc(m.time)}</div>
          </div>`).join('') : `<div class="msg-empty">${icon('message')}<b>No messages yet</b><p class="tiny t3">Write below and hit Text or Email — it opens your own phone/email app pre-filled and keeps a copy here. Got a reply? Log it so the whole conversation lives in one place.</p></div>`}
        </div>
        <div class="msg-compose">
          <textarea class="textarea" data-msg-input placeholder="Message ${UI.esc(c.contact && c.contact !== '—' ? c.contact : c.name)}…"></textarea>
          <div class="flex" style="gap:8px;margin-top:9px;flex-wrap:wrap">
            <button class="btn sm primary" data-msg-text>${icon('message')}Send text</button>
            <button class="btn sm" data-msg-email>${icon('mail')}Send email</button>
            <button class="btn sm" data-msg-refresh title="Check for new replies">${icon('refresh')}Check replies</button>
            <button class="btn sm ghost" data-msg-logreply style="margin-left:auto">${icon('plus')}Log a reply</button>
          </div>
          <div class="tiny t3" style="margin-top:8px">Once Twilio is connected, texts send from your business number and replies land here automatically. Until then, sending opens your phone's app and a copy is kept in this thread.</div>
        </div>`,
    });
  }

  if (name === 'Projects') {
    const projs = projectsFor(c.id);
    return UI.card({
      title: `${projs.length} project${projs.length === 1 ? '' : 's'}`, icon: 'projects',
      body: projs.length ? projs.map(p => `
        <a class="row clickable" href="#/projects/${p.id}">
          <div class="row-main"><div class="row-title">${UI.esc(p.name)}</div><div class="row-sub">${UI.esc(p.desc)}</div></div>
          ${UI.statusBadge(p.stage)}<div style="width:120px">${UI.progress(p.progress)}</div>
        </a>`).join('') : UI.empty('projects', 'No projects', 'Nothing here yet.', 'New project'),
    });
  }

  if (name === 'Files') {
    const files = DB.documents.filter(d => d.type !== 'folder').slice(0, 4);
    return UI.card({
      title: 'Client files', icon: 'folder', link: 'Documents', linkHref: '#/documents',
      body: files.map(d => docRow(d)).join(''),
    });
  }

  if (name === 'Invoices') {
    const invs = DB.invoices.filter(i => i.client === c.name);
    return UI.card({
      title: 'Invoices', icon: 'receipt',
      body: invs.length ? UI.table(['Invoice', 'Status', 'Due', 'Amount'],
        invs.map(i => [`<span class="strong">${i.id}</span>`, UI.statusBadge(i.status), i.due, `<span class="strong num">${fmt$(i.amount)}</span>`]))
        : UI.empty('receipt', 'No invoices yet', 'Create the first invoice for this client.', 'New invoice'),
    });
  }

  if (name === 'Meetings') {
    const notes = DB.meetingNotes.filter(m => m.title.toLowerCase().includes(c.name.split(' ')[0].toLowerCase()));
    const list = notes.length ? notes : [];
    return UI.card({
      title: 'Meeting notes', icon: 'calendar',
      body: list.length ? list.map(m => `
        <div class="row" style="align-items:flex-start">
          <span class="act-icon" style="width:30px;height:30px;border-radius:10px;background:var(--card-2);border:1px solid var(--border);display:grid;place-items:center;color:var(--text-3)">${icon('calendar')}</span>
          <div class="row-main">
            <div class="row-title">${UI.esc(m.title)} <span class="tiny t3" style="font-weight:400">· ${m.date}</span></div>
            <ul class="small t2" style="margin-top:5px;line-height:1.7">${m.points.map(p => `<li>— ${UI.esc(p)}</li>`).join('')}</ul>
          </div>
        </div>`).join('') : UI.empty('calendar', 'No meetings logged', 'Meeting notes for this client will live here.', 'Log meeting'),
    });
  }

  if (name === 'Timeline') {
    return UI.card({
      title: 'Relationship timeline', icon: 'clock',
      body: `<div class="tl" style="max-width:560px">${c.timeline.map(t => `
        <div class="tl-item">
          <div class="row-title">${UI.esc(t.text)}</div>
          <div class="tiny t3" style="margin-top:2px">${t.date} 2026</div>
        </div>`).join('')}</div>`,
    });
  }

  if (name === 'Tasks') {
    const ts = DB.tasks.filter(t => t.clientId === c.id);
    return UI.card({
      title: 'Tasks', icon: 'tasks',
      body: ts.length ? ts.map(t => UI.taskRow(t)).join('') : UI.empty('tasks', 'No tasks', 'Tasks linked to this client show up here.', 'Add task'),
    });
  }

  if (name === 'Notes') {
    return UI.card({
      title: 'Notes', icon: 'note',
      body: `<div class="quick-add" style="margin-bottom:14px">${icon('plus')}<input data-client-note placeholder="Add a note about ${UI.esc(c.name)}… (Enter to save)"></div>`
        + (c.notes.length ? c.notes.map((n, ni) => `<div class="note-chip" style="position:relative">
            <button class="row-del" data-del-cnote="${ni}" style="position:absolute;top:7px;right:7px">${icon('x')}</button>
            <div style="padding-right:26px">${UI.esc(n)}</div></div>`).join('')
          : UI.empty('note', 'No notes yet', 'Capture context that matters.')),
    });
  }
  return '';
}

function stamp(at) {
  return new Date(at || Date.now()).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const SMS_URL = 'https://aiman-business-os.netlify.app/.netlify/functions/sms';

/* 04xx xxx xxx → +614xxxxxxxx (Twilio wants E.164) */
function toE164AU(phone) {
  const d = String(phone || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+')) return d;
  if (d.startsWith('04')) return '+61' + d.slice(1);
  if (d.startsWith('61')) return '+' + d;
  return d ? '+61' + d.replace(/^0/, '') : '';
}
const phoneTail = p => String(p || '').replace(/\D/g, '').slice(-9);
const phoneMatches = (a, b) => phoneTail(a) && phoneTail(a) === phoneTail(b);

function logComm(c, dir, channel, text, extra = {}) {
  if (!c.comms) c.comms = [];
  c.comms.push({ id: uid('m'), dir, channel, text, time: stamp(extra.at), at: extra.at || Date.now(), sid: extra.sid || null });
  c.comms.sort((a, b) => (a.at || 0) - (b.at || 0));
  saveDB();
  const body = document.querySelector('#client-tab-body');
  if (body) { body.innerHTML = clientTabBody(c, CLIENT_TABS.indexOf('Messages')); wireClientTab(c); wireMessagesTab(c); }
}

/* pull the Twilio inbox and fold this client's replies into the thread */
async function pullInbox(c, quiet) {
  if (typeof leadsKey !== 'function' || !leadsKey()) return;
  if (!c.phone || c.phone === '—') return;
  try {
    const r = await fetch(SMS_URL + '?inbox=1&key=' + encodeURIComponent(leadsKey()));
    if (r.status === 501) { if (!quiet) UI.toast('In-app texting not connected yet — ask me to set up Twilio'); return; }
    if (!r.ok) return;
    const { messages = [] } = await r.json();
    if (!c.comms) c.comms = [];
    const fresh = messages.filter(m => phoneMatches(m.from, c.phone) && !c.comms.some(x => x.sid === m.sid));
    if (!fresh.length) { if (!quiet) UI.toast('No new replies'); return; }
    fresh.forEach(m => c.comms.push({ id: uid('m'), dir: 'in', channel: 'sms', text: m.body, time: stamp(m.at), at: m.at, sid: m.sid }));
    c.comms.sort((a, b) => (a.at || 0) - (b.at || 0));
    saveDB();
    const body = document.querySelector('#client-tab-body');
    if (body && document.querySelector('[data-msg-input]')) {
      body.innerHTML = clientTabBody(c, CLIENT_TABS.indexOf('Messages'));
      wireClientTab(c); wireMessagesTab(c);
    }
    UI.toast(fresh.length + ' new repl' + (fresh.length === 1 ? 'y' : 'ies') + ' from ' + c.name + ' 📩');
  } catch (e) { /* offline — stay quiet */ }
}

function wireMessagesTab(c) {
  const input = document.querySelector('[data-msg-input]');
  if (!input) return; // not on the Messages tab

  pullInbox(c, true); // check for replies whenever the tab opens

  document.querySelector('[data-msg-refresh]')?.addEventListener('click', () => pullInbox(c, false));

  document.querySelector('[data-msg-text]')?.addEventListener('click', async () => {
    const text = input.value.trim();
    if (!text) { UI.toast('Type a message first'); return; }
    if (!c.phone || c.phone === '—') { UI.toast('No phone saved — add one via Edit'); return; }

    /* try the real thing first: send through the studio's Twilio number */
    if (typeof leadsKey === 'function' && leadsKey()) {
      try {
        const r = await fetch(SMS_URL + '?key=' + encodeURIComponent(leadsKey()), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: toE164AU(c.phone), body: text }),
        });
        if (r.ok) {
          const out = await r.json();
          input.value = '';
          logComm(c, 'out', 'sms', text, { sid: out.sid });
          UI.toast('Text sent from your business number ✅');
          return;
        }
        if (r.status !== 501) { // real error (not just "not set up yet")
          const err = await r.json().catch(() => ({}));
          UI.toast('Send failed: ' + (err.error || r.status));
          return;
        }
      } catch (e) { /* network hiccup → fall through to the phone app */ }
    }

    /* fallback: open the phone's messaging app pre-filled */
    location.href = 'sms:' + c.phone.replace(/\s/g, '') + '?&body=' + encodeURIComponent(text);
    logComm(c, 'out', 'sms', text);
    UI.toast('Opening Messages — copy saved here');
  });

  document.querySelector('[data-msg-email]')?.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) { UI.toast('Type a message first'); return; }
    if (!c.email || c.email === '—') { UI.toast('No email saved — add one via Edit'); return; }
    location.href = 'mailto:' + c.email + '?subject=' + encodeURIComponent('A note from Groundwork Labs') + '&body=' + encodeURIComponent(text);
    logComm(c, 'out', 'email', text);
    UI.toast('Opening email — copy saved here');
  });

  document.querySelector('[data-msg-logreply]')?.addEventListener('click', () => {
    UI.modal({
      title: 'Log a reply you received',
      submitLabel: 'Save to conversation',
      fields: [
        { name: 'channel', label: 'How did it come in?', type: 'select', options: ['Text', 'Email'], value: 'Text' },
        { name: 'text', label: 'What they said', type: 'textarea', full: true, required: true },
      ],
      onSubmit(v) {
        if (!v.text.trim()) return;
        logComm(c, 'in', v.channel === 'Email' ? 'email' : 'sms', v.text.trim());
        UI.toast('Reply logged');
      },
    });
  });
}

function wireClientTab(c) {
  const noteInput = document.querySelector('[data-client-note]');
  noteInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && noteInput.value.trim()) {
      c.notes.unshift(noteInput.value.trim());
      saveDB();
      document.querySelector('#client-tab-body').innerHTML = clientTabBody(c, CLIENT_TABS.indexOf('Notes'));
      wireClientTab(c);
      UI.toast('Note saved');
    }
  });
  document.querySelectorAll('[data-del-cnote]').forEach(b =>
    b.addEventListener('click', () => {
      c.notes.splice(+b.dataset.delCnote, 1);
      saveDB();
      document.querySelector('#client-tab-body').innerHTML = clientTabBody(c, CLIENT_TABS.indexOf('Notes'));
      wireClientTab(c);
    }));
}

Pages._mount.clients = (id) => {
  if (!id) {
    document.querySelector('[data-new-client]')?.addEventListener('click', () => Create.client());
    return;
  }
  const c = clientById(id);
  if (!c) return;
  wireTabs(document.querySelector('.page'), tab => {
    document.querySelector('#client-tab-body').innerHTML = clientTabBody(c, tab);
    wireClientTab(c);
    wireMessagesTab(c);
  });
  wireClientTab(c);
  wireMessagesTab(c);
  document.querySelector('[data-edit-client]')?.addEventListener('click', () => Create.editClient(c));
  document.querySelector('[data-email-client]')?.addEventListener('click', () => {
    if (c.email && c.email !== '—') location.href = 'mailto:' + c.email;
    else UI.toast('No email saved for this client');
  });
  document.querySelector('[data-new-project-for]')?.addEventListener('click', () => Create.project());
  document.querySelector('[data-del-client]')?.addEventListener('click', () => {
    if (!confirm(`Delete "${c.name}"? Their projects and tasks stay but lose the link.`)) return;
    DB.projects.forEach(p => { if (p.clientId === c.id) p.clientId = null; });
    DB.tasks.forEach(t => { if (t.clientId === c.id) t.clientId = null; });
    DB.clients = DB.clients.filter(x => x.id !== c.id);
    saveDB();
    location.hash = '#/clients';
    UI.toast('Client deleted');
  });
};
