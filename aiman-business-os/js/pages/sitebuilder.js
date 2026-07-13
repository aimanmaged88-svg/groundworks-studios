/* ============================================================
   Website Studio — build a free, branded one-page mockup for a
   prospect right inside the OS. Fill in their details (or pull
   them from a lead), pick a style, and a real website renders
   live. Show it on your phone, download it to send, or publish
   it (drag the file onto Netlify). No backend, no API key.

   Every mockup saves to your workspace and syncs across devices.
   ============================================================ */

const SITE_IMPORT_URL = 'https://aiman-business-os.netlify.app/.netlify/functions/importsite';

Pages.sites = (id) => id ? siteEditor(id) : siteIndex();

/* niche presets: hero emoji + suggested services + a headline verb */
const SITE_NICHES = {
  'Café':            { emoji: '☕', hero: 'Great coffee, made local', services: ['Specialty coffee', 'All-day brunch', 'Fresh pastries', 'Takeaway & catering'], cta: 'See the menu' },
  'Restaurant':      { emoji: '🍽️', hero: 'Book a table tonight', services: ['Dine-in', 'Takeaway & delivery', 'Function bookings', 'Seasonal menu'], cta: 'Book a table' },
  'Barber':          { emoji: '💈', hero: 'Sharp cuts, booked in seconds', services: ['Skin fades', 'Beard trims', 'Hot towel shave', 'Kids cuts'], cta: 'Book now' },
  'Beauty salon':    { emoji: '💅', hero: 'Look and feel your best', services: ['Hair', 'Nails', 'Lashes & brows', 'Facials'], cta: 'Book an appointment' },
  'Gym / PT':        { emoji: '🏋️', hero: 'Start your first session free', services: ['Personal training', 'Group classes', 'Nutrition coaching', 'Free trial'], cta: 'Claim your free trial' },
  'Trades':          { emoji: '🛠️', hero: 'Fast, reliable, local', services: ['Free quotes', 'Emergency call-outs', 'Fully licensed', 'Workmanship guarantee'], cta: 'Get a free quote' },
  'Professional':    { emoji: '📊', hero: 'Advice you can trust', services: ['Consultations', 'Ongoing support', 'Fixed-fee packages', 'Local & responsive'], cta: 'Book a consult' },
  'Other':           { emoji: '⭐', hero: 'Welcome', services: ['What we do', 'How it works', 'Why choose us', 'Get in touch'], cta: 'Get in touch' },
};
const NICHE_NAMES = Object.keys(SITE_NICHES);

