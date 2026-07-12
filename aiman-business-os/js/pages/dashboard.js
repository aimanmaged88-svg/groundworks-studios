/* ============================================================
   Dashboard — answers: what needs attention, what earns money,
   what's overdue, what am I building, what's next.
   ============================================================ */

/* Quick Links — every live site in one place, copy or share in one tap.
   To add a link, drop another { name, url } into the right group. */
const QUICK_LINKS = [
  { group: 'Studio / Business', items: [
    { name: 'Flow Forward OS', url: 'https://flow-forward-os.netlify.app' },
    { name: 'Business Studio OS', url: 'https://aiman-business-os.netlify.app' },
    { name: 'Studio Analytics', url: 'https://aiman-studio-analytics.netlify.app' },
    { name: 'Groundwork Labs — Client Site', url: 'https://groundwork-labs.netlify.app' },
    { name: 'Life HQ', url: 'https://life-hq-aiman.netlify.app' },
  ] },
  { group: 'Sports & Coaching', items: [
    { name: 'Lockdown Lab', url: 'https://lockdown-lab.netlify.app' },
    { name: 'Love of the Game', url: 'https://love-of-the-game-lotg.netlify.app' },
  ] },
  { group: 'Client Demos', items: [
    { name: 'Apex MMA', url: 'https://apexmma-demo-2026.netlify.app' },
    { name: 'Trained by Zee', url: 'https://trainedbyzee-demo-2026.netlify.app' },
    { name: 'Eagles Gym', url: 'https://eaglesgym-demo-2026.netlify.app' },
  ] },
  { group: 'Voice Apps', items: [
    { name: "Asiya's Voice", url: 'https://asiyas-voice.netlify.app' },
    { name: 'Your Voice', url: 'https://your-voice-app.netlify.app' },
  ] },
  { group: 'Work — Borealis', items: [
    { name: 'Borealis SIL OS', url: 'https://borealissil.netlify.app' },
  ] },
];

function quickLinksCard() {
  const rows = QUICK_LINKS.map(g => `
    <div class="ql-group-label">${g.group}</div>
    ${g.items.map(l => `
      <div class="ql-row">
        <a class="ql-open" href="${l.url}" target="_blank" rel="noopener" title="Open ${UI.esc(l.name)}">
          <span class="ql-fav">${icon('globe')}</span>
          <span class="ql-main">
            <span class="ql-name">${UI.esc(l.name)}</span>
            <span class="ql-url">${UI.esc(l.url.replace('https://', ''))}</span>
          </span>
        </a>
        <div class="ql-actions">
          <button class="icon-btn" data-ql-copy="${UI.esc(l.url)}" title="Copy link">${icon('copy')}</button>
          <button class="icon-btn" data-ql-share="${UI.esc(l.url)}" data-ql-name="${UI.esc(l.name)}" title="Share">${icon('share')}</button>
        </div>
      </div>`).join('')}`).join('');
  return `<div class="span-12">${UI.card({
    title: 'Quick Links', icon: 'link',
    body: `<div class="ql-list">${rows}</div>`,
  })}</div>`;
}

/* Lead Engine strip — today's hunt + pipeline pulse, one tap into the Lead Finder.
   (leadMission/STAGES come from prospects.js — loaded before render.) */
