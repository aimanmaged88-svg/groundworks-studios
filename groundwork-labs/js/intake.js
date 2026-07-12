/* ============================================================
   GROUNDWORK ARCHITECT — guided project intake
   Listens in plain English, extracts what it can, reflects its
   understanding back, and only asks what's still missing.
   Ends with the materials step: logo, work photos (with
   captions), flyer and videos upload straight to the studio so
   the build starts in the background. Nothing is sent until
   the visitor chooses to send it.
   ============================================================ */

(() => {
  const IG_URL = 'https://instagram.com/studiogroundworks';
  const CAL_URL = 'https://cal.com/groundworklabs/15min';
  const EMAIL = 'aimanmaged88@gmail.com';

  /* -------- client materials storage (Supabase public bucket) -------- */
  const SUPA_URL = 'https://ymuwuhvqqftgpxwhzoub.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdXd1aHZxcWZ0Z3B4d2h6b3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NjUyMzgsImV4cCI6MjA5OTI0MTIzOH0.sOkWQpulWj_ZSqMNSV7YP55T70UFSm2mP5e5xapQyQo';
  const BUCKET = 'groundwork-client-uploads';
  const MAX_PHOTOS = 30;
  const MAX_VIDEOS = 3;
  const MAX_VIDEO_MB = 50;

  const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const slug = s => String(s || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'client';

  /* ---------------- state ---------------- */
  const SLOTS = ['type', 'business', 'goal', 'features', 'vibe', 'website', 'timeline', 'budget', 'name', 'contact', 'assets'];
  const LABELS = {
    type: 'Project', business: 'Business', goal: 'Main goal', features: 'Must-haves',
    vibe: 'Look & feel', website: 'Current website', timeline: 'Timeline', budget: 'Budget',
    name: 'Name', contact: 'Contact', assets: 'Your materials',
  };
  let brief = load() || { features: [] };
  if (!brief.assets) brief.assets = { logo: null, photos: [], flyer: null, videos: [], links: [] };
  let asking = null;          // slot currently being asked
  let featureMode = false;    // multi-select in progress
  let contactNudged = false;
  let finished = false;
  let uploading = false;

  // files picked but not yet uploaded (never persisted — File objects can't be)
  const pending = { logo: null, photos: [], flyer: null, videos: [] };

  function save() {
    try { sessionStorage.setItem('gw-brief', JSON.stringify(brief)); } catch (e) {}
  }
  function load() { try { return JSON.parse(sessionStorage.getItem('gw-brief')); } catch (e) { return null; } }

  /* ---------------- extraction (the "AI checking") ---------------- */
  const TYPE_MAP = [
    [/book|appoint|class|schedul|reserv/i, 'A booking system'],
    [/store|shop online|sell|e-?com|order online|ordering/i, 'An online store / ordering'],
    [/automat|\bai\b|chat ?bot|assistant|summar/i, 'AI automation'],
    [/\bapp\b|portal|dashboard|system|platform|software|crm/i, 'A business app'],
    [/site|website|web ?page|landing|online presence/i, 'A website'],
  ];
  const BIZ_MAP = [
    [/gym|fitness|muay|boxing|coach|trainer|pt\b/i, 'Gym / fitness'],
    [/caf|restaurant|food|butcher|baker|coffee|kitchen|takeaway/i, 'Café / food'],
    [/fenc|plumb|electric|build|construct|landscap|tradie|paint|roof|concret/i, 'Trades'],
    [/basketball|soccer|footy|league|club|team|sport/i, 'Sports / community'],
    [/salon|barber|clinic|law|account|agency|consult|real estate|ndis|care/i, 'Professional services'],
    [/shop|retail|boutique|market/i, 'Retail / shop'],
  ];
  const FEAT_MAP = [
    [/book|appoint|class|schedul/i, 'Bookings'],
    [/pay|stripe|checkout|card/i, 'Online payments'],
    [/order/i, 'Online ordering'],
    [/menu|price ?list|pricing/i, 'Menu / price list'],
    [/photo|gallery|portfolio|before.after/i, 'Photo gallery'],
    [/login|member|account|portal/i, 'Client login area'],
    [/admin|manage|dashboard/i, 'Admin dashboard'],
    [/insta|social/i, 'Instagram feed'],
    [/\bai\b|chat ?bot|assistant|automat/i, 'AI assistant'],
    [/quote|enquir|contact form|lead/i, 'Quote / contact forms'],
  ];
  const GOAL_MAP = [
    [/professional|premium|look|image|brand|stand out/i, 'Look more professional'],
    [/los|miss|enquir|lead|slip/i, 'Stop losing enquiries'],
    [/book/i, 'Take bookings online'],
    [/order|pay|sell/i, 'Take orders / payments'],
    [/admin|paperwork|manual|time|automat/i, 'Automate the admin'],
  ];
  const TIME_MAP = [
    [/asap|urgent|yesterday|right away|this week|now/i, 'ASAP'],
    [/this month|few weeks|soon/i, 'This month'],
    [/month|quarter|later this year/i, '1–3 months'],
    [/explor|brows|curious|research|just looking|idea stage/i, 'Just exploring'],
  ];
  const URL_RE = /((https?:\/\/|www\.)[^\s,]+|[\w-]+(\.[\w-]+)*\.(com|net|org|co|io|app|dev|au|nz|uk|ca|us|site|online|store|shop|biz|info|me|tv|social)(\.[a-z]{2})?(\/[^\s,]*)?)/i;
  const cleanUrl = u => u.replace(/[.,!?;:)\]]+$/, '');

  function extract(text) {
    const found = {};
    if (!brief.type) for (const [re, v] of TYPE_MAP) if (re.test(text)) { found.type = v; break; }
    if (!brief.business) for (const [re, v] of BIZ_MAP) if (re.test(text)) { found.business = v; break; }
    if (!brief.timeline) for (const [re, v] of TIME_MAP) if (re.test(text)) { found.timeline = v; break; }
    const feats = [];
    for (const [re, v] of FEAT_MAP) if (re.test(text) && !brief.features.includes(v)) feats.push(v);
    if (feats.length) found.features = feats;
    const money = text.match(/\$ ?(\d[\d,.]*)\s*(k)?/i);
    if (!brief.budget && money) {
      let n = parseFloat(money[1].replace(/,/g, ''));
      if (money[2]) n *= 1000;
      found.budget = n < 1500 ? '$500 – $1.5k' : n < 4000 ? '$1.5k – $4k' : n < 8000 ? '$4k – $8k' : '$8k+';
    }
    return found;
  }

  function applyFound(found) {
    const notes = [];
    if (found.type) { brief.type = found.type; notes.push(`<b>${found.type.toLowerCase()}</b>`); }
    if (found.business) { brief.business = found.business; notes.push(`for a <b>${found.business.toLowerCase()}</b> business`); }
    if (found.features) { brief.features.push(...found.features); notes.push(`must-haves like <b>${found.features.slice(0, 3).join(', ').toLowerCase()}</b>`); }
    if (found.timeline) { brief.timeline = found.timeline; notes.push(`timeline <b>${found.timeline.toLowerCase()}</b>`); }
    if (found.budget) { brief.budget = found.budget; notes.push(`budget around <b>${found.budget}</b>`); }
    save();
    return notes;
  }

  /* ---------------- questions ---------------- */
  const SUGGEST_BY_TYPE = {
    'A booking system': ['Bookings', 'Online payments', 'Client login area', 'Admin dashboard'],
    'An online store / ordering': ['Online ordering', 'Online payments', 'Menu / price list', 'Instagram feed'],
    'A website': ['Photo gallery', 'Quote / contact forms', 'Instagram feed', 'Menu / price list'],
    'A business app': ['Admin dashboard', 'Client login area', 'Bookings', 'Online payments'],
    'AI automation': ['AI assistant', 'Admin dashboard', 'Quote / contact forms'],
  };
  const ALL_FEATURES = ['Bookings', 'Online payments', 'Online ordering', 'Menu / price list', 'Photo gallery', 'Client login area', 'Admin dashboard', 'Instagram feed', 'AI assistant', 'Quote / contact forms'];

  const HOW_COPY_LINK = 'How do I copy my link?';

  const Q = {
    type: {
      prompt: () => `So — what are we building?`,
      chips: () => ['A website', 'A business app', 'An online store / ordering', 'A booking system', 'AI automation', 'Not sure yet'],
    },
    business: {
      prompt: () => `Who's it for? Tell me a bit about the business.`,
      chips: () => ['Gym / fitness', 'Café / food', 'Trades', 'Retail / shop', 'Sports / community', 'Professional services', 'Something else'],
    },
    goal: {
      prompt: () => `What's the <b>one thing</b> it needs to fix or unlock for you?`,
      chips: () => ['Look more professional', 'Stop losing enquiries', 'Take bookings online', 'Take orders / payments', 'Automate the admin', 'Honestly — all of it'],
    },
    features: {
      prompt: () => {
        const sug = SUGGEST_BY_TYPE[brief.type] || ALL_FEATURES.slice(0, 4);
        return `Based on what you've told me, I'd usually include <b>${sug.join(', ').toLowerCase()}</b> in a build like this. Tap anything you want — add or remove — then hit <b>that's everything</b>.`;
      },
      multi: true,
      chips: () => ALL_FEATURES,
      preselect: () => (SUGGEST_BY_TYPE[brief.type] || []).filter(Boolean),
    },
    vibe: {
      prompt: () => `Now the fun part — describe the <b>look and feel</b> you're imagining. Colours, style, anything you've seen and loved.`,
      chips: () => ['Dark & premium', 'Clean & minimal', 'Bright & friendly', 'Bold & loud', 'You decide — surprise me'],
    },
    website: {
      prompt: () => `Got a <b>current website, Instagram or Facebook page</b>? Paste the link here — I'll study it so you don't have to repeat what's already out there.`,
      chips: () => ['No website yet', HOW_COPY_LINK, 'Skip this'],
    },
    timeline: {
      prompt: () => `When do you want this live?`,
      chips: () => ['ASAP', 'This month', '1–3 months', 'Just exploring'],
    },
    budget: {
      prompt: () => `Rough budget comfort zone? Every option — <b>even free</b> — gets you something real, so there's no wrong answer here. This just helps me recommend the right starting point.`,
      chips: () => ['Free starter', '$500 – $1.5k', '$1.5k – $4k', '$4k – $8k', '$8k+', 'Skip this'],
    },
    name: {
      prompt: () => `Nearly there. What's your <b>name</b>?`,
      chips: () => null,
    },
    contact: {
      prompt: () => `And the best way to reach you, ${esc(firstName())} — <b>email, phone, or Instagram @handle</b>?`,
      chips: () => null,
    },
    assets: { prompt: () => ``, chips: () => null }, // rendered specially by askAssets()
  };

  const firstName = () => (brief.name || '').split(/\s+/)[0] || 'legend';
  const answered = () => SLOTS.filter(s => s === 'features' ? brief.featuresDone : s === 'assets' ? brief.assetsDone : brief[s]).length;
  function nextSlot() {
    for (const s of SLOTS) {
      if (s === 'features' ? !brief.featuresDone : s === 'assets' ? !brief.assetsDone : !brief[s]) return s;
    }
    return null;
  }

  /* ---------------- chat UI ---------------- */
  const body = document.getElementById('chat-body');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');

  const AI_AV = `<svg viewBox="0 0 122 122" xmlns="http://www.w3.org/2000/svg"><g fill="#3D3129"><rect x="31.3" y="0" width="28" height="28"/><rect x="62.6" y="0" width="28" height="28"/><rect x="94" y="0" width="28" height="28"/><rect x="62.6" y="62.6" width="28" height="28"/><rect x="94" y="62.6" width="28" height="28"/></g><g fill="#F4793B"><rect x="0" y="0" width="28" height="28"/><rect x="0" y="31.3" width="28" height="28"/><rect x="0" y="62.6" width="28" height="28"/><rect x="0" y="94" width="28" height="28"/><rect x="31.3" y="94" width="28" height="28"/><rect x="62.6" y="94" width="28" height="28"/><rect x="94" y="94" width="28" height="28"/></g></svg>`;

  function aiMsg(html) {
    body.insertAdjacentHTML('beforeend', `<div class="msg ai"><span class="av">${AI_AV}</span><div class="bubble">${html}</div></div>`);
    scroll();
  }
  function meMsg(text) {
    body.insertAdjacentHTML('beforeend', `<div class="msg me"><span class="av">YOU</span><div class="bubble">${esc(text)}</div></div>`);
    scroll();
  }
  function chipsRow(items, { multi = false, preselected = [], onPick = null } = {}) {
    clearChips();
    if (!items) return;
    const row = document.createElement('div');
    row.className = 'chips';
    row.id = 'active-chips';
    items.forEach(c => {
      const b = document.createElement('button');
      b.className = 'chip' + (preselected.includes(c) ? ' sel' : '');
      b.textContent = c;
      b.addEventListener('click', () => {
        if (multi) { b.classList.toggle('sel'); }
        else if (onPick) onPick(c);
        else handleAnswer(c, true);
      });
      row.appendChild(b);
    });
    if (multi) {
      const done = document.createElement('button');
      done.className = 'chip done-chip';
      done.textContent = "That's everything ✓";
      done.addEventListener('click', () => {
        const picked = [...row.querySelectorAll('.chip.sel')].map(b => b.textContent);
        brief.features = [...new Set([...brief.features, ...picked])];
        brief.featuresDone = true;
        save();
        clearChips();
        meMsg(brief.features.length ? brief.features.join(', ') : 'Keep it simple');
        proceed(`${brief.features.length ? `<b>${brief.features.length} must-haves</b> locked in.` : `Lean and simple — respect.`}`);
      });
      row.appendChild(done);
    }
    body.appendChild(row);
    scroll();
  }
  function clearChips() { document.getElementById('active-chips')?.remove(); }
  function scroll() { body.scrollTop = body.scrollHeight; }

  function typingThen(fn, delay = 600) {
    const t = document.createElement('div');
    t.className = 'msg ai';
    t.innerHTML = `<span class="av">${AI_AV}</span><div class="bubble typing"><i></i><i></i><i></i></div>`;
    body.appendChild(t);
    scroll();
    setTimeout(() => { t.remove(); fn(); }, delay + Math.random() * 350);
  }

  /* ---------------- brief panel ---------------- */
  function assetsSummary() {
    const a = brief.assets;
    const bits = [];
    if (a.logo) bits.push('logo ✓');
    if (a.photos.length) bits.push(`${a.photos.length} photo${a.photos.length > 1 ? 's' : ''}`);
    if (a.flyer) bits.push('flyer ✓');
    if (a.videos.length) bits.push(`${a.videos.length} video${a.videos.length > 1 ? 's' : ''}`);
    if (a.links.length) bits.push(`${a.links.length} link${a.links.length > 1 ? 's' : ''}`);
    return bits.join(' · ');
  }
  function renderBrief() {
    const el = document.getElementById('brief-body');
    el.innerHTML = SLOTS.filter(s => s !== 'name' && s !== 'contact').map(s => {
      const v = s === 'features' ? (brief.features.length ? brief.features.join(' · ') : '')
        : s === 'assets' ? (brief.assetsDone ? (assetsSummary() || 'Sending later') : '')
        : brief[s];
      return `<div class="brief-row ${v ? 'filled' : ''}">
        <span class="bk">${LABELS[s]}</span>
        <span class="bv ${v ? '' : 'empty'}">${v ? esc(v) : '—'}</span>
      </div>`;
    }).join('');
    document.getElementById('brief-count').textContent = `${answered()}/${SLOTS.length}`;
    document.getElementById('chat-progress').textContent = finished ? 'BRIEF COMPLETE' : `${Math.min(answered() + 1, SLOTS.length)} OF ${SLOTS.length}`;
  }

  /* ---------------- flow ---------------- */
  function ask(slot) {
    asking = slot;
    featureMode = !!Q[slot].multi;
    renderBrief();
    if (slot === 'assets') return askAssets();
    typingThen(() => {
      aiMsg(Q[slot].prompt());
      chipsRow(Q[slot].chips(), { multi: featureMode, preselected: featureMode ? Q[slot].preselect() : [] });
      input.placeholder = slot === 'name' ? 'Your name…'
        : slot === 'contact' ? 'Email, phone or @handle…'
        : slot === 'website' ? 'Paste your link here…'
        : 'Type your answer…';
    });
  }

  function proceed(ackHtml) {
    renderBrief();
    const nxt = nextSlot();
    if (!nxt) return summarise(ackHtml);
    if (ackHtml) typingThen(() => { aiMsg(ackHtml); ask(nxt); }, 350);
    else ask(nxt);
  }

  function handleAnswer(text, fromChip = false) {
    if (finished) { meMsg(text); typingThen(() => aiMsg(`Your brief is already on its way to being legendary — hit one of the buttons above to send it, or <b>tweak something</b> first.`)); return; }
    if (asking === 'assets') return handleAssetsText(text);
    clearChips();
    meMsg(text);

    const slot = asking;

    // "teach me" moment — show how, then re-ask without consuming the answer
    if (slot === 'website' && text === HOW_COPY_LINK) {
      typingThen(() => {
        aiMsg(`Easy — here's the 10-second version. 📱 <b>On your phone:</b> open your website or Instagram page, tap the <b>address bar at the very top</b> (or on Instagram tap <b>⋯ → Share → Copy link</b>), choose <b>Copy</b>, come back here, hold your finger in the box below and tap <b>Paste</b>. 💻 <b>On a computer:</b> click the address bar at the top, press <b>Ctrl+C</b> (or <b>⌘+C</b> on Mac), come back and press <b>Ctrl+V</b>. That's it — paste it whenever you're ready.`);
        chipsRow(['No website yet', 'Skip this']);
        input.placeholder = 'Paste your link here…';
      });
      return;
    }

    const found = extract(text);

    // slot-specific handling
    if (slot === 'type') {
      brief.type = fromChip && text !== 'Not sure yet' ? text : (found.type || (text === 'Not sure yet' ? 'Not sure yet — open to ideas' : text.length < 40 ? text : found.type || 'Custom build'));
    } else if (slot === 'business') {
      brief.business = fromChip && text !== 'Something else' ? text : (found.business || text);
    } else if (slot === 'goal') {
      brief.goal = fromChip ? text : (GOAL_MAP.find(([re]) => re.test(text))?.[1] ? text : text);
      if (!fromChip) brief.goal = text;
    } else if (slot === 'vibe') {
      brief.vibe = text;
    } else if (slot === 'website') {
      if (text === 'No website yet' || text === 'Skip this' || /^(no|nah|nope|none|nothing|not yet|don'?t have|we don'?t|i don'?t)/i.test(text.trim())) {
        brief.website = 'None yet';
      } else {
        const m = text.match(URL_RE);
        brief.website = m ? cleanUrl(m[1].startsWith('http') ? m[1] : 'https://' + m[1]) : text;
      }
    } else if (slot === 'timeline') {
      brief.timeline = fromChip ? text : (found.timeline || text);
    } else if (slot === 'budget') {
      brief.budget = text === 'Skip this' ? 'To be discussed' : (found.budget || text);
    } else if (slot === 'name') {
      brief.name = text.replace(/^(i'?m|my name is|it'?s)\s+/i, '').trim() || text;
    } else if (slot === 'contact') {
      const ok = /\S+@\S+\.\S+/.test(text) || /@[\w.]{2,}/.test(text) || /\d{6,}/.test(text.replace(/[\s-]/g, ''));
      if (!ok && !contactNudged) {
        contactNudged = true;
        typingThen(() => {
          aiMsg(`Hmm, that doesn't look like an email, phone number or @handle — mind double-checking? It's the only way I can get your plan back to you.`);
          input.placeholder = 'Email, phone or @handle…';
        });
        return;
      }
      brief.contact = text;
    } else if (slot === 'features' && !fromChip) {
      // free-typed during feature step: extract + treat as done-adder
      const f = extract(text);
      if (f.features) brief.features.push(...f.features);
    }

    // cross-slot extraction from free text (the "listening" part) —
    // never re-announce the slot that was just answered directly
    delete found[slot];
    // never mine a pasted URL for keywords — "facebook.com" is not a booking request
    const notes = (fromChip || slot === 'website') ? [] : applyFound(found);
    save();

    // acknowledgment
    let ack = '';
    if (slot === 'type') ack = brief.type.startsWith('Not sure') ? `All good — that's literally what I'm here for. Let's work it out together.` : `<b>${esc(brief.type)}</b> — right in our lane.`;
    if (slot === 'business') ack = pickAck(brief.business);
    if (slot === 'goal') ack = `Got it — the mission is “<b>${esc(brief.goal)}</b>”. Everything else gets designed around that.`;
    if (slot === 'vibe') ack = `Noted: <b>${esc(shorten(brief.vibe, 60))}</b>. I can already see it.`;
    if (slot === 'website') ack = brief.website === 'None yet'
      ? `No stress — building that is literally what we're here for.`
      : `Perfect — I'll study <b>${esc(shorten(brief.website, 50))}</b> before we even talk. Anything good on there comes with us; anything dated gets left behind.`;
    if (slot === 'timeline') ack = brief.timeline === 'Just exploring' ? `No rush then — exploring is the right way to start.` : `<b>${esc(brief.timeline)}</b> — we build fast, that works.`;
    if (slot === 'budget') ack = brief.budget === 'To be discussed' ? `No stress — we'll scope it honestly when we talk.`
      : brief.budget === 'Free starter' ? `Free starter it is — and I mean it, you'll still walk away with something real. 🤝`
      : `Good to know — I'll shape the recommendation to fit.`;
    if (slot === 'name') ack = `Good to meet you, <b>${esc(firstName())}</b>.`;
    if (slot === 'contact') ack = '';
    if (notes.length && slot !== 'features') ack += ` I also caught ${notes.join(', ')} in there — saved you the extra questions.`;

    proceed(ack || null);
  }

  const ACKS = {
    'Gym / fitness': `A fitness business — we've built for gyms and coaches before, so I know exactly where the bodies are buried.`,
    'Café / food': `Food business — menus, orders, counter screens… we've done the groundwork here before. Literally.`,
    'Trades': `A trades business — quote-ready, mobile-first, built for people who find you from a ute at a job site.`,
    'Sports / community': `Sports and community — ladders, teams, registrations. One of our favourite lanes.`,
    'Professional services': `Professional services — clean, trustworthy, built to convert enquiries.`,
    'Retail / shop': `Retail — let's make the shopfront work as hard online as it does on the street.`,
  };
  const pickAck = b => ACKS[b] || `<b>${esc(b)}</b> — understood.`;
  const shorten = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;

  /* ============================================================
     MATERIALS STEP — the instant-website part.
     Logo + up to 30 captioned work photos + flyer + videos,
     uploaded straight to studio storage while they finish the
     brief. Big videos go in as pasted links instead.
     ============================================================ */
  function askAssets() {
    typingThen(() => {
      aiMsg(`Last step, ${esc(firstName())} — and it's the shortcut. Send your materials now and <b>we start building your site in the background</b> before we've even spoken. Aim for <b>5–10 photos</b> (up to 30) — one for each thing that matters: your services, your space, your team, your best work. Got videos or a Google Drive folder? <b>Paste the link</b> in the chat box below. Don't have it all handy? Send anything — or skip and DM the rest later.`);
      renderUploadCard();
      input.placeholder = 'Paste a video / Drive link here…';
    });
  }

  function renderUploadCard() {
    document.getElementById('up-card')?.remove();
    body.insertAdjacentHTML('beforeend', `
      <div class="up-card" id="up-card">
        <div class="bc-title">YOUR MATERIALS — WE BUILD WHILE YOU WAIT</div>
        <div class="up-row"><button class="up-btn" id="pick-logo" type="button">＋ YOUR LOGO</button><span class="up-hint">the one on your shopfront, card or Insta</span></div>
        <div class="up-row"><button class="up-btn" id="pick-photos" type="button">＋ PHOTOS OF YOUR WORK</button><span class="up-hint">5–10 is perfect · up to ${MAX_PHOTOS} · add a caption to each</span></div>
        <div class="up-row"><button class="up-btn" id="pick-flyer" type="button">＋ FLYER / MENU / PRICE LIST</button><span class="up-hint">photo or PDF — whatever you hand to customers now</span></div>
        <div class="up-row"><button class="up-btn" id="pick-videos" type="button">＋ VIDEOS</button><span class="up-hint">up to ${MAX_VIDEOS}, max ${MAX_VIDEO_MB}MB each — bigger ones: paste a link in the chat</span></div>
        <div class="up-thumbs" id="up-thumbs"></div>
        <div class="up-links mono" id="up-links"></div>
        <div class="up-progress" id="up-progress" hidden>
          <div class="up-bar"><i id="up-bar-fill"></i></div>
          <span class="mono" id="up-progress-text"></span>
        </div>
        <div class="final-actions">
          <button class="act-btn primary" id="up-finish" type="button">✓ SEND MY MATERIALS</button>
          <button class="act-btn" id="up-skip" type="button">SKIP — I'LL SEND LATER</button>
        </div>
        <input type="file" id="f-logo" accept="image/*" hidden>
        <input type="file" id="f-photos" accept="image/*" multiple hidden>
        <input type="file" id="f-flyer" accept="image/*,application/pdf" hidden>
        <input type="file" id="f-videos" accept="video/*" multiple hidden>
      </div>`);
    scroll();

    const $ = id => document.getElementById(id);
    $('pick-logo').addEventListener('click', () => $('f-logo').click());
    $('pick-photos').addEventListener('click', () => $('f-photos').click());
    $('pick-flyer').addEventListener('click', () => $('f-flyer').click());
    $('pick-videos').addEventListener('click', () => $('f-videos').click());

    const sizeOk = f => f.size <= MAX_VIDEO_MB * 1024 * 1024 ? true : (aiMsg(`<b>${esc(f.name)}</b> is over ${MAX_VIDEO_MB}MB — upload it to Google Drive and <b>paste the share link</b> in the chat instead.`), false);
    $('f-logo').addEventListener('change', e => { const f = e.target.files[0]; if (f && sizeOk(f)) { pending.logo = f; renderThumbs(); } e.target.value = ''; });
    $('f-flyer').addEventListener('change', e => { const f = e.target.files[0]; if (f && sizeOk(f)) { pending.flyer = f; renderThumbs(); } e.target.value = ''; });
    $('f-photos').addEventListener('change', e => {
      const room = MAX_PHOTOS - pending.photos.length - brief.assets.photos.length;
      const picked = [...e.target.files].filter(sizeOk);
      if (room <= 0 && picked.length) {
        aiMsg(`You're at the <b>${MAX_PHOTOS}-photo limit</b> — remove one first (tap ×) or paste a Drive link for the rest.`);
      } else {
        const files = picked.slice(0, Math.max(0, room));
        files.forEach(f => pending.photos.push({ file: f, caption: '' }));
        if (picked.length > files.length) aiMsg(`I can take up to <b>${MAX_PHOTOS} photos</b> — kept the first ${files.length}.`);
      }
      renderThumbs();
      e.target.value = '';
    });
    $('f-videos').addEventListener('change', e => {
      for (const f of [...e.target.files]) {
        if (pending.videos.length + brief.assets.videos.length >= MAX_VIDEOS) { aiMsg(`Up to <b>${MAX_VIDEOS} videos</b> here — for more, paste a Drive link in the chat.`); break; }
        if (f.size > MAX_VIDEO_MB * 1024 * 1024) { aiMsg(`<b>${esc(f.name)}</b> is over ${MAX_VIDEO_MB}MB — upload it to Google Drive or Dropbox and <b>paste the share link</b> in the chat box instead.`); continue; }
        pending.videos.push(f);
      }
      renderThumbs();
      e.target.value = '';
    });

    $('up-finish').addEventListener('click', uploadAll);
    $('up-skip').addEventListener('click', () => {
      if (uploading) return;
      brief.assetsDone = true;
      save();
      document.getElementById('up-card')?.remove();
      meMsg(`I'll send my stuff later`);
      proceed(`All good — DM everything to <b>@studiogroundworks</b> whenever you're ready, or bring it to the call. The brief still goes through in full. 🤝`);
    });
    renderThumbs();
    renderLinks();
  }

  function renderThumbs() {
    const el = document.getElementById('up-thumbs');
    if (!el) return;
    let h = '';
    const donePhotos = brief.assets.photos.length;
    if (pending.logo || brief.assets.logo) h += `<div class="up-item"><span class="up-kind mono">LOGO</span><span class="up-name">${esc(pending.logo ? pending.logo.name : 'uploaded ✓')}</span>${pending.logo ? `<button class="up-x" data-rm="logo" type="button">×</button>` : ''}</div>`;
    pending.photos.forEach((p, i) => {
      h += `<div class="up-item photo"><span class="up-kind mono">PHOTO ${donePhotos + i + 1}</span><span class="up-name">${esc(p.file.name)}</span>
        <input class="up-cap" data-cap="${i}" placeholder="What's this showing? e.g. 'Our best deck build'" value="${esc(p.caption)}" maxlength="120">
        <button class="up-x" data-rm="photo-${i}" type="button">×</button></div>`;
    });
    if (donePhotos && !pending.photos.length) h += `<div class="up-item"><span class="up-kind mono">PHOTOS</span><span class="up-name">${donePhotos} uploaded ✓</span></div>`;
    if (pending.flyer || brief.assets.flyer) h += `<div class="up-item"><span class="up-kind mono">FLYER</span><span class="up-name">${esc(pending.flyer ? pending.flyer.name : 'uploaded ✓')}</span>${pending.flyer ? `<button class="up-x" data-rm="flyer" type="button">×</button>` : ''}</div>`;
    pending.videos.forEach((v, i) => {
      h += `<div class="up-item"><span class="up-kind mono">VIDEO ${brief.assets.videos.length + i + 1}</span><span class="up-name">${esc(v.name)}</span><button class="up-x" data-rm="video-${i}" type="button">×</button></div>`;
    });
    el.innerHTML = h;
    el.querySelectorAll('.up-x').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.rm;
      if (k === 'logo') pending.logo = null;
      else if (k === 'flyer') pending.flyer = null;
      else if (k.startsWith('photo-')) pending.photos.splice(+k.slice(6), 1);
      else if (k.startsWith('video-')) pending.videos.splice(+k.slice(6), 1);
      renderThumbs();
    }));
    el.querySelectorAll('.up-cap').forEach(inp => inp.addEventListener('input', () => { pending.photos[+inp.dataset.cap].caption = inp.value; }));
    scroll();
  }

  function renderLinks() {
    const el = document.getElementById('up-links');
    if (!el) return;
    el.innerHTML = brief.assets.links.map((l, i) => `🔗 ${esc(shorten(l, 60))} <button class="up-x" data-lrm="${i}" type="button">×</button>`).join('<br>');
    el.querySelectorAll('[data-lrm]').forEach(b => b.addEventListener('click', () => {
      brief.assets.links.splice(+b.dataset.lrm, 1);
      save(); renderLinks(); renderBrief();
    }));
  }

  function handleAssetsText(text) {
    meMsg(text);
    const t = text.trim();
    if (/^(skip|later|not now|no thanks|nothing|nah|no)\b/i.test(t)) {
      brief.assetsDone = true;
      save();
      document.getElementById('up-card')?.remove();
      proceed(`All good — DM everything to <b>@studiogroundworks</b> whenever you're ready, or bring it to the call. The brief still goes through in full. 🤝`);
      return;
    }
    if (/^(done|finish|finished|send|that'?s (all|everything))\b/i.test(t) && document.getElementById('up-card')) {
      uploadAll();
      return;
    }
    const m = text.match(URL_RE);
    if (m) {
      const url = cleanUrl(m[1].startsWith('http') ? m[1] : 'https://' + m[1]);
      brief.assets.links.push(url);
      save();
      renderLinks();
      renderBrief();
      typingThen(() => aiMsg(`Link saved ✓ — I'll grab everything from there. (Not a link? Tap the <b>×</b> next to it to remove it.) Add more, keep uploading, or hit <b>✓ send my materials</b> when you're done.`), 300);
    } else {
      typingThen(() => aiMsg(`Use the <b>＋ buttons</b> in the card above to attach your files, paste a <b>link</b> (Google Drive, Dropbox, YouTube) right here — or tap <b>✓ SEND MY MATERIALS</b> / <b>SKIP</b> when you're done. Not sure how to get a Drive link? Open the Drive app → tap <b>⋯</b> on your folder → <b>Share → Copy link</b> (set to “anyone with the link”), then paste it here.`), 300);
    }
  }

  /* ---- image squeeze: keeps uploads quick on mobile data ---- */
  function compressImage(file, maxDim = 1600, quality = 0.82) {
    return new Promise(resolve => {
      if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) return resolve(file); // heic/gif/pdf: send as-is
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        if (scale === 1 && file.size < 900 * 1024) return resolve(file);
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        // png/webp may carry transparency — jpeg would flatten it to black
        const outType = /png|webp/i.test(file.type) ? 'image/png' : 'image/jpeg';
        c.toBlob(b => resolve(b && b.size < file.size ? b : file), outType, quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  const extOf = (file, fallback) => {
    const m = file.name.match(/\.([a-z0-9]{2,5})$/i);
    return m ? m[1].toLowerCase() : fallback;
  };

  async function putFile(path, blob, contentType) {
    const r = await fetch(`${SUPA_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${SUPA_KEY}`, apikey: SUPA_KEY, 'content-type': contentType || 'application/octet-stream' },
      body: blob,
    });
    if (!r.ok) throw new Error('upload ' + r.status);
    return `${SUPA_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  }

  async function uploadAll() {
    if (uploading) return;
    const card = document.getElementById('up-card');
    if (!card) return;
    const total = (pending.logo ? 1 : 0) + pending.photos.length + (pending.flyer ? 1 : 0) + pending.videos.length;
    const a = brief.assets;
    if (!total) {
      if (a.links.length || a.photos.length || a.logo || a.flyer || a.videos.length) {
        // nothing new to upload but earlier materials/links exist — just finish
        brief.assetsDone = true;
        save();
        card.remove();
        meMsg(assetsSummary() || 'Materials sent');
        proceed(finishAck());
        return;
      }
      aiMsg(`Nothing attached yet — tap a <b>＋ button</b> to add files, paste a link, or hit <b>skip</b> and send them later.`);
      return;
    }

    uploading = true;
    card.classList.add('busy'); // freezes ＋ / × / caption inputs so the queue can't shift mid-send
    const fin = document.getElementById('up-finish');
    const prog = document.getElementById('up-progress');
    const fill = document.getElementById('up-bar-fill');
    const ptxt = document.getElementById('up-progress-text');
    fin.disabled = true;
    fin.textContent = 'SENDING…';
    prog.hidden = false;

    // folders stay unguessable-ish: name + random tag
    if (!brief.assetsFolder) {
      brief.assetsFolder = `${slug(brief.name)}-${Math.random().toString(36).slice(2, 8)}`;
      save();
    }
    const folder = brief.assetsFolder;
    let done = 0, failed = 0;
    const now = label => { ptxt.textContent = `sending ${label}…`; scroll(); };
    const tick = () => {
      done++;
      fill.style.width = `${Math.round((done / total) * 100)}%`;
      ptxt.textContent = `${done}/${total} sent`;
    };
    const tag = () => Math.random().toString(36).slice(2, 6);
    const extFor = (b, orig) => b === orig ? extOf(orig, 'jpg') : (b.type === 'image/png' ? 'png' : 'jpg');

    if (pending.logo) {
      now('logo');
      try {
        const b = await compressImage(pending.logo, 1200, 0.9);
        a.logo = await putFile(`${folder}/logo-${tag()}.${extFor(b, pending.logo)}`, b, b.type || pending.logo.type);
        pending.logo = null;
        save();
      } catch (e) { failed++; }
      tick();
    }
    const photoFails = [];
    const startN = a.photos.length;
    let sent = 0;
    const queue = pending.photos.slice();
    for (const p of queue) {
      now(`photo ${sent + photoFails.length + 1} of ${queue.length}`);
      try {
        const b = await compressImage(p.file);
        const url = await putFile(`${folder}/photos/photo-${startN + sent + 1}-${tag()}.${extFor(b, p.file)}`, b, b.type || p.file.type);
        a.photos.push({ url, caption: p.caption.trim() });
        sent++;
        save();
      } catch (e) { failed++; photoFails.push(p); }
      tick();
    }
    pending.photos = photoFails;
    if (pending.flyer) {
      now('flyer');
      try {
        const isPdf = pending.flyer.type === 'application/pdf';
        const b = isPdf ? pending.flyer : await compressImage(pending.flyer, 2000, 0.85);
        a.flyer = await putFile(`${folder}/flyer-${tag()}.${isPdf ? 'pdf' : extFor(b, pending.flyer)}`, b, b.type || pending.flyer.type);
        pending.flyer = null;
        save();
      } catch (e) { failed++; }
      tick();
    }
    const videoFails = [];
    for (const v of pending.videos.slice()) {
      now(`video — this can take a few minutes on mobile data`);
      try {
        a.videos.push(await putFile(`${folder}/videos/video-${a.videos.length + 1}-${tag()}.${extOf(v, 'mp4')}`, v, v.type));
        save();
      } catch (e) { failed++; videoFails.push(v); }
      tick();
    }
    pending.videos = videoFails;

    uploading = false;
    card.classList.remove('busy');

    if (failed === total) {
      // nothing made it — keep the card and files so one tap retries
      fin.disabled = false;
      fin.textContent = '↻ TRY AGAIN';
      prog.hidden = true;
      aiMsg(`Hmm — the connection dropped and <b>nothing made it through</b>. Your files are still attached: check your internet and tap <b>↻ try again</b>, or skip and DM them later.`);
      return;
    }

    brief.assetsDone = true;
    save();
    card.remove();
    meMsg(assetsSummary() || 'Materials sent');
    const oops = failed ? ` (${failed} file${failed > 1 ? 's' : ''} didn't make it — no drama, DM those to <b>@studiogroundworks</b>)` : '';
    proceed(finishAck() + oops);
  }

  const finishAck = () => `📦 Got it all — <b>${assetsSummary() || 'your materials'}</b> landed in the studio. This is the part where it gets real: your site starts taking shape from these <b>before we've even talked</b>.`;

  /* ---------------- summary + send ---------------- */
  function briefText() {
    const a = brief.assets;
    const lines = [
      `NEW PROJECT ENQUIRY — Groundwork Labs`,
      ``,
      `Name: ${brief.name}`,
      `Contact: ${brief.contact}`,
      `Project: ${brief.type}`,
      `Business: ${brief.business}`,
      `Main goal: ${brief.goal}`,
      `Must-haves: ${brief.features.join(', ') || '—'}`,
      `Look & feel: ${brief.vibe}`,
      `Current website: ${brief.website || '—'}`,
      `Timeline: ${brief.timeline}`,
      `Budget: ${brief.budget}`,
      `Materials: ${assetsSummary() || 'to be sent later'}${brief.assetsFolder ? ` (storage folder: ${brief.assetsFolder})` : ''}`,
    ];
    if (a.logo) lines.push(``, `LOGO: ${a.logo}`);
    if (a.photos.length) {
      lines.push(``, `PHOTOS:`);
      a.photos.forEach((p, i) => lines.push(`${i + 1}. ${p.url}${p.caption ? ` — "${p.caption}"` : ''}`));
    }
    if (a.flyer) lines.push(``, `FLYER: ${a.flyer}`);
    if (a.videos.length) { lines.push(``, `VIDEOS:`); a.videos.forEach(v => lines.push(v)); }
    if (a.links.length) { lines.push(``, `LINKS:`); a.links.forEach(l => lines.push(l)); }
    lines.push(``, `— sent from the Groundwork Architect`);
    return lines.join('\n');
  }

  function summarise(ackHtml) {
    finished = true;
    renderBrief();
    typingThen(() => {
      if (ackHtml) aiMsg(ackHtml);
      aiMsg(`That's everything I need, ${esc(firstName())}. Here's your project as I understand it — <b>did I nail it?</b> Send it and you've booked a <b>free 15-minute call</b> with the studio.`);
      const rows = [['Project', brief.type], ['Business', brief.business], ['Main goal', brief.goal],
        ['Must-haves', brief.features.join(' · ') || '—'], ['Look & feel', brief.vibe],
        ['Current website', brief.website || '—'],
        ['Timeline', brief.timeline], ['Budget', brief.budget],
        ['Materials', assetsSummary() || 'Sending later'],
        ['Contact', `${brief.name} — ${brief.contact}`]];
      body.insertAdjacentHTML('beforeend', `<div class="brief-card">
        <div class="bc-title">PROJECT BRIEF — ${esc((brief.name || '').toUpperCase())}</div>
        ${rows.map(([k, v]) => `<div class="brief-row filled"><span class="bk">${k}</span><span class="bv">${esc(v)}</span></div>`).join('')}
        <div class="final-actions">
          <button class="act-btn primary" id="send-email">➤ SEND TO GROUNDWORK</button>
          <button class="act-btn" id="book-call">📞 BOOK YOUR FREE CALL</button>
          <button class="act-btn" id="send-ig">COPY + DM ON INSTAGRAM</button>
          <button class="act-btn" id="tweak">✎ TWEAK SOMETHING</button>
        </div>
      </div>`);
      scroll();
      document.getElementById('send-email').addEventListener('click', function () {
        const btn = this;
        btn.disabled = true;
        btn.textContent = 'SENDING…';
        // file the brief into the studio inbox as well (fire-and-forget)
        fetch(`${SUPA_URL}/rest/v1/briefs`, {
          method: 'POST',
          headers: { apikey: SUPA_KEY, authorization: `Bearer ${SUPA_KEY}`, 'content-type': 'application/json', prefer: 'return=minimal' },
          body: JSON.stringify({ data: brief, text: briefText() }),
        }).catch(() => {});
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            'form-name': 'project-brief',
            name: brief.name, contact: brief.contact, project: brief.type,
            business: brief.business, goal: brief.goal,
            features: brief.features.join(', ') || '—', vibe: brief.vibe,
            website: brief.website || '—',
            uploads: assetsSummary() || '—',
            timeline: brief.timeline, budget: brief.budget, brief: briefText(),
          }).toString(),
        }).then(r => {
          if (!r.ok) throw new Error('form ' + r.status);
          btn.textContent = 'SENT ✓';
          typingThen(() => aiMsg(`🎉 Congratulations, ${esc(firstName())} — your brief${brief.assets.photos.length || brief.assets.logo ? ' and your materials are' : ' is'} in, and you've earned a <b>free 15-minute call</b> with Groundwork Labs. Want to lock in your time right now? <a href="${CAL_URL}" target="_blank" rel="noopener" style="color:var(--ochre);font-weight:700;text-decoration:underline">Pick a slot here</a> — otherwise we'll reach you at <b>${esc(brief.contact)}</b> within <b>24 hours</b>. Come with questions — leave with a plan. 🤝`), 400);
        }).catch(() => {
          // graceful fallback: open the visitor's email app instead
          btn.disabled = false;
          btn.textContent = '➤ SEND TO GROUNDWORK';
          // mailto bodies truncate near ~2000 chars — drop the file URLs (files are
          // already safe in storage; the folder name is enough to find them)
          let bodyTxt = briefText();
          if (bodyTxt.length > 1400) {
            bodyTxt = bodyTxt.split('\n')
              .filter(l => !/^https?:/.test(l) && !/^\d+\. /.test(l) && !/^(LOGO|FLYER|PHOTOS|VIDEOS|LINKS):/.test(l))
              .join('\n');
          }
          location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`New project: ${brief.type} for ${brief.business} — ${brief.name}`)}&body=${encodeURIComponent(bodyTxt)}`;
          typingThen(() => aiMsg(`Direct send hit a snag, so I've opened your email app with the brief ready to go — just hit send there. 🤝`), 400);
        });
      });
      document.getElementById('book-call').addEventListener('click', () => {
        window.open(CAL_URL, '_blank');
        typingThen(() => aiMsg(`🎉 Congratulations on your <b>15-minute call with Groundwork Labs</b>, ${esc(firstName())}! Pick whatever time suits you in the calendar I just opened — you'll get a confirmation email with your exact day and time, and we'll call you then. Nothing to prepare; just bring the vision. 📞`), 350);
      });
      document.getElementById('send-ig').addEventListener('click', () => {
        const finish = () => {
          window.open(IG_URL, '_blank');
          typingThen(() => aiMsg(`Brief copied ✓ — paste it into a DM at <b>@studiogroundworks</b> and we'll take it from there.`), 300);
        };
        if (navigator.clipboard?.writeText) navigator.clipboard.writeText(briefText()).then(finish, finish);
        else finish();
      });
      document.getElementById('tweak').addEventListener('click', () => {
        finished = false;
        asking = null; // typed text must not fall into the assets handler
        aiMsg(`No problem — what should we change?`);
        chipsRow(SLOTS.map(s => LABELS[s]), {
          onPick(label) {
            const slot = SLOTS.find(s => LABELS[s] === label);
            if (slot === 'features') { brief.features = []; brief.featuresDone = false; }
            else if (slot === 'assets') { brief.assetsDone = false; }
            else brief[slot] = null;
            if (slot === 'contact') contactNudged = false;
            save();
            clearChips();
            ask(slot);
          },
        });
      });
    }, 500);
  }

  /* ---------------- input wiring ---------------- */
  function submit() {
    const v = input.value.trim();
    if (!v) return;
    input.value = '';
    if (featureMode && asking === 'features') {
      // free text during multi-select: extract and confirm
      const picked = [...(document.querySelectorAll('#active-chips .chip.sel') || [])].map(b => b.textContent);
      brief.features = [...new Set([...brief.features, ...picked])];
      const f = extract(v);
      if (f.features) brief.features = [...new Set([...brief.features, ...f.features])];
      brief.featuresDone = true;
      save();
      clearChips();
      meMsg(v);
      proceed(`Locked in.`);
      return;
    }
    handleAnswer(v, false);
  }
  send.addEventListener('click', submit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });

  document.getElementById('hero-start').addEventListener('click', () => setTimeout(() => input.focus(), 600));

  /* ---------------- boot ---------------- */
  renderBrief();
  const returning = answered() > 0;
  typingThen(() => {
    aiMsg(returning
      ? `Welcome back — I kept your answers. Let's pick up where we left off.`
      : `Hey — I'm the <b>Groundwork Architect</b>. Tell me what you're imagining and I'll turn it into a proper project brief for the studio. Takes about two minutes, you can answer in your own words — and at the end you can <b>drop in your logo, photos and flyer</b> so we start building while you wait.`);
    const nxt = nextSlot();
    if (nxt) ask(nxt); else summarise(null);
  }, 500);
})();
