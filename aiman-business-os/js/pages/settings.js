/* ============================================================
   Settings — profile, business, brand, appearance, placeholders
   ============================================================ */

const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'business', label: 'Business', icon: 'building' },
  { id: 'sync', label: 'Cross-device sync', icon: 'refresh' },
  { id: 'brand', label: 'Brand', icon: 'palette' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'appearance', label: 'Appearance', icon: 'sun' },
  { id: 'integrations', label: 'Integrations', icon: 'plug' },
  { id: 'api', label: 'API Keys', icon: 'key' },
  { id: 'security', label: 'Security', icon: 'shield' },
];

let settingsSection = 'profile';

Pages.settings = () => pageHead('Settings', 'Your studio, your rules.')
  + `<div class="settings-layout">
    <nav class="hub-nav">
      ${SETTINGS_SECTIONS.map(s => `<button class="nav-item ${s.id === settingsSection ? 'active' : ''}" data-set="${s.id}">${icon(s.icon)}<span>${s.label}</span></button>`).join('')}
    </nav>
    <div id="settings-body">${settingsBody()}</div>
  </div>`;

function settingRow(title, sub, control) {
  return `<div class="setting-row"><div class="sr-text"><b>${title}</b><span>${sub}</span></div>${control}</div>`;
}
function toggleCtl(on) { return `<button class="switch ${on ? 'on' : ''}" data-toggle aria-label="${on ? 'on' : 'off'}"></button>`; }

