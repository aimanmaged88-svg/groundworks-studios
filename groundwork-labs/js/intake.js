/* ============================================================
   GROUNDWORK ARCHITECT — guided project intake
   Listens in plain English, extracts what it can, reflects its
   understanding back, and only asks what's still missing.
   Runs fully in the browser; nothing is sent until the visitor
   chooses email or Instagram at the end.
   ============================================================ */

(() => {
  const IG_URL = 'https://instagram.com/studiogroundworks';
  const CAL_URL = 'https://cal.com/aiman-m-clwrda/15min';
  const EMAIL = 'aimanmaged88@gmail.com';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  /* ---------------- state ---------------- */
  const SLOTS = ['type', 'business', 'goal', 'features', 'vibe', 'timeline', 'budget', 'name', 'contact'];
  const LABELS = {
    type: 'Project', business: 'Business', goal: 'Main goal', features: 'Must-haves',
    vibe: 'Look & feel', timeline: 'Timeline', budget: 'Budget', name: 'Name', contact: 'Contact',
  };
  let brief = load() || { features: [] };
  let asking = null;          // slot currently being asked
  let featureMode = false;    // multi-select in progress
  let contactNudged = false;
  let finished = false;

  function save() { try { sessionStorage.setItem('gw-brief', JSON.stringify(brief)); } catch (e) {} }
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
        const pre = sug.filter(s => !brief.features.includes(s));
        return `Based on what you've told me, I'd usually include <b>${sug.join(', ').toLowerCase()}</b> in a build like this. Tap anything you want — add or remove — then hit <b>that's everything</b>.` + (pre.length ? '' : '');
      },
      multi: true,
      chips: () => ALL_FEATURES,
      preselect: () => (SUGGEST_BY_TYPE[brief.type] || []).filter(Boolean),
    },
    vibe: {
      prompt: () => `Now the fun part — describe the <b>look and feel</b> you're imagining. Colours, style, anything you've seen and loved.`,
      chips: () => ['Dark & premium', 'Clean & minimal', 'Bright & friendly', 'Bold & loud', 'You decide — surprise me'],
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
      prompt: () => `Nearly there — this takes two more answers. What's your <b>name</b>?`,
      chips: () => null,
    },
    contact: {
      prompt: () => `And the best way to reach you, ${esc(firstName())} — <b>email, phone, or Instagram @handle</b>?`,
      chips: () => null,
    },
  };

  const firstName = () => (brief.name || '').split(/\s+/)[0] || 'legend';
  const answered = () => SLOTS.filter(s => s === 'features' ? brief.features.length : brief[s]).length;
  function nextSlot() {
    for (const s of SLOTS) {
      if (s === 'features' ? !brief.featuresDone : !brief[s]) return s;
    }
    return null;
  }

  /* ---------------- chat UI ---------------- */
  const body = document.getElementById('chat-body');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');

  const AI_AV = `<svg viewBox="0 0 122 122" xmlns="http://www.w3.org/2000/svg"><g fill="#F2EFEA"><rect x="31.3" y="0" width="28" height="28"/><rect x="62.6" y="0" width="28" height="28"/><rect x="94" y="0" width="28" height="28"/><rect x="62.6" y="62.6" width="28" height="28"/><rect x="94" y="62.6" width="28" height="28"/></g><g fill="#E8A33D"><rect x="0" y="0" width="28" height="28"/><rect x="0" y="31.3" width="28" height="28"/><rect x="0" y="62.6" width="28" height="28"/><rect x="0" y="94" width="28" height="28"/><rect x="31.3" y="94" width="28" height="28"/><rect x="62.6" y="94" width="28" height="28"/><rect x="94" y="94" width="28" height="28"/></g></svg>`;

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
  function renderBrief() {
    const el = document.getElementById('brief-body');
    el.innerHTML = SLOTS.filter(s => s !== 'name' && s !== 'contact').map(s => {
      const v = s === 'features' ? (brief.features.length ? brief.features.join(' · ') : '') : brief[s];
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
    typingThen(() => {
      aiMsg(Q[slot].prompt());
      chipsRow(Q[slot].chips(), { multi: featureMode, preselected: featureMode ? Q[slot].preselect() : [] });
      input.placeholder = slot === 'name' ? 'Your name…' : slot === 'contact' ? 'Email, phone or @handle…' : 'Type your answer…';
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
    clearChips();
    meMsg(text);

    const slot = asking;
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
    const notes = fromChip ? [] : applyFound(found);
    save();

    // acknowledgment
    let ack = '';
    if (slot === 'type') ack = brief.type.startsWith('Not sure') ? `All good — that's literally what I'm here for. Let's work it out together.` : `<b>${esc(brief.type)}</b> — right in our lane.`;
    if (slot === 'business') ack = pickAck(brief.business);
    if (slot === 'goal') ack = `Got it — the mission is “<b>${esc(brief.goal)}</b>”. Everything else gets designed around that.`;
    if (slot === 'vibe') ack = `Noted: <b>${esc(shorten(brief.vibe, 60))}</b>. I can already see it.`;
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

  /* ---------------- summary + send ---------------- */
  function briefText() {
    return [
      `NEW PROJECT ENQUIRY — Groundwork Labs`,
      ``,
      `Name: ${brief.name}`,
      `Contact: ${brief.contact}`,
      `Project: ${brief.type}`,
      `Business: ${brief.business}`,
      `Main goal: ${brief.goal}`,
      `Must-haves: ${brief.features.join(', ') || '—'}`,
      `Look & feel: ${brief.vibe}`,
      `Timeline: ${brief.timeline}`,
      `Budget: ${brief.budget}`,
      ``,
      `— sent from the Groundwork Architect`,
    ].join('\n');
  }

  function summarise(ackHtml) {
    finished = true;
    renderBrief();
    typingThen(() => {
      if (ackHtml) aiMsg(ackHtml);
      aiMsg(`That's everything I need, ${esc(firstName())}. Here's your project as I understand it — <b>did I nail it?</b> Send it and you've booked a <b>free 15-minute call</b> with the studio.`);
      const rows = [['Project', brief.type], ['Business', brief.business], ['Main goal', brief.goal],
        ['Must-haves', brief.features.join(' · ') || '—'], ['Look & feel', brief.vibe],
        ['Timeline', brief.timeline], ['Budget', brief.budget], ['Contact', `${brief.name} — ${brief.contact}`]];
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
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            'form-name': 'project-brief',
            name: brief.name, contact: brief.contact, project: brief.type,
            business: brief.business, goal: brief.goal,
            features: brief.features.join(', ') || '—', vibe: brief.vibe,
            timeline: brief.timeline, budget: brief.budget, brief: briefText(),
          }).toString(),
        }).then(r => {
          if (!r.ok) throw new Error('form ' + r.status);
          btn.textContent = 'SENT ✓';
          typingThen(() => aiMsg(`🎉 Congratulations, ${esc(firstName())} — your brief is in and you've earned a <b>free 15-minute call</b> with Groundwork Labs. Want to lock in your time right now? <a href="${CAL_URL}" target="_blank" rel="noopener" style="color:var(--ochre);font-weight:700;text-decoration:underline">Pick a slot here</a> — otherwise we'll reach you at <b>${esc(brief.contact)}</b> within <b>24 hours</b>. Come with questions — leave with a plan. 🤝`), 400);
        }).catch(() => {
          // graceful fallback: open the visitor's email app instead
          btn.disabled = false;
          btn.textContent = '➤ SEND TO GROUNDWORK';
          location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`New project: ${brief.type} for ${brief.business} — ${brief.name}`)}&body=${encodeURIComponent(briefText())}`;
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
        aiMsg(`No problem — what should we change?`);
        chipsRow(SLOTS.map(s => LABELS[s]), {
          onPick(label) {
            const slot = SLOTS.find(s => LABELS[s] === label);
            if (slot === 'features') { brief.features = []; brief.featuresDone = false; }
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
      : `Hey — I'm the <b>Groundwork Architect</b>. Tell me what you're imagining and I'll turn it into a proper project brief for the studio. Takes about two minutes, and you can answer in your own words.`);
    const nxt = nextSlot();
    if (nxt) ask(nxt); else summarise(null);
  }, 500);
})();
