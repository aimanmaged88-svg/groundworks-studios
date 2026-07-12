/* ============================================================
   Enquiries — live project briefs from groundwork-labs.netlify.app
   Pulled through a serverless function; the access key is entered
   once and remembered in this browser.
   ============================================================ */

const LEADS_URL = 'https://aiman-business-os.netlify.app/.netlify/functions/leads';
const FEEDBACK_URL = 'https://groundwork-labs.netlify.app/feedback.html';
const BOOKING_URL = 'https://cal.com/aiman-m-clwrda/15min';

const leadsKey = () => { try { return localStorage.getItem('bsos-leads-key') || ''; } catch (e) { return ''; } };

let enqTab = 0; // 0 = project briefs, 1 = feedback

Pages.enquiries = () => {
  return pageHead('Enquiries', 'Project briefs and client feedback from groundwork-labs.netlify.app',
    `<a class="btn" href="https://groundwork-labs.netlify.app" target="_blank" rel="noopener">${icon('globe')}Open site</a>
     <button class="btn primary" data-leads-refresh>${icon('refresh')}Refresh</button>`)
    + `<div style="margin-bottom:16px">${UI.seg(['Project briefs', 'Feedback & testimonials'], enqTab)}</div>`
    + `<div id="leads-body">${leadsKey() ? loadingLeads() : keySetup()}</div>`;
};

/* ---- feedback email templates (the journey touchpoints) ---- */
const FB_TEMPLATES = [
  {
    id: 'signup', label: 'Sign-up welcome', icon: 'star',
    subject: 'Welcome to Groundwork Labs 🤝',
    body: `Hey [name],\n\nWelcome aboard — genuinely glad to have you.\n\nFirst step: grab a free 15-minute call with me whenever suits you:\n${BOOKING_URL}\n\nOne thing you should know about how we work: you're part of the build, not just a client. Any time you have feedback or an idea, drop it here (takes 2 minutes):\n${FEEDBACK_URL}\n\nAnd it's worth your while — the best improvement idea each month gets $50 off.\n\nI'm always going to be there for you, and I'll do my best.\n\nAiman\nGroundwork Labs — "Service the community while we service your business"`,
  },
  {
    id: 'week1', label: 'Week-one check-in', icon: 'clock',
    subject: 'Week one — how did we go?',
    body: `Hey [name],\n\nWe're a week in — how did we go? Anything confusing, anything you'd change, anything you love?\n\nTwo minutes, straight talk, here:\n${FEEDBACK_URL}\n\nYour feedback literally shapes what we build next — and the best improvement idea each month takes $50 off.\n\nThanks for building this with us.\n\nAiman\nGroundwork Labs`,
  },
  {
    id: 'delivered', label: 'Project delivered', icon: 'check',
    subject: 'It\'s live! One small favour…',
    body: `Hey [name],\n\nYour project is live — congratulations! 🎉\n\nIf you're happy with how it went, would you leave a few honest words here? With your permission, they'd go on our website as a testimonial (real words only — we don't do fake reviews):\n${FEEDBACK_URL}\n\nAnd if anything could've been better, tell us that too — best improvement idea each month gets $50 off.\n\nThank you for trusting us with it.\n\nAiman\nGroundwork Labs`,
  },
];

function keySetup() {
  return UI.card({
    title: 'Connect your enquiry feed', icon: 'key',
    body: `<p class="small t2" style="line-height:1.7;max-width:520px">Enter your access key once and every brief customers submit on the website will appear here automatically. The key just protects your customers' contact details from strangers.</p>
      <div class="flex" style="margin-top:16px;max-width:420px">
        <input class="input" id="leads-key-input" placeholder="Access key…" autocomplete="off">
        <button class="btn primary" id="leads-key-save">${icon('check')}Connect</button>
      </div>`,
  });
}

function loadingLeads() {
  return UI.card({ title: 'Enquiries', icon: 'mail', body: `<div class="empty"><div class="empty-icon">${icon('refresh')}</div><b>Checking for new briefs…</b><p>Talking to the website now.</p></div>` });
}

