/* ============================================================
   Lead Finder — Groundwork Labs' lead-generation engine.
   Problem-solving sales: find local businesses with a fixable
   problem (no website, no bookings, dying site) → pitch the fix
   (landing page, website, app) → follow up until won → a win
   auto-creates the client + project so the dashboard runs on
   real work. One-to-one personalised outreach only (Spam Act safe).
   ============================================================ */

const FFOS_URL = 'https://flow-forward-os.netlify.app';

const NICHES = ['Cafés', 'Restaurants', 'Barbers', 'Beauty salons', 'Gyms / PTs', 'Physio / Allied health', 'Mechanics', 'Tutoring', 'Florists', 'Fencing', 'Landscaping', 'Plumbing', 'Electrical', 'Roofing', 'Cleaning', 'Builders', 'Real estate', 'Other'];
const TRADES = NICHES; // back-compat alias
const STAGES = ['To contact', 'Contacted', 'In talks', 'Demo sent', 'Won', 'Not now'];
const STAGE_CLS = { 'To contact': 'gold', 'Contacted': 'info', 'In talks': 'warn', 'Demo sent': 'info', 'Won': 'good', 'Not now': '' };

/* ---- what you're selling: the problem you solve, not the tech ---- */
const OFFERS = {
  'Landing page':    { blurb: 'a sharp one-page website that turns Google and Instagram visitors into calls and bookings', demo: '' },
  'Full website':    { blurb: 'a modern, mobile-first website that actually gets found on Google and brings customers in', demo: '' },
  'Booking system':  { blurb: 'online bookings so customers book themselves in while you work', demo: '' },
  'Custom app':      { blurb: 'a custom app built around the exact problem slowing the business down', demo: '' },
  'Flow Forward OS': { blurb: 'an all-in-one app that runs quoting, scheduling, invoicing and card payments', demo: FFOS_URL },
};
const OFFER_NAMES = Object.keys(OFFERS);
const offerOf = p => OFFERS[p.offer] || OFFERS['Landing page'];

/* ============================================================
   NICHE INTEL — the deep-dive playbook per industry.
   Best call windows (with the why), how these owners think,
   what to say, what to avoid, and a warm opener. Powers the
   "Call:" chip, the Playbook overlay and Schedule call.
   windows: d = weekdays (0=Sun), s/e = start/end hour (14.5 = 2:30pm)
   ============================================================ */
const TRADE_INTEL = {
  best: '7–8am or 4–5:30pm',
  windows: [{ d: [1, 2, 3, 4, 5], s: 7, e: 8 }, { d: [1, 2, 3, 4, 5], s: 16, e: 17.5 }],
  whyBest: 'Before they\'re on the tools, or knock-off when they\'re in the ute. Mid-day they\'re up a ladder — a missed call is normal, an SMS first often gets the callback.',
  world: [
    'Owner-operator: quoting at the kitchen table at 9pm, hates paperwork',
    'Work comes from word of mouth + hipages/Airtasker — and they resent the lead fees',
    'A missed call during the day is a lost job to whoever answered',
  ],
  say: [
    '“Stop paying hipages for leads — your own site brings them straight to you”',
    '“Quote from your phone in the ute, look bigger than you are”',
    'Talk jobs and money, never tech — “more quote requests” not “SEO”',
  ],
  avoid: ['Calling 9am–3:30pm (on the tools)', 'Jargon of any kind', 'Long intros — get to it in 10 seconds'],
  opener: p => `G'day ${prosFirst(p)}, Aiman here — I'll be quick 'cause I know you're flat out. ${prosProblem(p)}. I build sites for ${prosNiche(p)} businesses that turn Google searches into quote requests. Can I text you a free mock-up with your logo on it?`,
};