function settingsBody() {
  const s = settingsSection;

  if (s === 'profile') {
    return UI.card({
      title: 'Profile', icon: 'user',
      body: `<div class="flex" style="gap:16px;margin-bottom:20px">
          ${UI.avatar('AM', 'a56', true)}
          <div class="stack" style="gap:2px"><b style="font-size:15px">${DB.user.name}</b><span class="small t3">Founder · ${DB.user.business}</span></div>
          <button class="btn sm" style="margin-left:auto">Change photo</button>
        </div>
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <label class="field"><span class="label">Full name</span><input class="input" data-set-field="name" value="${UI.esc(DB.user.name)}"></label>
          <label class="field"><span class="label">Email</span><input class="input" data-set-field="email" value="${UI.esc(DB.user.email || 'aimanmaged88@gmail.com')}"></label>
          <label class="field"><span class="label">Role</span><input class="input" data-set-field="role" value="${UI.esc(DB.user.role)}"></label>
          <label class="field"><span class="label">Business name</span><input class="input" data-set-field="business" value="${UI.esc(DB.user.business)}"></label>
        </div>
        <div style="margin-top:20px;text-align:right"><button class="btn primary" data-save-profile>Save changes</button></div>`,
    });
  }

  if (s === 'business') {
    return UI.card({
      title: 'Business', icon: 'building',
      body: `<div class="grid" style="grid-template-columns:1fr 1fr">
          <label class="field"><span class="label">Business name</span><input class="input" value="Aiman Studio"></label>
          <label class="field"><span class="label">ABN</span><input class="input" placeholder="Add ABN"></label>
          <label class="field"><span class="label">What you build</span><input class="input" value="Websites · Apps · AI Automations · Client Portals"></label>
          <label class="field"><span class="label">Base rate</span><input class="input" value="$96 / hour equivalent"></label>
          <label class="field" style="grid-column:1/-1"><span class="label">Positioning</span>
          <textarea class="textarea">Custom software for local businesses that still run on paper and group chats. Fixed-price builds, plain English, shipped fast.</textarea></label>
        </div>
        <div style="margin-top:20px;text-align:right"><button class="btn primary">Save changes</button></div>`,
    });
  }

  if (s === 'sync') {
    const on = window.Sync?.isOn?.();
    const code = window.Sync?.code?.() || '';
    const statusRow = on
      ? `<div class="note-chip" style="border-color:var(--good);background:var(--good-soft);color:var(--text)">
           <b>${icon('check')} Sync is on.</b> This device is syncing to your workspace in the cloud. Any device with the same code below shows the same clients, leads, projects and tasks — updated automatically.
         </div>`
      : `<div class="note-chip" style="border-color:var(--accent-line);background:var(--accent-soft);color:var(--text-2)">
           Right now your data lives only in <b>this browser</b>. Turn on sync to see the same workspace on your phone and laptop. It's private — only devices with your secret code can read it.
         </div>`;

    const body = on
      ? statusRow
        + `<label class="field" style="margin-top:4px"><span class="label">Your sync code — enter this exact code on your other devices</span>
             <div class="flex" style="gap:8px">
               <input class="input" data-sync-code readonly value="${UI.esc(code)}" style="font-family:var(--font-ui);letter-spacing:.02em">
               <button class="btn" data-sync-copy>${icon('copy')}Copy</button>
             </div>
           </label>`
        + `<div class="flex" style="gap:8px;margin-top:16px;flex-wrap:wrap">
             <button class="btn primary" data-sync-now>${icon('refresh')}Sync now</button>
             <button class="btn" data-sync-disconnect style="margin-left:auto;color:var(--bad)">Disconnect this device</button>
           </div>`
        + `<p class="tiny t3" style="margin-top:14px;line-height:1.6">To add another device: open this site there → Settings → Cross-device sync → paste this code → Connect. Disconnecting only stops <b>this</b> device; your cloud copy stays safe.</p>`
      : statusRow
        + `<label class="field" style="margin-top:4px"><span class="label">Sync code</span>
             <div class="flex" style="gap:8px">
               <input class="input" data-sync-code placeholder="Paste a code, or generate one" value="">
               <button class="btn" data-sync-gen>${icon('zap')}Generate</button>
             </div>
             <span class="tiny t3" style="margin-top:6px">Keep it secret, like a password. At least ${window.Sync?.minLen || 12} characters.</span>
           </label>`
        + `<div style="margin-top:16px"><button class="btn primary" data-sync-connect>${icon('refresh')}Turn on sync</button></div>`
        + `<p class="tiny t3" style="margin-top:14px;line-height:1.6">Already set this up on another device? Enter the <b>same</b> code here and this device will pull your workspace down.</p>`;

    return UI.card({ title: 'Cross-device sync', icon: 'refresh', body });
  }

  if (s === 'brand') {
    return UI.card({
      title: 'Brand', icon: 'palette',
      body: settingRow('Accent colour', 'One accent. Flow Forward indigo, clean and modern.',
          `<span class="flex" style="gap:8px">
            <span style="width:26px;height:26px;border-radius:8px;background:var(--accent);box-shadow:0 0 0 2px var(--card),0 0 0 3.5px var(--accent)"></span>
            <span style="width:26px;height:26px;border-radius:8px;background:#6B8BE0;opacity:.45"></span>
            <span style="width:26px;height:26px;border-radius:8px;background:#58B588;opacity:.45"></span>
            <span style="width:26px;height:26px;border-radius:8px;background:#D9776B;opacity:.45"></span>
          </span>`)
        + settingRow('Logo', 'Used on invoices, quotes and client portals', `<button class="btn sm">Upload SVG</button>`)
        + settingRow('Typography', 'Inter throughout — the Flow Forward OS look', `<span class="tag">Locked in v1</span>`),
    });
  }

  if (s === 'notifications') {
    return UI.card({
      title: 'Notifications', icon: 'bell',
      body: settingRow('Overdue invoices', 'Alert when an invoice passes its due date', toggleCtl(true))
        + settingRow('Daily briefing', 'Morning summary at 7:30am', toggleCtl(true))
        + settingRow('Client replies', 'When a client responds to anything', toggleCtl(true))
        + settingRow('Content reminders', 'Nudge before scheduled posts', toggleCtl(true))
        + settingRow('Weekly review', 'Sunday evening business health recap', toggleCtl(false)),
    });
  }

  if (s === 'appearance') {
    const cur = App.currentTheme();
    return UI.card({
      title: 'Appearance', icon: 'sun',
      body: `<div class="setting-row" style="border:none">
          <div class="sr-text"><b>Theme</b><span>Dark is home. Light is for daylight.</span></div>
          <div class="theme-pick">
            <button class="theme-swatch ${cur === 'dark' ? 'sel' : ''}" data-theme-pick="dark">
              <div class="tsw" style="background:linear-gradient(135deg,#0B0B0D,#17171B)"></div><div class="tsl">Dark</div>
            </button>
            <button class="theme-swatch ${cur === 'light' ? 'sel' : ''}" data-theme-pick="light">
              <div class="tsw" style="background:linear-gradient(135deg,#F6F5F2,#fff)"></div><div class="tsl">Light</div>
            </button>
          </div>
        </div>`
        + settingRow('Reduced motion', 'Respect system motion preferences', toggleCtl(true))
        + settingRow('Compact density', 'Tighter rows and cards', toggleCtl(false)),
    });
  }

  if (s === 'integrations') {
    const rows = [
      ['Claude API', 'Daily briefing, summaries, AI search'],
      ['OpenAI API', 'ChatGPT workspaces'],
      ['Instagram', 'Publish from Content Studio'],
      ['Netlify', 'One-click client deploys'],
      ['Stripe', 'Invoice payments'],
      ['Google Calendar', 'Two-way calendar sync'],
    ];
    return UI.card({
      title: 'Integrations', icon: 'plug',
      body: `<div class="note-chip" style="border-color:var(--accent-line);background:var(--accent-soft);color:var(--text-2)">
          Phase 2 territory. The architecture is API-ready — these switches go live once the backend lands.
        </div>`
        + rows.map(([name, sub]) => settingRow(name, sub, `<button class="btn sm" disabled style="opacity:.55">Connect</button>`)).join(''),
    });
  }

  if (s === 'api') {
    return UI.card({
      title: 'API Keys', icon: 'key',
      body: UI.empty('key', 'No keys yet', 'Keys are stored securely server-side in Phase 2 — never in the browser.', 'Reserve a slot'),
    });
  }

  if (s === 'security') {
    return UI.card({
      title: 'Security & your data', icon: 'shield',
      body: `<div class="note-chip" style="border-color:var(--accent-line);background:var(--accent-soft)">
          Your data saves in this browser <b>and syncs to your other devices</b> once you turn on sync (Settings → Cross-device sync). Backups are still smart.
        </div>`
        + settingRow('Cloud sync', 'Pull the latest copy from your other device now', `<button class="btn sm" data-sync-now>${icon('refresh')}Sync now</button>`)
        + settingRow('Back up your data', 'Downloads a single file with everything', `<button class="btn sm" data-export-db>${icon('download')}Download backup</button>`)
        + settingRow('Restore from backup', 'Load a previously downloaded file', `<button class="btn sm" data-import-db>Restore</button><input type="file" data-import-file accept=".json" style="display:none">`)
        + settingRow('Start fresh', 'Wipe everything back to the sample data', `<button class="btn sm" data-reset-db style="color:var(--bad)">Reset</button>`)
        + settingRow('Authentication', 'Email + passkey sign-in', `<span class="tag">Phase 2</span>`)
        + settingRow('Two-factor', 'Require a second factor for sign-in', `<span class="tag">Phase 2</span>`),
    });
  }
  return '';
}