async function fetchLeads() {
  const bodyEl = document.querySelector('#leads-body');
  if (!bodyEl) return;
  bodyEl.innerHTML = loadingLeads();
  try {
    const form = enqTab === 1 ? 'feedback' : 'project-brief';
    const r = await fetch(LEADS_URL + '?form=' + form + '&key=' + encodeURIComponent(leadsKey()));
    if (r.status === 401) {
      try { localStorage.removeItem('bsos-leads-key'); } catch (e) {}
      bodyEl.innerHTML = UI.card({
        title: 'Wrong key', icon: 'key',
        body: `<div class="empty"><div class="empty-icon">${icon('key')}</div><b>That key didn't unlock the feed</b><p>Double-check it and try again.</p></div>` + keySetup(),
      });
      wireLeadKey();
      return;
    }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const leads = await r.json();
    if (enqTab === 1) renderFeedback(leads);
    else renderLeads(leads);
  } catch (e) {
    bodyEl.innerHTML = UI.card({
      title: 'Connection issue', icon: 'bell',
      body: `<div class="empty"><div class="empty-icon">${icon('bell')}</div><b>Couldn't reach the enquiry feed</b><p>Check your internet and hit Refresh. Your briefs are safe — they're also in your Gmail.</p></div>`,
    });
  }
}

function renderLeads(leads) {
  const bodyEl = document.querySelector('#leads-body');
  DB.handledLeads = DB.handledLeads || [];
  const isTest = l => /test/i.test(l.name);
  const real = leads.filter(l => !isTest(l));
  const shown = real.length ? real : leads;

  if (!shown.length) {
    bodyEl.innerHTML = UI.card({
      title: 'Enquiries', icon: 'mail',
      body: UI.empty('mail', 'No enquiries yet', 'When a customer finishes the Architect chat on your website, their brief lands here (and in your Gmail).'),
    });
    return;
  }

  bodyEl.innerHTML = `<div class="grid" style="grid-template-columns:1fr 1fr">` + shown.map(l => {
    const added = DB.handledLeads.includes(l.id);
    const date = new Date(l.created).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const phone = ((l.contact || '').match(/(?:\+?61|0)[\d\s()-]{7,}/) || [''])[0].replace(/[\s()-]/g, '');
    return `<div class="card">
      <div class="spread" style="margin-bottom:10px">
        <div class="flex">${UI.avatar((l.name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(), 'a40', true)}
          <div class="stack" style="gap:1px"><b style="font-size:14.5px">${UI.esc(l.name)}</b><span class="tiny t3">${date}</span></div>
        </div>
        ${added ? '<span class="badge good"><span class="bdot"></span>Added</span>' : '<span class="badge gold"><span class="bdot"></span>New</span>'}
      </div>
      <div class="flex" style="flex-wrap:wrap;gap:6px;margin-bottom:12px">
        <span class="badge info">${UI.esc(l.project)}</span>
        <span class="badge">${UI.esc(l.business)}</span>
        <span class="badge warn">${UI.esc(l.timeline)}</span>
        <span class="badge gold">${UI.esc(l.budget)}</span>
      </div>
      <div class="info-list">
        <div class="il-row">${icon('target')}<span>Goal</span><b>${UI.esc(l.goal)}</b></div>
        <div class="il-row">${icon('tasks')}<span>Needs</span><b>${UI.esc(l.features)}</b></div>
        <div class="il-row">${icon('content')}<span>Vibe</span><b>${UI.esc(l.vibe)}</b></div>
        <div class="il-row">${icon('mail')}<span>Contact</span><b>${UI.esc(l.contact)}</b></div>
      </div>
      <div class="flex" style="margin-top:14px;flex-wrap:wrap">
        ${added ? '' : `<button class="btn primary sm" data-lead-add="${UI.esc(l.id)}">${icon('plus')}Add as client</button>`}
        ${phone ? `<a class="btn sm" href="sms:${UI.esc(phone)}?&body=${encodeURIComponent(`Hey ${(l.name || '').split(/\s+/)[0]}, Aiman from Groundwork Labs here — got your application 🤝 When suits a quick chat?`)}">${icon('message')}SMS</a>` : ''}
        ${phone ? `<a class="btn sm" href="tel:${UI.esc(phone)}">${icon('phone')}Call</a>` : ''}
        ${/\S+@\S+\.\S+/.test(l.contact) ? `<a class="btn sm" href="mailto:${UI.esc((l.contact.match(/\S+@\S+\.\S+/) || [''])[0])}?subject=${encodeURIComponent('Your project with Groundwork Labs')}">${icon('mail')}Reply</a>` : ''}
      </div>
    </div>`;
  }).join('') + `</div>`
  + (real.length === 0 ? `<div class="tiny t3" style="margin-top:12px">Only test submissions so far — real customer briefs will replace this view.</div>` : '');

  // wire add-as-client
  bodyEl.querySelectorAll('[data-lead-add]').forEach(b =>
    b.addEventListener('click', () => {
      const l = shown.find(x => x.id === b.dataset.leadAdd);
      if (!l) return;
      const initials = (l.name || 'CL').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const email = (l.contact.match(/\S+@\S+\.\S+/) || [''])[0];
      const phone = (l.contact.match(/[\d\s+()-]{8,}/) || [''])[0].trim();
      DB.clients.push({
        id: uid('c'), name: l.name, contact: l.name, initials,
        industry: l.business, location: '—',
        email: email || '—', phone: phone || (email ? '—' : l.contact), site: '—',
        status: 'Lead', value: 0, projects: 0,
        since: new Date().toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
        summary: `Enquiry via the website: ${l.project} for a ${l.business} business. Goal: ${l.goal}. Wants: ${l.features}. Vibe: ${l.vibe}. Timeline: ${l.timeline}, budget ${l.budget}.`,
        notes: [], timeline: [{ date: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }), text: 'Came in through the Groundwork Architect' }],
      });
      DB.tasks.unshift({
        id: uid('t'), title: `Reply to ${l.name} — new ${l.project.toLowerCase()} enquiry`,
        projectId: null, clientId: DB.clients[DB.clients.length - 1].id,
        priority: 'High', due: 'Today', status: 'Todo', tags: ['lead'], done: false,
      });
      Create.journeyTasks(DB.clients[DB.clients.length - 1]);
      DB.handledLeads.push(l.id);
      saveDB();
      UI.toast(`${l.name} added to Clients + reply task created`);
      fetchLeads();
    }));
}