const NICHE_INTEL = {
  'Cafés': {
    best: 'Weekdays 2:30–4pm',
    windows: [{ d: [1, 2, 3, 4, 5], s: 14.5, e: 16 }],
    whyBest: 'After the lunch rush dies, before close-up. NEVER 7–11am — that\'s the rush and you\'ll be waved off no matter how good the pitch is.',
    world: [
      'Owner is usually behind the machine — decisions are fast and gut-feel',
      'Margins are brutal; they think in covers per day and regulars',
      'Instagram is their real shopfront; weekend trade pays the rent',
    ],
    say: [
      'Compliment something specific first (their rating, a dish, the fit-out)',
      '“People find you on Google Maps and there\'s no menu — that\'s customers walking to the café that has one”',
      'Talk foot traffic and regulars, not technology',
    ],
    avoid: ['Calling during ANY rush', 'Words like SEO, CMS, hosting', 'Pitching longer than 30 seconds before asking a question'],
    opener: p => `Hey ${prosFirst(p)}, I know you're between rushes so I'll be quick. ${prosProblem(p)}. I build simple one-pagers for cafés — menu, hours, tap-to-order — and I'd love to mock one up for ${p.business} for free. Worst case you say no and keep the design.`,
  },
  'Restaurants': {
    best: 'Tue–Thu 2:30–4:30pm',
    windows: [{ d: [2, 3, 4], s: 14.5, e: 16.5 }],
    whyBest: 'Between lunch and dinner service, early in the week. Fri–Sun is their game day — don\'t even text. Many close Mondays.',
    world: [
      'Chef-owner is exhausted; delivery apps are eating 30% of every order',
      'No-shows and empty Tuesdays keep them up at night',
      'They\'ve been burned by marketing agencies before',
    ],
    say: [
      '“Every order through your own site is an order UberEats doesn\'t take 30% of”',
      '“Bookings without the booking-platform fees”',
      'Mention a real dish or review — proves you actually looked',
    ],
    avoid: ['Friday to Sunday, completely', 'Mondays (day off)', 'Sounding like every agency that\'s cold-called them'],
    opener: p => `Hi ${prosFirst(p)}, calling between services on purpose — I'll take 30 seconds. ${prosProblem(p)}. I build restaurant sites that take orders and bookings directly, so the apps stop clipping your margin. Free mock-up with your menu on it — want me to text it over?`,
  },
  'Barbers': {
    best: 'Mon–Wed 10am–12pm',
    windows: [{ d: [1, 2, 3], s: 10, e: 12 }],
    whyBest: 'Early week is dead quiet in a barbershop. Thu–Sat is wall-to-wall — a Saturday call is an instant hang-up.',
    world: [
      'Instagram IS their portfolio — the fades page is the business',
      'Walk-in culture, but no-shows on bookings burn them',
      'Young owners, street culture — formal corporate tone kills it instantly',
    ],
    say: [
      '“Online bookings with a deposit — no-shows pay for themselves”',
      '“Your Insta gets them keen, your site locks them in”',
      'Keep it short, casual, respectful — like talking to a mate',
    ],
    avoid: ['Thursday–Saturday', 'Suit-and-tie language', 'Overexplaining — they decide in the first 20 seconds'],
    opener: p => `Yo ${prosFirst(p)}, quick one — your work on Insta is clean. ${prosProblem(p)}. I build booking pages for barbers: deposits, reminders, no more no-shows. I'll mock one up free with your branding — keen to see it?`,
  },
  'Beauty salons': {
    best: 'Tue–Thu 10am–1pm',
    windows: [{ d: [2, 3, 4], s: 10, e: 13 }],
    whyBest: 'Mid-morning, mid-week — owner\'s often doing admin between clients. Fri/Sat fully booked; Monday many are closed.',
    world: [
      'Appointment book is everything; a no-show is unpaid rent on that chair',
      'Owner is usually on the floor working while running the business',
      'They live on Instagram and word of mouth',
    ],
    say: [
      '“Deposits and automatic reminders — no-shows drop to nearly zero”',
      '“From your Instagram bio straight into a booked appointment”',
      'Warm and personal beats slick and salesy',
    ],
    avoid: ['Fridays and Saturdays', 'Calling before 10am (client prep)', 'Talking features instead of the no-show problem'],
    opener: p => `Hi ${prosFirst(p)}, I'll keep it short since you're probably between clients. ${prosProblem(p)}. I build booking pages for salons — deposits, reminders, the lot. Happy to mock one up free for ${p.business} so you can see it with your own branding.`,
  },
  'Gyms / PTs': {
    best: 'Weekdays 10am–3pm',
    windows: [{ d: [1, 2, 3, 4, 5], s: 10, e: 15 }],
    whyBest: 'Between the 6am class wave and the 5pm rush. PTs check their phone between sessions — an SMS often out-performs a call here.',
    world: [
      'Revenue = memberships + PT packs; a trial-to-member funnel is gold',
      'They\'re sold marketing constantly — sceptical but hungry for growth',
      'Community and transformation stories are their language',
    ],
    say: [
      '“Free-trial sign-ups straight from Instagram, timetable that updates itself”',
      '“Every DM asking \'how much?\' becomes a form that books a tour”',
      'Talk member numbers and retention, show you get gym economics',
    ],
    avoid: ['5–8am and 4–7pm (class rush)', 'Generic fitness-marketing spiel', 'Overpromising leads — promise a better funnel'],
    opener: p => `Hey ${prosFirst(p)}, I'll be quick between your sessions. ${prosProblem(p)}. I build gym sites that turn trial interest into booked sign-ups — timetable, trial form, the lot. Free mock-up with your branding, no strings — want a look?`,
  },
  'Physio / Allied health': {
    best: 'Weekdays 12:30–2pm',
    windows: [{ d: [1, 2, 3, 4, 5], s: 12.5, e: 14 }],
    whyBest: 'Lunch gap between patients. Otherwise you\'ll get reception — which is fine: win the practice manager and you win the clinic.',
    world: [
      'Booked in 30-min blocks all day; reception drowns in phone bookings',
      'Practice manager often makes this call, not the clinician',
      'Professional standards matter — sloppy pitch = instant no',
    ],
    say: [
      '“Online bookings take the phone pressure off reception”',
      '“New-patient forms filled before they arrive — saves 10 minutes a patient”',
      'Professional, evidence-flavoured tone; mention other clinics you\'d model on',
    ],
    avoid: ['Casual slang', 'Calling at 9am sharp (patient one just walked in)', 'Pushing hard — clinics decide slowly but stick forever'],
    opener: p => `Hi, this is Aiman from Groundwork Labs — is the practice manager available? I build clinic sites with online bookings and new-patient intake forms — it usually takes real pressure off reception. ${prosProblem(p)}. Could I email a free mock-up for ${p.business}?`,
  },
  'Mechanics': {
    best: '8–9am or 3:30–5pm',
    windows: [{ d: [1, 2, 3, 4, 5], s: 8, e: 9 }, { d: [1, 2, 3, 4, 5], s: 15.5, e: 17 }],
    whyBest: 'After morning drop-offs settle, or late arvo when jobs wrap and they\'re waiting on parts. Middle of the day they\'re under a car.',
    world: [
      'Phone rings off the hook with “how much for…” calls they hate',
      'Trust is everything — people fear being ripped off by mechanics',
      'Bookings are a whiteboard; quotes are guesswork over the phone',
    ],
    say: [
      '“Book-a-service online — fewer phone interruptions in the workshop”',
      '“A proper site makes you the trustworthy shop on the street”',
      'Be loud, fast and concrete — workshop noise is real',
    ],
    avoid: ['10am–3pm (under a car)', 'Soft, wordy pitches', 'Anything that sounds like an ad agency'],
    opener: p => `G'day ${prosFirst(p)}, quick one — I know the workshop's loud. ${prosProblem(p)}. I build simple sites for mechanics: book-a-service online, less phone time, more trust when people compare you on Google. Free mock-up — can I text it?`,
  },
  'Tutoring': {
    best: 'Weekdays 10am–2pm',
    windows: [{ d: [1, 2, 3, 4, 5], s: 10, e: 14 }],
    whyBest: 'They teach 3:30–8pm when school\'s out — daytime is their admin window. Weekends are lesson-packed too.',
    world: [
      'Parents are the real customer; trust and results win them',
      'Scheduling chaos: makeup lessons, term dates, sibling discounts',
      'Word of mouth is strong but capped — a site scales it',
    ],
    say: [
      '“Parents can see availability and book without the text-message tennis”',
      '“Results and testimonials on a proper site convert nervous parents”',
      'Education-friendly tone: outcomes, progress, peace of mind',
    ],
    avoid: ['3:30–8pm (teaching)', 'Salesy pressure — parents are the client', 'Underselling their expertise'],
    opener: p => `Hi ${prosFirst(p)}, I'll be brief — I know afternoons are teaching time. ${prosProblem(p)}. I build tutoring sites where parents see your results and book straight in — no more text-tennis. Free mock-up for ${p.business}, want me to send it?`,
  },
  'Florists': {
    best: 'Tue–Thu 11am–2pm',
    windows: [{ d: [2, 3, 4], s: 11, e: 14 }],
    whyBest: 'Mornings are market runs and arrangements; Mondays clear weekend orders; Fridays prep the weekend. Mid-week, midday is the calm.',
    world: [
      'Peak days (Valentine\'s, Mother\'s Day) are 30% of the year\'s revenue',
      'Weddings and events are the high-margin work they want more of',
      'Deliveries + phone orders = constant interruption',
    ],
    say: [
      '“Order-ahead online for peak days — no phone chaos”',
      '“A wedding enquiry form that books consultations while you arrange”',
      'Aesthetic matters — show them something beautiful, not corporate',
    ],
    avoid: ['Mondays and Fridays', 'The weeks before Valentine\'s/Mother\'s Day', 'Ugly template talk — they judge on beauty'],
    opener: p => `Hi ${prosFirst(p)}, quick call between deliveries I hope. ${prosProblem(p)}. I build florist sites that take orders ahead of the big days and catch wedding enquiries. I'd love to mock one up free for ${p.business} — it'll look as good as your arrangements.`,
  },
  'Real estate': {
    best: 'Tue–Thu 9:30–11:30am',
    windows: [{ d: [2, 3, 4], s: 9.5, e: 11.5 }],
    whyBest: 'Mondays are sales meetings, Saturdays are opens. Mid-week mid-morning they\'re at the desk prospecting — they respect a good cold call.',
    world: [
      'KPI-driven and image-obsessed; personal brand is their moat',
      'They cold-call for a living — they\'ll judge your pitch professionally',
      'Listings come from appraisals; appraisals come from being known',
    ],
    say: [
      '“A personal-brand site that wins the appraisal before you walk in”',
      '“Every ad points at a page that captures the vendor\'s number”',
      'Match their energy: confident, quick, numbers-focused',
    ],
    avoid: ['Mondays and Saturdays', 'Weak openers — they hang up on amateurs', 'Talking down the agency site (offer to complement it)'],
    opener: p => `Morning ${prosFirst(p)}, Aiman from Groundwork Labs — I'll respect the prospecting hour and keep it tight. ${prosProblem(p)}. I build personal-brand sites for agents that win appraisals before you knock. Free mock-up with your name on it — worth a look?`,
  },
  'Fencing': { ...TRADE_INTEL },
  'Landscaping': { ...TRADE_INTEL },
  'Plumbing': { ...TRADE_INTEL },
  'Electrical': { ...TRADE_INTEL },
  'Roofing': { ...TRADE_INTEL },
  'Cleaning': {
    ...TRADE_INTEL,
    best: '9:30–11am or 2–4pm',
    windows: [{ d: [1, 2, 3, 4, 5], s: 9.5, e: 11 }, { d: [1, 2, 3, 4, 5], s: 14, e: 16 }],
    whyBest: 'Between morning and afternoon jobs. Many cleaning-business owners schedule rather than clean — more reachable than other trades.',
  },
  'Builders': { ...TRADE_INTEL },
  'Other': {
    best: 'Tue–Thu 10–11:30am',
    windows: [{ d: [2, 3, 4], s: 10, e: 11.5 }],
    whyBest: 'The universal safe window: settled into the day, not yet at lunch, not end-of-day tired. Tuesday to Thursday beats Monday chaos and Friday wind-down.',
    world: ['Owner wears every hat — respect their time and they\'ll listen', 'They know they need “something online” but don\'t know what', 'Price fear is the silent objection — the free mock-up kills it'],
    say: ['Lead with the specific problem you spotted', '“Free mock-up first, you only pay if you want it live”', 'One clear next step, never three'],
    avoid: ['Mondays before 10am', 'Friday afternoons', 'Industry jargon'],
    opener: p => `Hi ${prosFirst(p)}, Aiman from Groundwork Labs — 30 seconds, I promise. ${prosProblem(p)}. I fix exactly that for local businesses, and I'll mock yours up free so you can see it before spending anything. Fair?`,
  },
};
const intelFor = p => NICHE_INTEL[p.trade] || NICHE_INTEL['Other'];