function leadEngineCard() {
  const P = DB.prospects || [];
  const m = leadMission();
  const t = new Date().toISOString().slice(0, 10);
  const due = P.filter(p => p.next && p.next <= t && !['Won', 'Not now'].includes(p.stage)).length;
  const inPlay = P.filter(p => ['Contacted', 'In talks', 'Demo sent'].includes(p.stage)).length;
  const won = P.filter(p => p.stage === 'Won').length;
  const pct = Math.min(100, Math.round(m.addedToday / m.target * 100));
  return `<div class="span-12"><div class="card mission-card">
    <div class="spread" style="flex-wrap:wrap;gap:12px">
      <div class="flex" style="gap:14px;min-width:0">
        <span class="mission-ico">${icon('zap')}</span>
        <div class="stack" style="gap:3px;min-width:0">
          <span class="tiny t3" style="text-transform:uppercase;letter-spacing:.07em;font-weight:600">Today's hunt · Lead Engine</span>
          <b style="font-size:16px">Find ${m.target} ${m.niche.toLowerCase()} ${m.angle}</b>
          <span class="small t2">${due ? `<b style="color:var(--warn)">${due} follow-up${due === 1 ? '' : 's'} due</b> · ` : ''}${inPlay} in play · ${won} won</span>
        </div>
      </div>
      <div class="flex" style="gap:14px;flex-shrink:0">
        <div class="stack" style="gap:5px;min-width:120px">
          <span class="small t2 mono-num" style="text-align:right">${m.addedToday} / ${m.target} leads today</span>
          ${UI.progress(pct, m.addedToday >= m.target ? 'good' : '')}
        </div>
        <a class="btn primary" href="#/prospects">${icon('target')}Start hunting</a>
      </div>
    </div>
  </div></div>`;
}

/* Brand-tinted share targets. Native "device share" is added at runtime when supported. */
const SHARE_TARGETS = [
  { key: 'whatsapp', label: 'WhatsApp', bg: '#25D366', glyph: icon('phone'), href: (u, n) => `https://wa.me/?text=${encodeURIComponent(n + ' — ' + u)}` },
  { key: 'facebook', label: 'Facebook', bg: '#1877F2', glyph: '<span class="ql-glyph-txt">f</span>', href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { key: 'x', label: 'X', bg: '#000000', glyph: '<span class="ql-glyph-txt">𝕏</span>', href: (u, n) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(n)}` },
  { key: 'linkedin', label: 'LinkedIn', bg: '#0A66C2', glyph: '<span class="ql-glyph-txt" style="font-size:13px">in</span>', href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { key: 'telegram', label: 'Telegram', bg: '#229ED9', glyph: icon('send'), href: (u, n) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(n)}` },
  { key: 'email', label: 'Email', bg: 'var(--border-strong)', glyph: icon('mail'), href: (u, n) => `mailto:?subject=${encodeURIComponent(n)}&body=${encodeURIComponent(u)}` },
  { key: 'sms', label: 'Message', bg: 'var(--border-strong)', glyph: icon('message'), href: (u, n) => `sms:?&body=${encodeURIComponent(n + ' — ' + u)}` },
];

function openShareSheet(url, name) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.style.placeItems = 'start center';

  const nativeTile = navigator.share
    ? `<button class="ql-share-tile" data-native="1">
         <span class="ql-share-ico" style="background:var(--accent);color:#14120F">${icon('share')}</span>
         <span class="ql-share-lbl">Device share…</span>
       </button>`
    : '';

  const tiles = SHARE_TARGETS.map(t => `
    <a class="ql-share-tile" href="${t.href(url, name)}" target="_blank" rel="noopener" data-close>
      <span class="ql-share-ico" style="background:${t.bg}">${t.glyph}</span>
      <span class="ql-share-lbl">${t.label}</span>
    </a>`).join('');

  ov.innerHTML = `<div class="palette ql-share">
    <div class="ql-share-head">
      <div>
        <b>Share link</b>
        <div class="small t3">${UI.esc(name)}</div>
      </div>
      <button type="button" class="icon-btn" data-close>${icon('x')}</button>
    </div>
    <div class="ql-share-grid">${nativeTile}${tiles}</div>
    <button type="button" class="btn ql-share-copy" data-copy>${icon('copy')}Copy link</button>
  </div>`;

  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
  ov.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  ov.querySelector('[data-copy]')?.addEventListener('click', () => { copyLink(url); close(); });
  ov.querySelector('[data-native]')?.addEventListener('click', async () => {
    try { await navigator.share({ title: name, url }); } catch (_) {}
    close();
  });
}

function copyLink(url) {
  const done = () => UI.toast('Link copied');
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done));
  } else {
    fallbackCopy(url, done);
  }
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch (_) { UI.toast('Copy failed — long-press the link'); }
  ta.remove();
}