function renderFeedback(items) {
  const bodyEl = document.querySelector('#leads-body');

  const kit = UI.card({
    title: 'Feedback kit — the journey emails', icon: 'send',
    body: `<p class="small t2" style="line-height:1.65;margin-bottom:14px">Three ready-to-send emails, one per stage of the client journey. <b>Copy</b> puts the full email on your clipboard — swap in their name and send from Gmail. Each one carries the feedback link and the $50 incentive.</p>
      <div class="flex" style="flex-wrap:wrap">
        ${FB_TEMPLATES.map(t => `<button class="btn sm" data-fb-copy="${t.id}">${icon(t.icon)}${t.label}</button>`).join('')}
        <button class="btn sm" data-fb-link>${icon('paperclip')}Copy feedback link</button>
        <button class="btn sm" data-cal-link>${icon('calendar')}Copy booking link</button>
      </div>`,
  });

  const list = items.length
    ? `<div class="grid" style="grid-template-columns:1fr 1fr;margin-top:16px">` + items.map(f => {
        const date = new Date(f.created).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
        const stars = /^(\d)/.exec(f.rating || '') ? '★'.repeat(+f.rating[0]) + '☆'.repeat(5 - +f.rating[0]) : '';
        return `<div class="card">
          <div class="spread" style="margin-bottom:10px">
            <div class="flex">${UI.avatar((f.name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(), 'a40', true)}
              <div class="stack" style="gap:1px"><b style="font-size:14.5px">${UI.esc(f.name)}</b><span class="tiny t3">${UI.esc(f.business)} · ${date}</span></div>
            </div>
            ${f.publishOk ? '<span class="badge good"><span class="bdot"></span>OK to publish</span>' : '<span class="badge"><span class="bdot"></span>Private</span>'}
          </div>
          <div class="flex" style="gap:8px;margin-bottom:10px">
            <span class="badge info">${UI.esc(f.stage)}</span>
            ${stars ? `<span style="color:var(--accent);font-size:14px;letter-spacing:2px">${stars}</span>` : ''}
          </div>
          <div class="info-list">
            <div class="il-row">${icon('check')}<span>Working</span><b style="white-space:normal">${UI.esc(f.working)}</b></div>
            <div class="il-row">${icon('lightbulb')}<span>Improve</span><b style="white-space:normal">${UI.esc(f.improve)}</b></div>
            ${f.contact !== '—' ? `<div class="il-row">${icon('mail')}<span>Contact</span><b>${UI.esc(f.contact)}</b></div>` : ''}
          </div>
          ${f.publishOk && f.working !== '—' ? `<div class="flex" style="margin-top:12px">
            <button class="btn sm" data-fb-quote="${UI.esc(f.id)}">${icon('star')}Copy as testimonial</button>
          </div>` : ''}
        </div>`;
      }).join('') + `</div>`
    : `<div style="margin-top:16px">${UI.card({
        title: 'Responses', icon: 'message',
        body: UI.empty('message', 'No feedback yet', 'Send the sign-up or week-one email to your clients — their answers land here and in your Gmail.'),
      })}</div>`;

  bodyEl.innerHTML = kit + list;

  bodyEl.querySelectorAll('[data-fb-copy]').forEach(b =>
    b.addEventListener('click', () => {
      const t = FB_TEMPLATES.find(x => x.id === b.dataset.fbCopy);
      const text = `Subject: ${t.subject}\n\n${t.body}`;
      (navigator.clipboard?.writeText(text) || Promise.reject()).then(
        () => UI.toast(`"${t.label}" email copied — paste into Gmail`),
        () => UI.toast('Copy blocked by browser'));
    }));
  bodyEl.querySelector('[data-cal-link]')?.addEventListener('click', () => {
    (navigator.clipboard?.writeText(BOOKING_URL) || Promise.reject()).then(
      () => UI.toast('Booking link copied'),
      () => UI.toast('Copy blocked by browser'));
  });
  bodyEl.querySelector('[data-fb-link]')?.addEventListener('click', () => {
    (navigator.clipboard?.writeText(FEEDBACK_URL) || Promise.reject()).then(
      () => UI.toast('Feedback link copied'),
      () => UI.toast('Copy blocked by browser'));
  });
  bodyEl.querySelectorAll('[data-fb-quote]').forEach(b =>
    b.addEventListener('click', () => {
      const f = items.find(x => x.id === b.dataset.fbQuote);
      const quote = `“${f.working}”\n— ${f.name}${f.business !== '—' ? ', ' + f.business : ''}`;
      (navigator.clipboard?.writeText(quote) || Promise.reject()).then(
        () => UI.toast('Testimonial copied — send it to me to add to the website'),
        () => UI.toast('Copy blocked by browser'));
    }));
}

function wireLeadKey() {
  const input = document.querySelector('#leads-key-input');
  const saveBtn = document.querySelector('#leads-key-save');
  const doSave = () => {
    const v = input.value.trim();
    if (!v) return;
    try { localStorage.setItem('bsos-leads-key', v); } catch (e) {}
    window.Sync?.pullNow();   // key also unlocks cross-device sync
    fetchLeads();
  };
  saveBtn?.addEventListener('click', doSave);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') doSave(); });
}

Pages._mount.enquiries = () => {
  document.querySelector('[data-leads-refresh]')?.addEventListener('click', fetchLeads);
  wireSeg(document.querySelector('.page'), i => {
    enqTab = i;
    if (leadsKey()) fetchLeads();
  });
  if (leadsKey()) fetchLeads();
  else wireLeadKey();
};