/* next datetime that lands inside the niche's best call window */
function nextCallSlot(intel) {
  const now = new Date();
  for (let add = 0; add < 8; add++) {
    const day = new Date(now); day.setDate(day.getDate() + add);
    for (const w of intel.windows) {
      if (!w.d.includes(day.getDay())) continue;
      const start = new Date(day);
      start.setHours(Math.floor(w.s), Math.round((w.s % 1) * 60), 0, 0);
      if (start.getTime() > now.getTime() + 20 * 60000) return start;
    }
  }
  return null;
}

/* Google Calendar template link — opens prefilled, one tap to save.
   Local (floating) times land in the user's own calendar timezone. */
function gcalLink(p, start) {
  const pad = n => String(n).padStart(2, '0');
  const f = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const end = new Date(start.getTime() + 15 * 60000);
  const intel = intelFor(p);
  const details = [
    `📞 ${p.phone || 'no number saved'}`,
    `${p.trade || ''} · ${p.suburb || ''} · pitch: ${p.offer || 'Landing page'}`,
    p.notes ? `Spotted: ${p.notes}` : '',
    '',
    `OPENER: ${intel.opener(p)}`,
    '',
    'Pipeline: https://aiman-business-os.netlify.app/#/prospects',
  ].filter(Boolean).join('\n');
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + '&text=' + encodeURIComponent('📞 Call ' + p.business + ' (' + (p.trade || 'lead') + ')')
    + '&dates=' + f(start) + '/' + f(end)
    + '&details=' + encodeURIComponent(details)
    + '&location=' + encodeURIComponent(p.suburb || '');
}

/* ---- Daily Hunt mission: the sit-down-and-go prompt ----
   Deterministic per day (same mission all day), cycle with "new mission". */
const HUNT_TARGET = 5;
let missionShift = 0;
function leadMission() {
  const now = new Date();
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 864e5);
  const hunts = NICHES.filter(n => n !== 'Other');
  const niche = hunts[(doy + missionShift) % hunts.length];
  const angles = [
    { text: 'with no website at all', offer: 'Landing page' },
    { text: 'with great reviews but nothing to show online', offer: 'Landing page' },
    { text: 'running on a Facebook page or Linktree only', offer: 'Full website' },
    { text: 'still taking bookings by phone only', offer: 'Booking system' },
    { text: 'with an old, slow or broken website', offer: 'Full website' },
  ];
  const angle = angles[(doy + missionShift) % angles.length];
  const addedToday = (DB.prospects || []).filter(p => p.added === prosToday()).length;
  return { niche, angle: angle.text, offer: angle.offer, addedToday, target: HUNT_TARGET };
}

/* start with an empty pipeline — add your first real lead with the
   scanner or the “Add lead” button */
if (!DB.prospects) DB.prospects = [];

let prosSeg = 0; // 0 = all pipeline stages tab index offset by 1

const prosToday = () => new Date().toISOString().slice(0, 10);
const prosAddDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const prosFirst = p => (p.contact || p.business).split(/\s+/)[0];

/* ---- personalised pitch templates (one-to-one, always edited before send) ----
   Problem-first: lead with what you noticed, then the fix (the offer). */