function buildBriefing(greet) {
  const meetings = DB.events.filter(e => e.day === TODAY_DAY && e.type === 'meeting');
  const overdue = DB.invoices.filter(i => i.status === 'Overdue');
  const dueToday = DB.tasks.filter(t => !t.done && t.due === 'Today');
  const highP = DB.tasks.filter(t => !t.done && t.priority === 'High');
  const active = DB.projects.filter(p => !['Completed', 'Ideas'].includes(p.stage));
  const ready = DB.projects.filter(p => ['Ready', 'Review'].includes(p.stage));
  const content = DB.content.calendar.filter(c => c.day === TODAY_DAY && c.status !== 'published');
  const lines = [];
  lines.push(`You have <b>${active.length} active project${active.length === 1 ? '' : 's'}</b>${ready.length ? ` and ${ready.length === 1 ? 'one is' : ready.length + ' are'} nearly out the door — <b>${ready.map(p => p.name.split('—')[0].trim()).join('</b> and <b>')}</b>` : ''}.`);
  lines.push(overdue.length
    ? `<b>${overdue.length} invoice${overdue.length === 1 ? ' is' : 's are'} overdue</b> (${fmt$(overdue.reduce((a, i) => a + +i.amount, 0))}) — worth chasing today.`
    : `No invoices are overdue — cash flow is clean.`);
  lines.push(meetings.length
    ? `You have <b>${meetings.length} meeting${meetings.length === 1 ? '' : 's'} today</b>: ${meetings.map(m => `${m.title.split('—')[0].trim()} at ${m.time}`).join(', ')}.`
    : `No meetings today — a clear runway for deep work.`);
  if (dueToday.length) lines.push(`<b>${dueToday.length} task${dueToday.length === 1 ? '' : 's'} due today</b>, starting with “${dueToday[0].title}”.`);
  else if (highP.length) lines.push(`Nothing due today, but <b>${highP.length} high-priority task${highP.length === 1 ? '' : 's'}</b> ${highP.length === 1 ? 'is' : 'are'} waiting.`);
  if (content.length) lines.push(`And remember today's content: <b>${content[0].title}</b> is ${content[0].status === 'draft' ? 'drafted and ready to publish' : 'planned — needs a draft'}.`);
  return lines;
}