/* ---- the generator: a self-contained, responsive one-pager ---- */
function buildSiteHTML(s) {
  const e = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const preset = SITE_NICHES[s.niche] || SITE_NICHES['Other'];
  const accent = s.accent || '#4F46E5';
  const logo = s.logo || '';
  const name = s.business || 'Your Business';
  const tagline = s.tagline || preset.hero;
  const emoji = s.hero || preset.emoji;
  const services = (Array.isArray(s.services) ? s.services : String(s.services || '').split('\n'))
    .map(x => x.trim()).filter(Boolean);
  const list = services.length ? services : preset.services;
  const phone = s.phone || '';
  const telHref = phone ? 'tel:' + phone.replace(/[^\d+]/g, '') : '';
  const email = s.email || '';
  const suburb = s.suburb || '';
  const mapsHref = suburb ? 'https://www.google.com/maps/search/' + encodeURIComponent(name + ' ' + suburb) : '';

  const callBtn = phone
    ? `<a class="btn primary" href="${e(telHref)}">📞 Call ${e(phone)}</a>`
    : `<a class="btn primary" href="#contact">${e(preset.cta)}</a>`;

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e(name)}${suburb ? ' — ' + e(suburb) : ''}</title>
<meta name="description" content="${e(name)} — ${e(tagline)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--a:${accent};--ink:#0e1220;--mut:#5b6472;--bg:#ffffff;--soft:#f5f6fa;--line:#e8eaf0}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--bg);line-height:1.55;-webkit-font-smoothing:antialiased}
img{max-width:100%}
a{color:inherit;text-decoration:none}
.wrap{max-width:1040px;margin:0 auto;padding:0 22px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:12px;font-weight:700;font-size:15px;transition:.15s;border:1.5px solid transparent}
.btn.primary{background:var(--a);color:#fff;box-shadow:0 8px 20px -6px color-mix(in srgb,var(--a) 55%,transparent)}
.btn.primary:hover{filter:brightness(1.06);transform:translateY(-1px)}
.btn.ghost{background:#fff;border-color:var(--line);color:var(--ink)}
.btn.ghost:hover{border-color:var(--a);color:var(--a)}
header{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.85);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.nav{display:flex;align-items:center;justify-content:space-between;height:66px}
.brand{font-weight:800;font-size:19px;letter-spacing:-.02em;display:flex;align-items:center;gap:9px}
.brand .dot{width:30px;height:30px;border-radius:9px;background:var(--a);display:grid;place-items:center;font-size:16px}
.hero{background:linear-gradient(160deg,color-mix(in srgb,var(--a) 12%,#fff),#fff 62%);padding:70px 0 64px;text-align:center}
.hero .emoji{font-size:60px;margin-bottom:14px}
.hero h1{font-size:clamp(30px,6vw,52px);font-weight:800;letter-spacing:-.03em;line-height:1.05;max-width:14ch;margin:0 auto 16px}
.hero p{font-size:clamp(16px,2.4vw,20px);color:var(--mut);max-width:44ch;margin:0 auto 26px}
.hero .cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
section{padding:58px 0}
.eyebrow{color:var(--a);font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;text-align:center}
h2{font-size:clamp(24px,4vw,34px);font-weight:800;letter-spacing:-.02em;text-align:center;margin:8px 0 34px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px}
.card{background:var(--soft);border:1px solid var(--line);border-radius:16px;padding:24px}
.card .ic{width:42px;height:42px;border-radius:11px;background:color-mix(in srgb,var(--a) 14%,#fff);color:var(--a);display:grid;place-items:center;font-weight:800;font-size:18px;margin-bottom:12px}
.card h3{font-size:17px;font-weight:700;margin-bottom:4px}
.card p{color:var(--mut);font-size:14.5px}
.band{background:var(--ink);color:#fff;border-radius:22px;padding:44px;text-align:center;margin:0 22px}
.band h2{color:#fff;margin-bottom:10px}
.band p{color:#c7ccd6;max-width:52ch;margin:0 auto 22px}
.contact{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;max-width:760px;margin:0 auto}
.info{background:var(--soft);border:1px solid var(--line);border-radius:14px;padding:20px;text-align:center}
.info .k{font-size:12.5px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.info .v{font-weight:700;font-size:16px}
.info a.v{color:var(--a)}
footer{text-align:center;padding:34px 0;color:var(--mut);font-size:13.5px;border-top:1px solid var(--line)}
.callbar{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid var(--line);padding:12px 22px;display:none;z-index:30;box-shadow:0 -6px 20px -8px rgba(0,0,0,.12)}
.callbar .btn{width:100%;justify-content:center}
@media(max-width:600px){.callbar{display:block}body{padding-bottom:70px}}
</style></head>
<body>
<header><div class="wrap nav">
  <div class="brand">${logo ? `<img src="${e(logo)}" alt="${e(name)}" style="height:38px;width:auto;max-width:180px;border-radius:8px">` : `<span class="dot">${e(emoji)}</span>${e(name)}`}</div>
  ${phone ? `<a class="btn ghost" href="${e(telHref)}">📞 ${e(phone)}</a>` : `<a class="btn ghost" href="#contact">Contact</a>`}
</div></header>

<div class="hero"><div class="wrap">
  <div class="emoji">${logo ? `<img src="${e(logo)}" alt="${e(name)}" style="height:88px;width:auto;max-width:72%;border-radius:18px">` : e(emoji)}</div>
  <h1>${e(tagline)}</h1>
  <p>${e(name)}${suburb ? ' · ' + e(suburb) : ''} — quality you can count on, from a team that actually cares.</p>
  <div class="cta">${callBtn}${email ? `<a class="btn ghost" href="mailto:${e(email)}">✉️ Email us</a>` : ''}</div>
</div></div>

<section><div class="wrap">
  <div class="eyebrow">What we do</div>
  <h2>Everything you need, done right</h2>
  <div class="grid">
    ${list.slice(0, 8).map((svc, i) => `<div class="card"><div class="ic">${i + 1}</div><h3>${e(svc)}</h3><p>Reliable, professional ${e(svc.toLowerCase())} you can trust.</p></div>`).join('')}
  </div>
</div></section>

<section style="padding-top:0"><div class="wrap">
  <div class="band">
    <h2>Ready when you are</h2>
    <p>Get in touch today and see why locals choose ${e(name)}. Friendly service, fair prices, no surprises.</p>
    ${callBtn}
  </div>
</div></section>

<section id="contact"><div class="wrap">
  <div class="eyebrow">Get in touch</div>
  <h2>Come say hello</h2>
  <div class="contact">
    ${phone ? `<div class="info"><div class="k">Call</div><a class="v" href="${e(telHref)}">${e(phone)}</a></div>` : ''}
    ${email ? `<div class="info"><div class="k">Email</div><a class="v" href="mailto:${e(email)}">${e(email)}</a></div>` : ''}
    ${suburb ? `<div class="info"><div class="k">Find us</div>${mapsHref ? `<a class="v" href="${e(mapsHref)}" target="_blank" rel="noopener">${e(suburb)}</a>` : `<div class="v">${e(suburb)}</div>`}</div>` : ''}
    <div class="info"><div class="k">Hours</div><div class="v">Open 7 days</div></div>
  </div>
</div></section>

<footer>© ${e(name)}. All rights reserved.</footer>
${phone ? `<div class="callbar"><a class="btn primary" href="${e(telHref)}">📞 Call ${e(name)} now</a></div>` : ''}
</body></html>`;
}

/* ---- helpers ---- */
const siteById = (id) => (DB.sites || []).find(s => s.id === id);
const siteFileName = (s) => (s.business || 'website').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-mockup.html';
function downloadSite(s) {
  const blob = new Blob([buildSiteHTML(s)], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = siteFileName(s);
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function openSite(s) {
  const blob = new Blob([buildSiteHTML(s)], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
/* read an uploaded logo and shrink it so it stays small in the synced blob */
function readLogo(file, cb) {
  if (!file) return cb(null);
  const reader = new FileReader();
  reader.onload = () => {
    // SVGs are already tiny + scalable — keep as-is
    if (file.type === 'image/svg+xml') return cb(reader.result);
    const img = new Image();
    img.onload = () => {
      const max = 260;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      cb(c.toDataURL('image/png')); // PNG preserves logo transparency
    };
    img.onerror = () => cb(null);
    img.src = reader.result;
  };
  reader.onerror = () => cb(null);
  reader.readAsDataURL(file);
}
function normUrl(u) {
  u = (u || '').trim();
  if (!u) return '';
  return /^https?:\/\//i.test(u) ? u : 'https://' + u;
}

/* ---- index: grid of saved mockups ---- */
function siteIndex() {
  if (!DB.sites) DB.sites = [];
  const sites = DB.sites;
  return pageHead('Website Studio', 'Build a free branded mockup in seconds — show it, send it, or publish it',
    `<button class="btn primary" data-new-site>${icon('plus')}New mockup</button>`)
    + (sites.length
      ? `<div class="client-grid">${sites.map(s => `
          <div class="card hoverable" style="overflow:hidden;padding:0;cursor:pointer" data-open-site="${s.id}">
            <div style="height:150px;background:#fff;border-bottom:1px solid var(--border);overflow:hidden;position:relative">
              <iframe title="preview" style="position:absolute;top:0;left:0;width:200%;height:300%;border:0;transform:scale(.5);transform-origin:top left;pointer-events:none" srcdoc="${UI.esc(buildSiteHTML(s))}"></iframe>
            </div>
            <div style="padding:15px 16px">
              <div class="spread"><div class="row-title" style="font-size:15px">${UI.esc(s.business || 'Untitled')}</div><span class="badge gold">${UI.esc(s.niche || 'Site')}</span></div>
              <div class="row-sub" style="margin-top:2px">${UI.esc(s.tagline || '')}</div>
              <div class="flex" style="gap:6px;margin-top:12px">
                <button class="btn sm" data-open-site="${s.id}">${icon('layout')}Edit</button>
                <button class="btn sm" data-preview-site="${s.id}">${icon('eye')}Open</button>
                <button class="btn sm" data-download-site="${s.id}">${icon('download')}</button>
                <button class="btn sm" data-del-site="${s.id}" style="margin-left:auto;color:var(--bad)">${icon('x')}</button>
              </div>
            </div>
          </div>`).join('')}</div>`
      : `<div class="card mission-card" style="margin-bottom:16px"><div class="flex" style="gap:14px">
           <span class="mission-ico">${icon('globe')}</span>
           <div class="stack" style="gap:3px">
             <b style="font-size:16px">Turn a "yes" into a website on the spot</b>
             <span class="small t2">When a lead says they'd love to see the free mockup, build it here in under a minute. Pick a lead to auto-fill their details, tweak the copy, and you've got a real site to show, send, or publish.</span>
           </div></div></div>`
        + UI.empty('globe', 'No mockups yet', 'Hit “New mockup” to build your first free website.', 'New mockup'));
}

/* ---- editor: live form + preview ---- */
function siteEditor(id) {
  const s = siteById(id);
  if (!s) return UI.empty('globe', 'Mockup not found', 'It may have been deleted.', 'Back to Website Studio');
  const svcText = (Array.isArray(s.services) ? s.services.join('\n') : (s.services || ''));
  const swatches = ['#4F46E5', '#0EA5E9', '#059669', '#EA580C', '#DB2777', '#7C3AED', '#0f172a', '#B91C1C'];
  return `<a class="back-link" href="#/sites">${icon('chevronLeft')}All mockups</a>
    <div class="detail-hero" style="margin-bottom:16px">
      <div style="flex:1">
        <div class="page-title" style="font-size:24px">${UI.esc(s.business || 'New website')}</div>
        <div class="page-sub">Edit on the left — the real website updates live on the right.</div>
      </div>
      <div class="flex" style="gap:8px;flex-wrap:wrap;justify-content:flex-end">
        <button class="btn" data-site-open>${icon('eye')}Open full page</button>
        <button class="btn" data-site-copy>${icon('copy')}Copy HTML</button>
        <button class="btn primary" data-site-download>${icon('download')}Download to send</button>
      </div>
    </div>
    <div class="site-editor">
      <div class="card">
        <div class="stack" style="gap:14px">
          <label class="field"><span class="label">Business name</span><input class="input" data-sf="business" value="${UI.esc(s.business || '')}" placeholder="e.g. Bankstown Barbers"></label>
          <label class="field"><span class="label">Headline / what they do</span><input class="input" data-sf="tagline" value="${UI.esc(s.tagline || '')}" placeholder="Sharp cuts, booked in seconds"></label>
          <label class="field"><span class="label">Style</span>
            <select class="select" data-sf="niche">${NICHE_NAMES.map(n => `<option ${n === s.niche ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
          <div class="field"><span class="label">Accent colour</span>
            <div class="flex" style="gap:7px;flex-wrap:wrap">
              ${swatches.map(c => `<button type="button" class="site-swatch" data-swatch="${c}" style="width:30px;height:30px;border-radius:8px;background:${c};border:2px solid ${c === (s.accent || '#4F46E5') ? 'var(--text)' : 'transparent'};cursor:pointer"></button>`).join('')}
              <input type="color" data-sf="accent" value="${UI.esc(s.accent || '#4F46E5')}" style="width:34px;height:30px;border:0;background:none;cursor:pointer;padding:0">
            </div>
          </div>
          <div class="field"><span class="label">Their logo (optional)</span>
            <div class="flex" style="gap:10px;align-items:center">
              <div data-logo-preview style="width:54px;height:54px;border-radius:11px;border:1px solid var(--border);background:var(--card-2);background-size:contain;background-repeat:no-repeat;background-position:center;display:grid;place-items:center;color:var(--text-3);font-size:10px;flex-shrink:0">${s.logo ? '' : 'None'}</div>
              <div class="flex" style="gap:6px;flex-wrap:wrap">
                <button type="button" class="btn sm" data-logo-pick>${icon('image')}Upload logo</button>
                <button type="button" class="btn sm" data-logo-clear style="color:var(--bad)">Remove</button>
              </div>
              <input type="file" data-logo-file accept="image/png,image/jpeg,image/svg+xml,image/webp" style="display:none">
            </div>
            <span class="tiny t3" style="margin-top:6px">Drops straight into the header and hero. PNG with transparency works best.</span>
          </div>
          <label class="field"><span class="label">Hero emoji ${s.logo ? '(hidden while a logo is set)' : ''}</span><input class="input" data-sf="hero" value="${UI.esc(s.hero || '')}" placeholder="☕ 💈 🏋️ 🛠️" style="max-width:120px"></label>
          <label class="field"><span class="label">Services / highlights (one per line)</span><textarea class="textarea" data-sf="services" rows="5" placeholder="One per line">${UI.esc(svcText)}</textarea></label>
          <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px">
            <label class="field"><span class="label">Phone</span><input class="input" data-sf="phone" value="${UI.esc(s.phone || '')}" placeholder="0400 000 000"></label>
            <label class="field"><span class="label">Suburb</span><input class="input" data-sf="suburb" value="${UI.esc(s.suburb || '')}" placeholder="Bankstown"></label>
          </div>
          <label class="field"><span class="label">Email</span><input class="input" data-sf="email" value="${UI.esc(s.email || '')}" placeholder="hello@business.com.au"></label>
          <label class="field"><span class="label">Their current website — build from it</span>
            <div class="flex" style="gap:8px;flex-wrap:wrap">
              <input class="input" data-sf="currentSite" value="${UI.esc(s.currentSite || '')}" placeholder="oldsite.com.au" style="min-width:150px;flex:1">
              <button type="button" class="btn primary" data-import-current>${icon('download')}Import</button>
              <button type="button" class="btn" data-open-current>${icon('globe')}Open</button>
            </div>
            <span class="tiny t3" style="margin-top:6px">Paste their existing site and hit <b>Import</b> — it pulls their name, colours, logo, phone and services in to fill this mockup. Then tidy it up.</span>
          </label>
          <div class="tiny t3" style="line-height:1.6" id="site-saved">Saved automatically · syncs to your devices</div>
        </div>
      </div>
      <div class="site-preview-wrap">
        <div class="card" style="padding:10px">
          <div class="spread" style="padding:2px 6px 10px"><span class="small t2">Live preview</span><span class="tiny t3">Real website · scroll inside</span></div>
          <iframe id="site-frame" title="Live website preview" style="width:100%;height:660px;border:1px solid var(--border);border-radius:12px;background:#fff"></iframe>
        </div>
      </div>
    </div>`;
}

/* ---- create a new mockup, optionally from a lead ---- */
function newSiteModal() {
  const leads = (DB.prospects || []).filter(p => p.business);
  const fields = [
    { name: 'business', label: 'Business name', required: true, placeholder: 'e.g. Bankstown Barbers' },
    { name: 'niche', label: 'Style', type: 'select', options: NICHE_NAMES, value: 'Other' },
  ];
  if (leads.length) {
    fields.unshift({ name: 'from', label: 'Start from a lead (optional)', type: 'select', options: ['— Blank —', ...leads.map(p => p.business)], value: '— Blank —' });
  }
  UI.modal({
    title: 'New website mockup', submitLabel: 'Build it',
    fields,
    onSubmit(v) {
      let base = { business: (v.business || '').trim(), niche: v.niche || 'Other', accent: '#4F46E5' };
      if (v.from && v.from !== '— Blank —') {
        const p = leads.find(l => l.business === v.from);
        if (p) {
          base.business = base.business || p.business;
          base.phone = p.phone || '';
          base.email = p.email || '';
          base.suburb = p.suburb || p.location || '';
          if (p.niche && NICHE_NAMES.includes(mapNiche(p.niche))) base.niche = mapNiche(p.niche);
          base.prospectId = p.id;
        }
      }
      const preset = SITE_NICHES[base.niche] || SITE_NICHES['Other'];
      const site = {
        id: uid('site'), created: Date.now(),
        tagline: preset.hero, hero: preset.emoji, services: preset.services.join('\n'),
        phone: '', email: '', suburb: '', ...base,
      };
      if (!DB.sites) DB.sites = [];
      DB.sites.unshift(site);
      saveDB();
      location.hash = '#/sites/' + site.id;
    },
  });
}

/* map a Lead Finder niche (e.g. "Barbers", "Cafés") to a site style */
function mapNiche(n) {
  const x = (n || '').toLowerCase();
  if (x.includes('caf')) return 'Café';
  if (x.includes('restaur')) return 'Restaurant';
  if (x.includes('barber')) return 'Barber';
  if (x.includes('beauty') || x.includes('salon')) return 'Beauty salon';
  if (x.includes('gym') || x.includes('pt') || x.includes('physio')) return 'Gym / PT';
  if (['mechanic', 'fencing', 'landscap', 'plumb', 'electric', 'roof', 'clean', 'build'].some(t => x.includes(t))) return 'Trades';
  if (x.includes('real estate') || x.includes('tutor')) return 'Professional';
  return 'Other';
}

/* ---- mount / wiring ---- */
Pages._mount.sites = (id) => {
  if (!id) {
    document.querySelector('[data-new-site]')?.addEventListener('click', newSiteModal);
    document.querySelectorAll('[data-open-site]').forEach(el =>
      el.addEventListener('click', (e) => { e.stopPropagation(); location.hash = '#/sites/' + el.dataset.openSite; }));
    document.querySelectorAll('[data-preview-site]').forEach(el =>
      el.addEventListener('click', (e) => { e.stopPropagation(); const s = siteById(el.dataset.previewSite); if (s) openSite(s); }));
    document.querySelectorAll('[data-download-site]').forEach(el =>
      el.addEventListener('click', (e) => { e.stopPropagation(); const s = siteById(el.dataset.downloadSite); if (s) downloadSite(s); }));
    document.querySelectorAll('[data-del-site]').forEach(el =>
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const s = siteById(el.dataset.delSite);
        if (s && confirm(`Delete the mockup for "${s.business || 'this business'}"?`)) {
          DB.sites = DB.sites.filter(x => x.id !== s.id); saveDB();
          document.querySelector('#view .page').innerHTML = siteIndex(); Pages._mount.sites();
        }
      }));
    return;
  }

  const s = siteById(id);
  if (!s) return;
  const frame = document.querySelector('#site-frame');
  const render = () => { if (frame) frame.srcdoc = buildSiteHTML(s); };
  render();

  let t = null;
  const flag = document.querySelector('#site-saved');
  const onEdit = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      saveDB();
      render();
      if (flag) { flag.textContent = 'Saved ✓ · syncs to your devices'; setTimeout(() => { if (flag) flag.textContent = 'Saved automatically · syncs to your devices'; }, 1400); }
    }, 350);
  };

  document.querySelectorAll('[data-sf]').forEach(inp => {
    const key = inp.dataset.sf;
    const ev = (inp.type === 'color' || inp.tagName === 'SELECT') ? 'change' : 'input';
    inp.addEventListener(ev, () => {
      s[key] = inp.value;
      if (key === 'accent') syncSwatches(inp.value);
      onEdit();
    });
  });
  document.querySelectorAll('[data-swatch]').forEach(b =>
    b.addEventListener('click', () => {
      s.accent = b.dataset.swatch;
      const picker = document.querySelector('[data-sf="accent"]');
      if (picker) picker.value = s.accent;
      syncSwatches(s.accent);
      onEdit();
    }));

  /* logo upload */
  const logoPrev = document.querySelector('[data-logo-preview]');
  const setLogoPreview = () => {
    if (!logoPrev) return;
    if (s.logo) { logoPrev.style.backgroundImage = `url("${s.logo}")`; logoPrev.textContent = ''; }
    else { logoPrev.style.backgroundImage = 'none'; logoPrev.textContent = 'None'; }
  };
  setLogoPreview();
  const logoFile = document.querySelector('[data-logo-file]');
  document.querySelector('[data-logo-pick]')?.addEventListener('click', () => logoFile?.click());
  logoFile?.addEventListener('change', () => {
    const f = logoFile.files?.[0];
    if (!f) return;
    if (f.size > 6 * 1024 * 1024) { UI.toast('That image is large — try one under 6MB'); return; }
    readLogo(f, (dataUrl) => {
      if (!dataUrl) { UI.toast("Couldn't read that image"); return; }
      s.logo = dataUrl;
      setLogoPreview();
      onEdit();
      UI.toast('Logo added');
    });
  });
  document.querySelector('[data-logo-clear]')?.addEventListener('click', () => {
    if (!s.logo) return;
    s.logo = '';
    setLogoPreview();
    onEdit();
  });

  /* open their current website side-by-side */
  document.querySelector('[data-open-current]')?.addEventListener('click', () => {
    const u = normUrl(document.querySelector('[data-sf="currentSite"]')?.value);
    if (u) window.open(u, '_blank'); else UI.toast('Enter their website address first');
  });

  /* import: read their existing site and pull details into the mockup */
  const importBtn = document.querySelector('[data-import-current]');
  importBtn?.addEventListener('click', async () => {
    const raw = document.querySelector('[data-sf="currentSite"]')?.value?.trim();
    if (!raw) { UI.toast('Paste their website address first'); return; }
    s.currentSite = raw;
    const label = importBtn.innerHTML;
    importBtn.disabled = true;
    importBtn.innerHTML = icon('refresh') + 'Reading their site…';
    try {
      const r = await fetch(SITE_IMPORT_URL + '?url=' + encodeURIComponent(raw));
      const d = await r.json();
      if (!r.ok || d.error) { UI.toast(d.error === 'unreachable' || d.error === 'fetch_failed' ? "Couldn't reach that site — check the address" : 'Import didn’t work — fill it in by hand'); return; }
      if (d.business) s.business = d.business;
      if (d.tagline) s.tagline = d.tagline;
      if (d.accent) s.accent = d.accent;
      if (d.logo) s.logo = d.logo;
      if (d.phone) s.phone = d.phone;
      if (d.email) s.email = d.email;
      if (Array.isArray(d.services) && d.services.length) s.services = d.services.join('\n');
      saveDB();
      UI.toast('Imported from their site ✓ — tidy it up and send');
      App.refresh(); // re-render the editor with the pulled-in values
    } catch (e) {
      UI.toast('Import needs the live app (functions run on the server)');
    } finally {
      importBtn.disabled = false;
      importBtn.innerHTML = label;
    }
  });

  document.querySelector('[data-site-download]')?.addEventListener('click', () => { downloadSite(s); UI.toast('Downloaded — text or email it to them 📩'); });
  document.querySelector('[data-site-open]')?.addEventListener('click', () => openSite(s));
  document.querySelector('[data-site-copy]')?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(buildSiteHTML(s)); UI.toast('Website HTML copied'); }
    catch (e) { UI.toast('Copy failed — use Download instead'); }
  });
};

function syncSwatches(color) {
  document.querySelectorAll('[data-swatch]').forEach(b =>
    b.style.borderColor = (b.dataset.swatch.toLowerCase() === (color || '').toLowerCase()) ? 'var(--text)' : 'transparent');
}