const prosNiche = p => (p.trade || 'local').toLowerCase().replace(/s \/ /g, ' & ').replace(/s$/, '');
function prosProblem(p) {
  const n = (p.notes || '').toLowerCase();
  if (n.includes('no website')) return `I noticed ${p.business} doesn't have a website yet — you're leaving customers on the table`;
  if (n.includes('social') || n.includes('facebook') || n.includes('linktree')) return `I noticed ${p.business} is running on a social page only — a real site would work a lot harder for you`;
  if (n.includes('insecure') || n.includes('old')) return `I had a look at your website and I reckon it's costing you customers — it needs a refresh`;
  if (n.includes('booking')) return `I noticed customers can't book ${p.business} online yet`;
  return `I came across ${p.business} and spotted something I can fix for you`;
}
function pitchSMS(p) {
  const o = offerOf(p);
  return `Hey ${prosFirst(p)}, Aiman here from Groundwork Labs in Sydney. ${prosProblem(p)}. I build ${o.blurb} for ${prosNiche(p)} businesses${o.demo ? ` — live demo: ${o.demo}` : ''}. I'll mock one up branded to ${p.business} for free so you can see it before spending a cent. Keen for a look?`;
}
function pitchEmail(p) {
  const o = offerOf(p);
  return `Hi ${prosFirst(p)},\n\nAiman here from Groundwork Labs (Sydney) — this is a personal note, not a mass email.\n\n${prosProblem(p)}.\n\nI build ${o.blurb} for ${prosNiche(p)} businesses. My whole thing is problem-solving: you tell me what's slowing you down, I build the fix.\n${o.demo ? `\nYou can see my work live here (takes 2 minutes): ${o.demo}\n` : ''}\nIf you're open to it, I'll put together a free mock-up branded to ${p.business} — no commitment, you only pay if you love it and want it live.\n\nEither way, keep up the great work.\n\nAiman\nGroundwork Labs\n\nPS — if you'd rather not hear from me again, just reply "no thanks" and that's the end of it.`;
}
function pitchDM(p) {
  const o = offerOf(p);
  return `Hey ${prosFirst(p)}! 👋 Love what ${p.business} is doing. ${prosProblem(p)}. I build ${o.blurb} for ${prosNiche(p)} businesses${o.demo ? ` — 2-min live demo: ${o.demo}` : ''}. Happy to mock one up free, branded to ${p.business}, so you can see it first. No pressure either way 🤝`;
}
function pitchCall(p) {
  const o = offerOf(p);
  return `CALL OPENER — ${p.business} (${prosFirst(p)})\n\n"Hey ${prosFirst(p)}, it's Aiman from Groundwork Labs in Sydney — have I caught you at a bad time? ...\n\nQuick one: ${prosProblem(p)}. I build ${o.blurb} for ${prosNiche(p)} businesses, and I found ${p.business} ${p.source && !/example/i.test(p.source) ? 'on ' + p.source : 'online'} — figured you'd rather see it than hear about it.\n\nIf I text you ${o.demo ? 'a live demo link' : 'a free mock-up with your name on it'} this week, will you give it two minutes? You only ever pay if you want it live."\n\nGOAL: permission to send the link/mock-up. Then log it here — follow-up sets itself.`;
}

/* ---- hunting grounds: pre-built searches that open in a new tab ---- */
function huntLinks(trade, suburb) {
  const q = encodeURIComponent(trade + ' ' + suburb);
  return [
    { label: 'Google Maps', icon: 'target', href: `https://www.google.com/maps/search/${q}` },
    { label: 'Google', icon: 'search', href: `https://www.google.com/search?q=${q}+contact` },
    { label: 'Instagram', icon: 'image', href: `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(trade.toLowerCase().replace(/\s/g, '') + ' ' + suburb.toLowerCase())}` },
    { label: 'Facebook', icon: 'clients', href: `https://www.facebook.com/search/pages?q=${q}` },
    { label: 'hipages', icon: 'briefcase', href: `https://www.google.com/search?q=site:hipages.com.au+${q}` },
    { label: 'Yellow Pages', icon: 'book', href: `https://www.yellowpages.com.au/search/listings?clue=${encodeURIComponent(trade)}&locationClue=${encodeURIComponent(suburb)}` },
  ];
}

/* ============================ page ============================ */
Pages.prospects = () => {
  const P = DB.prospects;
  const due = P.filter(p => p.next && p.next <= prosToday() && !['Won', 'Not now'].includes(p.stage));
  const stats = [
    { n: P.filter(p => p.stage === 'To contact').length, l: 'To contact', ic: 'flag' },
    { n: due.length, l: 'Follow-ups due', ic: 'clock' },
    { n: P.filter(p => ['Contacted', 'In talks', 'Demo sent'].includes(p.stage)).length, l: 'In play', ic: 'zap' },
    { n: P.filter(p => p.stage === 'Won').length, l: 'Won', ic: 'star' },
  ];

  const m = leadMission();
  const missionPct = Math.min(100, Math.round(m.addedToday / m.target * 100));

  return pageHead('Lead Finder', 'Find businesses with a problem you can solve, pitch the fix, follow up until they say yes',
    `<button class="btn primary" data-pros-add>${icon('plus')}Add lead</button>`)

  + `<div class="card mission-card" style="margin-bottom:16px">
      <div class="spread" style="flex-wrap:wrap;gap:12px">
        <div class="flex" style="gap:14px;min-width:0">
          <span class="mission-ico">${icon('zap')}</span>
          <div class="stack" style="gap:3px;min-width:0">
            <span class="tiny t3" style="text-transform:uppercase;letter-spacing:.07em;font-weight:600">Today's hunt</span>
            <b style="font-size:16px">Find ${m.target} ${m.niche.toLowerCase()} ${m.angle}</b>
            <span class="small t2">Sell them a <b>${m.offer.toLowerCase()}</b> — scanner below is loaded and ready. ${m.addedToday >= m.target ? 'Mission complete 🎉 keep going or rest easy.' : ''}</span>
          </div>
        </div>
        <div class="flex" style="gap:14px;flex-shrink:0">
          <div class="stack" style="gap:5px;min-width:120px">
            <span class="small t2 mono-num" style="text-align:right">${m.addedToday} / ${m.target} leads today</span>
            ${UI.progress(missionPct, m.addedToday >= m.target ? 'good' : '')}
          </div>
          <button class="btn sm" data-mission-shuffle title="Different niche">${icon('refresh')}New mission</button>
        </div>
      </div>
    </div>`

  + `<div class="grid pipe-stats" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
      ${stats.map(s => `<div class="card" style="padding:14px 16px"><div class="spread"><span class="small t2">${s.l}</span>${icon(s.ic, 'pipe-stat-ico')}</div><div style="font-size:24px;font-weight:650;margin-top:4px">${s.n}</div></div>`).join('')}
    </div>`

  + UI.card({
      title: 'Hot Leads scanner', icon: 'zap',
      body: `<p class="small t2" style="line-height:1.65;margin-bottom:12px">Pick a niche + suburb and hit <b>Scan</b> — it pulls every business in the area from Google and ranks the ones with <b>no website or a dying one</b> first. 🔥🔥🔥 means great reviews and nothing to show for it — your perfect landing-page customer. Tap <b>Call</b> and go.</p>
        <div class="flex" style="flex-wrap:wrap;gap:8px;margin-bottom:12px">
          <select class="select" id="hunt-trade" style="max-width:180px">${NICHES.map(t => `<option ${t === m.niche ? 'selected' : ''}>${t}</option>`).join('')}</select>
          <input class="input" id="hunt-suburb" placeholder="Suburb, e.g. Bankstown" value="Bankstown" style="max-width:180px">
          <button class="btn primary" id="scan-btn">${icon('zap')}Scan for hot leads</button>
        </div>
        <div id="scan-results"></div>
        <div class="pop-sep" style="margin:14px 0 12px"></div>
        <p class="tiny t3" style="margin-bottom:8px">Manual hunting (opens in a new tab) — and remember: <b>one-to-one personalised outreach only</b> (Spam Act safe, converts better):</p>
        <div class="flex" id="hunt-links" style="flex-wrap:wrap;gap:8px"></div>`,
    })

  + `<div style="margin:16px 0 12px">${UI.seg(['All', ...STAGES], prosSeg)}</div>`
  + `<div id="pros-list">${prosListHTML()}</div>`;
};