Pages.dashboard = () => {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const f = DB.finance;
  const focusTasks = DB.tasks.filter(t => !t.done && (t.due === 'Today' || t.priority === 'High')).slice(0, 5);
  const activeProjects = DB.projects.filter(p => !['Completed', 'Ideas'].includes(p.stage)).slice(0, 5);
  const openInvoices = DB.invoices.filter(i => ['Sent', 'Overdue', 'Draft'].includes(i.status));
  const outstanding = openInvoices.reduce((a, i) => a + (+i.amount || 0), 0);
  const overdueCount = DB.invoices.filter(i => i.status === 'Overdue').length;
  const todayEvents = DB.events.filter(e => e.day === TODAY_DAY);
  const briefingLines = buildBriefing(greet);
  const monthTarget = 10000;
  const monthPct = Math.min(100, Math.round(f.revenueMTD / monthTarget * 100));

  return `
    <div class="greeting-block spread" style="align-items:flex-start;flex-wrap:wrap;gap:12px">
      <div>
        <div class="greeting">${greet}, ${DB.user.name} 👋</div>
        <div class="greeting-date">Here's how ${DB.user.business} is tracking · ${today}</div>
      </div>
      <div class="flex" style="gap:8px">
        <a class="btn" href="#/prospects">${icon('plus')}Add lead</a>
        <a class="btn" href="#/tasks">${icon('plus')}Task</a>
        <button class="btn primary">${icon('zap')}Start focus session</button>
      </div>
    </div>

    <div class="stat-row">
      ${statTile('Revenue this month', fmt$(f.revenueMTD), `▲ ${f.revenueDelta}% vs June — keep pushing`, 'good', f.income, '#/finance', 'v-green', 'finance')}
      ${statTile('Awaiting payment', fmt$(outstanding), overdueCount ? `${overdueCount} overdue — worth chasing today` : `${openInvoices.length} open, none overdue`, 'warn', [4, 6, 5, 7, 6, 8, 6], '#/finance', 'v-amber', 'receipt')}
      ${statTile('Active projects', String(DB.projects.filter(p => !['Completed', 'Ideas'].includes(p.stage)).length), `${DB.projects.filter(p => ['Ready', 'Review'].includes(p.stage)).length ? DB.projects.filter(p => ['Ready', 'Review'].includes(p.stage)).length + ' nearly out the door' : 'all in build mode'}`, '', [2, 3, 3, 4, 4, 5, 5], '#/projects', 'v-indigo', 'projects')}
      ${statTile('Open tasks', String(DB.tasks.filter(t => !t.done).length), `${DB.tasks.filter(t => !t.done && t.due === 'Today').length ? DB.tasks.filter(t => !t.done && t.due === 'Today').length + ' need doing today' : 'nothing due today'}`, '', [5, 7, 6, 8, 5.5], '#/tasks', 'v-blue', 'tasks')}
    </div>

    <div class="dash-grid">

      <!-- Lead Engine: today's hunt -->
      ${leadEngineCard()}

      <!-- AI Daily Briefing -->
      <div class="span-8">${UI.card({
        title: 'AI Daily Briefing', icon: 'ai', link: 'Open AI Hub', linkHref: '#/aihub',
        cls: 'briefing',
        body: `<span class="brief-hello">${greet}. Here's the shape of your day.</span>
          <div class="brief-text">${briefingLines.map(l => `<p style="margin-bottom:9px">${l}</p>`).join('')}</div>`,
      })}</div>

      <!-- Today's focus -->
      <div class="span-4">${UI.card({
        title: "Today's Focus", icon: 'target', link: 'All tasks', linkHref: '#/tasks',
        body: focusTasks.length ? focusTasks.map(t => {
          const col = t.priority === 'High' ? 'var(--bad)' : t.priority === 'Medium' ? 'var(--warn)' : 'var(--border-strong)';
          return `<div class="row focus-item">
            <span class="fp" style="background:${col}"></span>
            <button class="check ${t.done ? 'done' : ''}" data-check="${t.id}">${icon('check')}</button>
            <div class="row-main"><div class="row-title">${UI.esc(t.title)}</div>
            <div class="row-sub">${UI.esc(t.due)} · ${UI.esc(t.priority)} priority</div></div>
          </div>`;
        }).join('') : UI.empty('check', 'All clear', 'Nothing urgent on your plate today.'),
      })}</div>

      <!-- Daily coaching -->
      ${Coach.card()}

      <!-- Revenue chart -->
      <div class="span-8">${UI.card({
        title: 'Revenue', icon: 'trendUp', link: 'Finance', linkHref: '#/finance',
        body: `<div class="spread" style="margin-bottom:14px">
            <div><div class="chart-head-val">${fmt$(f.profitYTD)}</div><div class="small t3">Net profit, year to date</div></div>
            ${Charts.legend([{ color: 'var(--series-1)', label: 'Monthly revenue' }])}
          </div>
          ${Charts.bars(f.months, f.income, { format: fmt$ })}`,
      })}</div>

      <!-- Calendar today -->
      <div class="span-4">${UI.card({
        title: 'Today', icon: 'calendar', link: 'Calendar', linkHref: '#/calendar',
        body: (todayEvents.length ? todayEvents.map(e => `
          <div class="row">
            <span class="badge ${e.type === 'meeting' ? 'info' : e.type === 'content' ? 'gold' : e.type === 'deadline' ? 'bad' : ''}" style="min-width:64px;justify-content:center">${e.time || 'All day'}</span>
            <div class="row-main"><div class="row-title">${UI.esc(e.title)}</div>
            <div class="row-sub" style="text-transform:capitalize">${e.type}</div></div>
          </div>`).join('') : UI.empty('calendar', 'Free day', 'No events scheduled for today.'))
          + `<hr class="divider"><div class="spread"><span class="small t3">Tomorrow</span><span class="small t2">Crown Fencing sign-off due</span></div>`,
      })}</div>

      <!-- Current projects -->
      <div class="span-7">${UI.card({
        title: 'Current Projects', icon: 'projects', link: 'Board', linkHref: '#/projects',
        body: activeProjects.map(p => {
          const c = p.clientId ? clientById(p.clientId) : null;
          return `<a class="row clickable" href="#/projects/${p.id}">
            ${UI.avatar(c ? c.initials : 'ST', 'a32', !c)}
            <div class="row-main">
              <div class="row-title">${UI.esc(p.name)}</div>
              <div class="row-sub">${c ? UI.esc(c.name) : 'Internal'} · due ${p.due}</div>
            </div>
            ${UI.statusBadge(p.stage)}
            <div style="width:110px">${UI.progress(p.progress)}</div>
            <span class="small t3 mono-num" style="width:34px;text-align:right">${p.progress}%</span>
          </a>`;
        }).join(''),
      })}</div>

      <!-- Business health -->
      <div class="span-5">${UI.card({
        title: 'Business Health', icon: 'shield',
        body: `<div class="flex" style="gap:20px;margin-bottom:8px">
            ${Charts.ring(81, { size: 92 })}
            <div class="stack" style="gap:2px">
              <b style="font-size:15px">Strong shape</b>
              <span class="small t2" style="line-height:1.5">Delivery pace is excellent. Watch the pipeline — book two discovery calls this month to stay ahead.</span>
            </div>
          </div>
          ${DB.health.map(h => `
            <div class="health-row">
              <span class="hlabel">${h.label}</span>
              ${UI.progress(h.value, h.value >= 80 ? 'good' : '')}
              <span class="hval">${h.value}</span>
            </div>`).join('')}`,
      })}</div>

      <!-- Invoices -->
      <div class="span-7">${UI.card({
        title: 'Invoices', icon: 'receipt', link: 'All invoices', linkHref: '#/finance',
        body: UI.table(['Invoice', 'Client', 'Status', 'Due', 'Amount'],
          openInvoices.map(i => [
            `<span class="strong">${i.id}</span>`, UI.esc(i.client),
            UI.statusBadge(i.status), i.due,
            `<span class="strong num">${fmt$(i.amount)}</span>`,
          ])),
      })}</div>

      <!-- Weekly goals + monthly progress -->
      <div class="span-5">${UI.card({
        title: 'Weekly Goals', icon: 'flag',
        body: DB.weeklyGoals.map((g, gi) => `
          <div class="goal-row">
            <button class="check ${g.done ? 'done' : ''}" data-goal="${gi}" style="margin-top:1px">${icon('check')}</button>
            <div class="row-main">
              <div class="row-title" style="${g.done ? 'text-decoration:line-through;color:var(--text-3)' : ''}">${UI.esc(g.text)}</div>
              <div class="row-sub">${g.tied}</div>
            </div>
          </div>`).join('')
          + `<hr class="divider">
          <div class="spread" style="margin-bottom:8px">
            <span class="card-title">${icon('target')}Monthly target</span>
            <span class="small t2 mono-num">${fmt$(f.revenueMTD)} / ${fmt$(monthTarget)}</span>
          </div>
          ${UI.progress(monthPct)}
          <div class="small t3" style="margin-top:8px">${monthPct}% of July's revenue goal — ${fmt$(monthTarget - f.revenueMTD)} to go with Kahil launch pending.</div>`,
      })}</div>

      <!-- Recent activity -->
      <div class="span-4">${UI.card({
        title: 'Recent Activity', icon: 'clock',
        body: DB.activity.slice(0, 5).map(a => `
          <div class="activity-item">
            <span class="act-icon">${icon(a.icon)}</span>
            <div class="row-main">
              <div class="small" style="color:var(--text-2);line-height:1.5">${a.text}</div>
              <div class="tiny t3" style="margin-top:2px">${a.time}</div>
            </div>
          </div>`).join(''),
      })}</div>

      <!-- Quick notes -->
      <div class="span-4">${UI.card({
        title: 'Quick Notes', icon: 'note', link: 'AI Hub', linkHref: '#/aihub',
        body: `<div class="quick-add" style="margin-bottom:12px">${icon('plus')}<input id="qn-input" placeholder="Capture a thought…"></div>`
          + DB.quickNotes.map((n, ni) => `<div class="note-chip" style="position:relative">
              <button class="row-del" data-del-note="${ni}" style="position:absolute;top:7px;right:7px">${icon('x')}</button>
              <div style="padding-right:26px">${UI.esc(n.text)}</div><div class="tiny t3">${n.time}</div></div>`).join(''),
      })}</div>

      <!-- Latest conversations -->
      <div class="span-4">${UI.card({
        title: 'Latest Conversations', icon: 'message', link: 'AI Hub', linkHref: '#/aihub',
        body: DB.conversations.map(c => `
          <div class="row">
            ${UI.avatar(c.initials, 'a32', c.kind !== 'client')}
            <div class="row-main">
              <div class="row-title">${UI.esc(c.who)}</div>
              <div class="row-sub">${UI.esc(c.text)}</div>
            </div>
            <span class="tiny t3" style="white-space:nowrap">${c.time}</span>
          </div>`).join(''),
      })}</div>

      <!-- Quick Links: every live site, copy & share -->
      ${quickLinksCard()}

    </div>`;
};

function statTile(label, value, delta, deltaCls, series, href, hue, ic) {
  const deltaColor = deltaCls === 'good' ? 'var(--good)' : deltaCls === 'warn' ? 'var(--warn)' : 'var(--text-3)';
  const arrow = deltaCls === 'good' ? icon('arrowUp') : deltaCls === 'warn' ? icon('clock') : icon('trendUp');
  const hueVar = hue ? `var(--${hue})` : 'var(--accent)';
  const inner = `
    <div class="stat-top">
      ${ic ? `<span class="stat-ico">${icon(ic)}</span>` : ''}
      <span class="stat-go">${icon('arrowUpRight')}</span>
    </div>
    <div class="stat-label"><span class="label">${label}</span></div>
    <div class="stat-value">${value}</div>
    <div class="stat-delta" style="color:${deltaColor}">${arrow}${delta}</div>
    ${Charts.sparkline(series, { color: hueVar })}`;
  const style = `style="--hue:${hueVar}"`;
  return href
    ? `<a class="card stat-tile" ${style} href="${href}">${inner}</a>`
    : `<div class="card stat-tile" ${style}>${inner}</div>`;
}

Pages._mount.dashboard = () => {
  Coach.wire();
  const qn = document.querySelector('#qn-input');
  qn?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && qn.value.trim()) {
      DB.quickNotes.unshift({ text: qn.value.trim(), time: 'Just now' });
      saveDB();
      App.refresh();
      UI.toast('Note captured');
    }
  });
  document.querySelectorAll('[data-del-note]').forEach(b =>
    b.addEventListener('click', () => {
      DB.quickNotes.splice(+b.dataset.delNote, 1);
      saveDB(); App.refresh(); UI.toast('Note deleted');
    }));
  document.querySelectorAll('[data-goal]').forEach(b =>
    b.addEventListener('click', () => {
      const g = DB.weeklyGoals[+b.dataset.goal];
      g.done = !g.done;
      saveDB(); App.refresh();
    }));
  document.querySelectorAll('[data-ql-copy]').forEach(b =>
    b.addEventListener('click', () => copyLink(b.dataset.qlCopy)));
  document.querySelectorAll('[data-ql-share]').forEach(b =>
    b.addEventListener('click', () => openShareSheet(b.dataset.qlShare, b.dataset.qlName)));
};