Pages._mount.settings = () => {
  document.querySelectorAll('[data-set]').forEach(btn =>
    btn.addEventListener('click', () => {
      settingsSection = btn.dataset.set;
      document.querySelectorAll('[data-set]').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelector('#settings-body').innerHTML = settingsBody();
      wireSettings();
    }));
  wireSettings();
};

function wireSettings() {
  document.querySelectorAll('[data-toggle]').forEach(t =>
    t.addEventListener('click', () => t.classList.toggle('on')));
  document.querySelectorAll('[data-theme-pick]').forEach(b =>
    b.addEventListener('click', () => {
      App.setTheme(b.dataset.themePick);
      document.querySelectorAll('[data-theme-pick]').forEach(x => x.classList.toggle('sel', x === b));
    }));
  document.querySelector('[data-save-profile]')?.addEventListener('click', () => {
    document.querySelectorAll('[data-set-field]').forEach(inp => { DB.user[inp.dataset.setField] = inp.value.trim(); });
    DB.user.initials = (DB.user.name || 'A').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    saveDB();
    const brand = document.querySelector('.brand-name');
    if (brand) brand.textContent = DB.user.business;
    const av = document.querySelector('#profile-btn');
    if (av) av.textContent = DB.user.initials;
    UI.toast('Profile saved');
  });
  /* ---- cross-device sync controls ---- */
  document.querySelector('[data-sync-gen]')?.addEventListener('click', () => {
    const input = document.querySelector('[data-sync-code]');
    if (input) input.value = window.Sync.generateCode();
  });
  document.querySelector('[data-sync-connect]')?.addEventListener('click', () => {
    const input = document.querySelector('[data-sync-code]');
    if (window.Sync.connect(input?.value)) {
      UI.toast('Sync is on — your workspace is in the cloud ☁️');
      document.querySelector('#settings-body').innerHTML = settingsBody();
      wireSettings();
    }
  });
  document.querySelector('[data-sync-copy]')?.addEventListener('click', async () => {
    const code = document.querySelector('[data-sync-code]')?.value || '';
    try { await navigator.clipboard.writeText(code); UI.toast('Sync code copied'); }
    catch (e) { UI.toast('Copy failed — select and copy it manually'); }
  });
  document.querySelector('[data-sync-disconnect]')?.addEventListener('click', () => {
    if (!confirm('Disconnect sync on this device? Your cloud copy and other devices are untouched. This browser goes back to local-only.')) return;
    window.Sync.disconnect();
    UI.toast('Sync disconnected on this device');
    document.querySelector('#settings-body').innerHTML = settingsBody();
    wireSettings();
  });
  document.querySelector('[data-sync-now]')?.addEventListener('click', async () => {
    if (!window.Sync.isOn()) { UI.toast('Turn on sync in Settings → Cross-device sync first'); return; }
    await window.Sync.pullNow();
    UI.toast('Sync complete');
  });
  document.querySelector('[data-export-db]')?.addEventListener('click', () => { exportDB(); UI.toast('Backup downloaded'); });
  const file = document.querySelector('[data-import-file]');
  document.querySelector('[data-import-db]')?.addEventListener('click', () => file?.click());
  file?.addEventListener('change', () => {
    const f = file.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { importDB(reader.result); UI.toast('Backup restored'); setTimeout(() => location.reload(), 600); }
      catch (e) { UI.toast('That file isn\'t a Business OS backup'); }
    };
    reader.readAsText(f);
  });
  document.querySelector('[data-reset-db]')?.addEventListener('click', () => {
    if (confirm('Wipe everything and go back to the sample data? Your backup file (if downloaded) can restore it.')) resetDB();
  });
}