function prosListHTML() {
  let P = [...DB.prospects];
  if (prosSeg > 0) P = P.filter(p => p.stage === STAGES[prosSeg - 1]);
  const t = prosToday();
  const rank = p => (p.next && p.next <= t && !['Won', 'Not now'].includes(p.stage)) ? 0 : STAGES.indexOf(p.stage) + 1;
  P.sort((a, b) => rank(a) - rank(b) || (b.added || '').localeCompare(a.added || ''));

  if (!P.length) return UI.card({ title: 'Pipeline', icon: 'target',
    body: UI.empty('target', 'No prospects here yet', 'Use the hunting grounds above, then Add prospect — your outreach machine starts with one name.') });

  return `<div class="grid" style="grid-template-columns:1fr 1fr">` + P.map(p => {
    const dueNow = p.next && p.next <= t && !['Won', 'Not now'].includes(p.stage);
    const ini = p.business.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `<div class="card" style="${dueNow ? 'outline:1.5px solid var(--accent);outline-offset:-1.5px' : ''}">
      <div class="spread" style="margin-bottom:10px">
        <div class="flex">${UI.avatar(ini, 'a40', true)}
          <div class="stack" style="gap:1px"><b style="font-size:14.5px">${UI.esc(p.business)}</b>
          <span class="tiny t3">${UI.esc(p.contact || '—')} · ${UI.esc(p.trade)} · ${UI.esc(p.suburb)}</span></div>
        </div>
        <span class="badge ${STAGE_CLS[p.stage] || ''}"><span class="bdot"></span>${UI.esc(p.stage)}</span>
      </div>
      <div class="flex" style="flex-wrap:wrap;gap:6px;margin-bottom:10px">
        ${dueNow ? `<span class="badge bad">${icon('clock')}Follow up today</span>` : p.next ? `<span class="badge">${icon('clock')}Next: ${UI.esc(p.next)}</span>` : ''}
        <span class="badge info">${icon('clock')}Call: ${intelFor(p).best}</span>
        ${p.offer ? `<span class="badge gold">${icon('zap')}${UI.esc(p.offer)}</span>` : ''}
        <span class="badge">${p.touches || 0} touch${p.touches === 1 ? '' : 'es'}</span>
        ${p.source ? `<span class="badge info">${UI.esc(p.source)}</span>` : ''}
      </div>
      ${p.notes ? `<p class="small t2" style="line-height:1.55;margin-bottom:12px">${UI.esc(p.notes)}</p>` : ''}
      <div class="flex" style="flex-wrap:wrap;gap:6px">
        ${p.phone ? `<a class="btn sm" data-pros-touch="${p.id}" data-ch="call" href="tel:${UI.esc(p.phone.replace(/\s/g, ''))}">${icon('phone')}Call</a>` : ''}
        ${p.phone ? `<a class="btn sm" data-pros-touch="${p.id}" data-ch="sms" href="sms:${UI.esc(p.phone.replace(/\s/g, ''))}?&body=__SMS__${p.id}">${icon('message')}SMS pitch</a>` : ''}
        ${p.email ? `<a class="btn sm" data-pros-touch="${p.id}" data-ch="email" href="mailto:${UI.esc(p.email)}?subject=__SUBJ__&body=__BODY__${p.id}">${icon('mail')}Email pitch</a>` : ''}
        ${p.insta ? `<button class="btn sm" data-pros-dm="${p.id}">${icon('image')}IG DM</button>` : ''}
        <button class="btn sm" data-pros-call-script="${p.id}">${icon('mic')}Call script</button>
        <button class="btn sm" data-pros-playbook="${p.id}">${icon('book')}Playbook</button>
        <button class="btn sm" data-pros-schedule="${p.id}">${icon('calendar')}Schedule call</button>
        ${p.website ? `<a class="btn sm" href="https://${UI.esc(p.website.replace(/^https?:\/\//, ''))}" target="_blank" rel="noopener">${icon('globe')}Site</a>` : ''}
      </div>
      <div class="flex" style="margin-top:12px;gap:8px">
        <select class="select" data-pros-stage="${p.id}" style="flex:1;padding:7px 10px;font-size:12.5px">
          ${STAGES.map(s => `<option ${s === p.stage ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <button class="btn sm" data-pros-edit="${p.id}">${icon('note')}Edit</button>
        <button class="btn sm" data-pros-del="${p.id}" title="Delete">${icon('x')}</button>
      </div>
    </div>`;
  }).join('') + `</div>`;
}

/* ---- hot leads scanner (Google Places via our serverless proxy) ---- */
const PLACES_URL = 'https://aiman-business-os.netlify.app/.netlify/functions/places';
let scanResults = [];
let scanState = 'idle'; // idle | loading | done | no-access-key | no-places-key | error

function hotScore(r) {
  const w = (r.website || '').toLowerCase();
  if (!w) return { rank: 0, fire: '🔥🔥🔥', label: 'No website', cls: 'bad', note: 'No website at all — perfect landing-page pitch' };
  if (/facebook\.com|instagram\.com|linktr\.ee|business\.site|wixsite\.com|\.godaddysites\.com/.test(w))
    return { rank: 1, fire: '🔥🔥', label: 'Social page only', cls: 'warn', note: 'Only a social/free page — pitch a real site' };
  if (w.startsWith('http://')) return { rank: 1, fire: '🔥🔥', label: 'Old insecure site', cls: 'warn', note: 'Site is http:// — old and flagged "not secure" by browsers' };
  return { rank: 2, fire: '🔥', label: 'Has a website', cls: '', note: 'Has a site — open it, could still be dated' };
}

function scanResultsHTML() {
  if (scanState === 'idle') return '';
  if (scanState === 'loading') return `<div class="empty" style="padding:22px">${icon('refresh')}<b style="margin-top:8px">Scanning the suburb…</b><p>Pulling every business from Google and checking their websites.</p></div>`;
  if (scanState === 'no-access-key') return `<div class="empty" style="padding:22px">${icon('key')}<b style="margin-top:8px">Connect your access key first</b><p>Open the Enquiries page once and enter your access key — the scanner uses the same one.</p></div>`;
  if (scanState === 'no-places-key') return `<div class="empty" style="padding:22px">${icon('search')}<b style="margin-top:8px">Auto-scan isn't switched on yet</b><p style="max-width:500px;margin:6px auto 0;line-height:1.7">The one-tap scanner needs a free Google key connected once on the server. Until then, use the <b>manual hunting links below</b> — Google Maps, Instagram, Facebook and the rest all work right now for finding businesses to add. Ask your studio AI to switch the auto-scanner on.</p></div>`;
  if (scanState === 'error') return `<div class="empty" style="padding:22px">${icon('search')}<b style="margin-top:8px">Auto-scan isn't switched on yet</b><p style="max-width:500px;margin:6px auto 0;line-height:1.7">Use the <b>manual hunting links below</b> for now — they all work. The one-tap scanner needs a quick one-time setup (a free Google key). Ask your studio AI to switch it on.</p></div>`;
  if (!scanResults.length) return `<div class="empty" style="padding:22px">${icon('search')}<b style="margin-top:8px">Nothing found there</b><p>Try a bigger suburb or a different trade.</p></div>`;

  const inPipeline = name => DB.prospects.some(p => p.business.toLowerCase() === name.toLowerCase());
  const hot = scanResults.filter(r => hotScore(r).rank < 2).length;

  return `<div class="tiny t3" style="margin:2px 0 10px">${scanResults.length} businesses found · <b style="color:var(--accent)">${hot} hot</b> (weak or missing website) — hottest first</div>
    <div class="stack" style="gap:8px">` + scanResults.map((r, i) => {
      const h = hotScore(r);
      const added = inPipeline(r.name);
      return `<div class="card" style="padding:13px 14px;${h.rank === 0 ? 'outline:1.5px solid var(--accent);outline-offset:-1.5px' : ''}">
        <div class="spread" style="gap:10px;margin-bottom:7px">
          <div class="stack" style="gap:2px;min-width:0">
            <b style="font-size:14px">${UI.esc(r.name)}</b>
            <span class="tiny t3" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${UI.esc(r.address)}</span>
          </div>
          <span class="badge ${h.cls}" style="flex-shrink:0">${h.fire} ${h.label}</span>
        </div>
        <div class="flex" style="flex-wrap:wrap;gap:6px;margin-bottom:9px">
          ${r.rating ? `<span class="badge gold">★ ${r.rating} (${r.reviews})</span>` : '<span class="badge">No reviews yet</span>'}
          ${r.rating >= 4.5 && r.reviews >= 20 && h.rank === 0 ? '<span class="badge bad">💎 Great business, zero web presence</span>' : ''}
        </div>
        <div class="flex" style="flex-wrap:wrap;gap:6px">
          ${r.phone ? `<a class="btn sm primary" href="tel:${UI.esc(r.phone.replace(/\s/g, ''))}">${icon('phone')}Call now</a>` : ''}
          ${added ? `<span class="badge good"><span class="bdot"></span>In pipeline</span>`
                  : `<button class="btn sm" data-scan-add="${i}">${icon('plus')}Add to pipeline</button>`}
          ${r.website ? `<a class="btn sm" href="${UI.esc(r.website)}" target="_blank" rel="noopener">${icon('globe')}Their site</a>` : ''}
          ${r.maps ? `<a class="btn sm" href="${UI.esc(r.maps)}" target="_blank" rel="noopener">${icon('target')}Maps</a>` : ''}
        </div>
      </div>`;
    }).join('') + `</div>`;
}

/* ============================ wiring ============================ */
Pages._mount.prospects = () => {
  const page = document.querySelector('.page');

  /* mission shuffle — different niche, same day */
  page.querySelector('[data-mission-shuffle]')?.addEventListener('click', () => {
    missionShift++;
    App.refresh();
  });

  /* hunting ground links re-render on input */
  const renderHunt = () => {
    const trade = page.querySelector('#hunt-trade')?.value || leadMission().niche;
    const sub = page.querySelector('#hunt-suburb')?.value.trim() || 'Sydney';
    const el = page.querySelector('#hunt-links');
    if (el) el.innerHTML = huntLinks(trade, sub).map(l =>
      `<a class="btn sm" href="${l.href}" target="_blank" rel="noopener">${icon(l.icon)}${l.label}</a>`).join('');
  };
  page.querySelector('#hunt-trade')?.addEventListener('change', renderHunt);
  page.querySelector('#hunt-suburb')?.addEventListener('input', renderHunt);
  renderHunt();

  /* ---- scanner ---- */
  const scanEl = () => page.querySelector('#scan-results');
  const renderScan = () => { const el = scanEl(); if (el) { el.innerHTML = scanResultsHTML(); wireScan(); } };

  const wireScan = () => {
    page.querySelectorAll('[data-scan-add]').forEach(b => b.addEventListener('click', () => {
      const r = scanResults[+b.dataset.scanAdd];
      if (!r) return;
      const h = hotScore(r);
      DB.prospects.unshift({
        id: uid('pr'), business: r.name, contact: '', trade: page.querySelector('#hunt-trade')?.value || 'Other',
        suburb: (page.querySelector('#hunt-suburb')?.value || '').trim(), phone: r.phone || '', email: '',
        insta: '', website: (r.website || '').replace(/^https?:\/\//, '').replace(/\/$/, ''),
        source: 'Hot Leads scan', stage: 'To contact', added: prosToday(), lastTouch: null, touches: 0, next: prosToday(),
        offer: h.rank === 0 ? 'Landing page' : 'Full website',
        notes: h.note + (r.rating ? ` · ★${r.rating} from ${r.reviews} reviews` : ' · no reviews yet'),
      });
      saveDB();
      const mAfter = leadMission();
      UI.toast(mAfter.addedToday >= mAfter.target
        ? `${r.name} added — that's ${mAfter.addedToday}/${mAfter.target}, mission complete 🎉`
        : `${r.name} added (${mAfter.addedToday}/${mAfter.target} today) — call while it's hot 🔥`);
      refreshList(); renderScan();
    }));
  };

  const runScan = async () => {
    const trade = page.querySelector('#hunt-trade')?.value || 'Fencing';
    const suburb = (page.querySelector('#hunt-suburb')?.value || '').trim();
    if (!suburb) { UI.toast('Type a suburb first'); return; }
    if (!leadsKey()) { scanState = 'no-access-key'; renderScan(); return; }
    scanState = 'loading'; renderScan();
    try {
      const r = await fetch(`${PLACES_URL}?key=${encodeURIComponent(leadsKey())}&trade=${encodeURIComponent(trade)}&suburb=${encodeURIComponent(suburb)}`);
      if (r.status === 501 || r.status === 404) { scanState = 'no-places-key'; renderScan(); return; } // backend not set up yet
      if (!r.ok) throw new Error('HTTP ' + r.status);
      scanResults = (await r.json()).sort((a, b) =>
        hotScore(a).rank - hotScore(b).rank || (b.reviews || 0) - (a.reviews || 0));
      scanState = 'done';
    } catch (e) { scanState = 'error'; }
    renderScan();
  };
  page.querySelector('#scan-btn')?.addEventListener('click', runScan);
  renderScan();

  wireSeg(page, i => { prosSeg = i; refreshList(); });

  const refreshList = () => {
    const el = page.querySelector('#pros-list');
    if (el) { el.innerHTML = prosListHTML(); wireList(); }
  };

  const logTouch = (p, note) => {
    p.touches = (p.touches || 0) + 1;
    p.lastTouch = prosToday();
    p.next = prosAddDays(3); // default follow-up rhythm: 3 days
    if (p.stage === 'To contact') p.stage = 'Contacted';
    saveDB();
    UI.toast(note + ' — follow-up set for ' + p.next);
    refreshList();
  };

  const wireList = () => {
    /* pitch links: substitute the personalised body at click time, then log */
    page.querySelectorAll('[data-pros-touch]').forEach(a => a.addEventListener('click', () => {
      const p = DB.prospects.find(x => x.id === a.dataset.prosTouch);
      if (!p) return;
      if (a.dataset.ch === 'sms') a.href = 'sms:' + p.phone.replace(/\s/g, '') + '?&body=' + encodeURIComponent(pitchSMS(p));
      if (a.dataset.ch === 'email') a.href = 'mailto:' + p.email + '?subject=' + encodeURIComponent('Built something for ' + p.business) + '&body=' + encodeURIComponent(pitchEmail(p));
      setTimeout(() => logTouch(p, a.dataset.ch === 'call' ? 'Call logged' : a.dataset.ch === 'sms' ? 'SMS pitch opened' : 'Email pitch opened'), 400);
    }));

    page.querySelectorAll('[data-pros-dm]').forEach(b => b.addEventListener('click', () => {
      const p = DB.prospects.find(x => x.id === b.dataset.prosDm);
      if (!p) return;
      (navigator.clipboard?.writeText(pitchDM(p)) || Promise.reject()).then(
        () => { window.open('https://www.instagram.com/' + p.insta.replace(/^@/, ''), '_blank'); logTouch(p, 'DM copied — paste it in Instagram'); },
        () => UI.toast('Copy blocked — long-press the DM text instead'));
    }));

    page.querySelectorAll('[data-pros-playbook]').forEach(b => b.addEventListener('click', () => {
      const p = DB.prospects.find(x => x.id === b.dataset.prosPlaybook);
      if (p) playbookOverlay(p);
    }));

    page.querySelectorAll('[data-pros-schedule]').forEach(b => b.addEventListener('click', () => {
      const p = DB.prospects.find(x => x.id === b.dataset.prosSchedule);
      if (p) scheduleCall(p);
    }));

    page.querySelectorAll('[data-pros-call-script]').forEach(b => b.addEventListener('click', () => {
      const p = DB.prospects.find(x => x.id === b.dataset.prosCallScript);
      if (!p) return;
      (navigator.clipboard?.writeText(pitchCall(p)) || Promise.reject()).then(
        () => UI.toast('Call script copied — open your notes and dial'),
        () => UI.toast('Copy blocked by browser'));
    }));

    page.querySelectorAll('[data-pros-stage]').forEach(sel => sel.addEventListener('change', () => {
      const p = DB.prospects.find(x => x.id === sel.dataset.prosStage);
      if (!p) return;
      p.stage = sel.value;
      if (sel.value === 'Won') { p.next = null; saveDB(); refreshList(); wonModal(p); return; }
      else if (sel.value === 'Not now') { p.next = null; UI.toast('Parked — they stay searchable, never delete a maybe'); }
      else UI.toast('Moved to ' + sel.value);
      saveDB();
      refreshList();
    }));

    page.querySelectorAll('[data-pros-edit]').forEach(b => b.addEventListener('click', () => {
      const p = DB.prospects.find(x => x.id === b.dataset.prosEdit);
      if (p) prospectModal(p, refreshList);
    }));

    page.querySelectorAll('[data-pros-del]').forEach(b => b.addEventListener('click', () => {
      DB.prospects = DB.prospects.filter(x => x.id !== b.dataset.prosDel);
      saveDB(); UI.toast('Prospect deleted'); refreshList();
    }));
  };
  wireList();

  page.querySelector('[data-pros-add]')?.addEventListener('click', () => prospectModal(null, () => App.refresh()));
};

/* ---- Playbook: the deep-dive on how to approach this lead ---- */
function playbookOverlay(p) {
  const intel = intelFor(p);
  const opener = intel.opener(p);
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="palette" style="max-height:84vh;display:flex;flex-direction:column">
    <div class="spread" style="padding:18px 20px 8px">
      <div>
        <b style="font-size:16px">Playbook — ${UI.esc(p.business)}</b>
        <div class="tiny t3" style="margin-top:2px">${UI.esc(p.trade || 'Local business')} · how to turn this cold lead warm</div>
      </div>
      <button class="icon-btn" data-close>${icon('x')}</button>
    </div>
    <div style="overflow-y:auto;padding:4px 20px 18px">
      <div class="pb-section">
        <div class="pb-h">${icon('clock')}Best time to call — <span style="color:var(--accent)">${intel.best}</span></div>
        <p class="small t2">${UI.esc(intel.whyBest)}</p>
      </div>
      <div class="pb-section">
        <div class="pb-h">${icon('user')}How they think</div>
        <ul class="pb-list">${intel.world.map(x => `<li>${UI.esc(x)}</li>`).join('')}</ul>
      </div>
      <div class="pb-section">
        <div class="pb-h" style="color:var(--good)">${icon('check')}Say this</div>
        <ul class="pb-list">${intel.say.map(x => `<li>${UI.esc(x)}</li>`).join('')}</ul>
      </div>
      <div class="pb-section">
        <div class="pb-h" style="color:var(--bad)">${icon('x')}Avoid</div>
        <ul class="pb-list">${intel.avoid.map(x => `<li>${UI.esc(x)}</li>`).join('')}</ul>
      </div>
      <div class="pb-section">
        <div class="pb-h">${icon('mic')}Your warm opener</div>
        <div class="pb-opener">${UI.esc(opener)}</div>
      </div>
      <div class="flex" style="gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn primary" data-pb-schedule>${icon('calendar')}Schedule at the right time</button>
        <button class="btn" data-pb-copy>${icon('copy')}Copy opener</button>
        ${p.phone ? `<a class="btn" href="tel:${UI.esc(p.phone.replace(/\s/g, ''))}">${icon('phone')}Call now</a>` : ''}
      </div>
    </div>
  </div>`;
  document.body.appendChild(ov);
  const close = () => ov.remove();
  ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
  ov.querySelector('[data-close]').addEventListener('click', close);
  ov.querySelector('[data-pb-copy]').addEventListener('click', () => {
    (navigator.clipboard?.writeText(opener) || Promise.reject()).then(
      () => UI.toast('Opener copied — you\'re ready'),
      () => UI.toast('Copy blocked — long-press the text instead'));
  });
  ov.querySelector('[data-pb-schedule]').addEventListener('click', () => { close(); scheduleCall(p); });
}

/* ---- Schedule: drop the call into Google Calendar at the
   niche's best window, and set the in-app follow-up date ---- */
function scheduleCall(p) {
  const intel = intelFor(p);
  const start = nextCallSlot(intel);
  if (!start) { UI.toast('Couldn\'t find a slot — call whenever suits'); return; }
  window.open(gcalLink(p, start), '_blank', 'noopener');
  p.next = start.toISOString().slice(0, 10);
  saveDB();
  App.refresh();
  const label = start.toLocaleString('en-AU', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  UI.toast(`Call slotted for ${label} — the smart window for ${(p.trade || 'this niche').toLowerCase()} 🎯`);
}

/* ---- WON: turn the lead into a real client + project so the
   dashboard, projects board and finance run on real work ---- */
function wonModal(p) {
  const today = new Date();
  const defaultDue = new Date(today.getTime() + 14 * 864e5).toISOString().slice(0, 10);
  UI.modal({
    title: `🎉 ${p.business} said yes — set up the job`,
    submitLabel: 'Create client + project',
    fields: [
      { name: 'project', label: 'Project name', value: `${p.business} — ${p.offer || 'Landing page'}`, required: true, full: true },
      { name: 'offer', label: 'What you\'re building', type: 'select', options: OFFER_NAMES, value: p.offer || 'Landing page' },
      { name: 'value', label: 'Job value ($)', type: 'number', value: 490, min: 0 },
      { name: 'due', label: 'Due date', type: 'date', value: defaultDue },
    ],
    onSubmit: v => {
      const ini = p.business.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const since = today.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
      const dueTxt = v.due ? new Date(v.due).toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }) : '—';
      let client = DB.clients.find(c => c.name.toLowerCase() === p.business.toLowerCase());
      if (!client) {
        client = {
          id: uid('c'), name: p.business, contact: p.contact || '—', initials: ini,
          industry: p.trade || '—', location: p.suburb || '—',
          email: p.email || '—', phone: p.phone || '—', site: p.website || '—',
          status: 'Active', value: +v.value || 0, projects: 1, since,
          summary: `Won through the Lead Finder — ${v.offer.toLowerCase()}. ${p.notes || ''}`.trim(),
          notes: [], timeline: [{ date: today.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }), text: 'Won via Lead Finder 🎉' }],
        };
        DB.clients.unshift(client);
      } else {
        client.status = 'Active';
        client.projects = (client.projects || 0) + 1;
        client.value = (+client.value || 0) + (+v.value || 0);
      }
      p.clientId = client.id;
      DB.projects.unshift({
        id: uid('p'), name: v.project, clientId: client.id, stage: 'Planning', progress: 5,
        due: dueTxt, tags: [v.offer], hours: 0,
        desc: p.notes ? `From Lead Finder: ${p.notes}` : `${v.offer} for ${p.business}.`,
      });
      DB.activity.unshift({ icon: 'star', text: `WON <b>${UI.esc(p.business)}</b> — ${UI.esc(v.offer)} (${fmt$(+v.value || 0)})`, time: 'Just now' });
      saveDB();
      UI.toast(`${p.business} is now a client with a live project 🎉`);
      App.refresh();
    },
  });
}

function prospectModal(p, done) {
  UI.modal({
    title: p ? 'Edit lead' : 'Add lead',
    submitLabel: p ? 'Save' : 'Add to pipeline',
    fields: [
      { name: 'business', label: 'Business name', value: p?.business, required: true, full: true },
      { name: 'contact', label: 'Contact name', value: p?.contact, placeholder: 'First name is enough' },
      { name: 'trade', label: 'Niche', type: 'select', options: NICHES, value: p?.trade || leadMission().niche },
      { name: 'offer', label: 'What you\'d sell them', type: 'select', options: OFFER_NAMES, value: p?.offer || 'Landing page' },
      { name: 'suburb', label: 'Suburb', value: p?.suburb, placeholder: 'Bankstown' },
      { name: 'phone', label: 'Phone', value: p?.phone, placeholder: '04xx xxx xxx' },
      { name: 'email', label: 'Email', value: p?.email },
      { name: 'insta', label: 'Instagram handle', value: p?.insta, placeholder: 'without the @' },
      { name: 'website', label: 'Website', value: p?.website },
      { name: 'source', label: 'Where you found them', type: 'select', options: ['Google Maps', 'Google', 'Instagram', 'Facebook', 'hipages', 'Yellow Pages', 'Referral', 'Drove past', 'Other'], value: p?.source && !/example/i.test(p.source) ? p.source : 'Google Maps' },
      { name: 'next', label: 'Follow up on', type: 'date', value: p?.next || prosToday() },
      { name: 'notes', label: 'Notes', type: 'textarea', value: p?.notes, placeholder: 'What caught your eye? Weak website? No booking system? Great reviews?', full: true },
    ],
    onSubmit: v => {
      if (!v.business.trim()) return;
      if (p) Object.assign(p, v);
      else DB.prospects.unshift({ id: uid('pr'), ...v, stage: 'To contact', added: prosToday(), lastTouch: null, touches: 0 });
      saveDB();
      UI.toast(p ? 'Prospect updated' : v.business + ' added — hit them while it\'s fresh');
      done();
    },
  });
}
