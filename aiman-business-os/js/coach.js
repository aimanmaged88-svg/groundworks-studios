/* ============================================================
   DAILY COACHING — the founder's corner
   One real story a day: how the greats started small and scaled.
   Every lesson ends with a move Aiman can make TODAY, one tap
   from becoming a task. Streaks tracked, everything syncs.
   ============================================================ */

const Coach = (() => {

  const LESSONS = [
    { founder: 'Jeff Bezos', co: 'Amazon', title: 'Start narrow. Win. Then expand.',
      story: 'Amazon began in a garage selling one thing: books. Not "everything" — books. Bezos picked the wedge he could win, dominated it, and only then expanded category by category.',
      principle: 'Own one niche completely before you touch the next.',
      action: 'Pick ONE business type to own this month — gyms, butchers or trades — and aim every post and offer at just them.' },
    { founder: 'Sara Blakely', co: 'Spanx', title: 'Keep the day job. Build at night.',
      story: 'Blakely sold fax machines door-to-door for 7 years and started Spanx with $5,000 in savings — writing her patent herself to save legal fees. She kept the day job for two years until Spanx could pay her.',
      principle: 'The day job is not the enemy — it\'s the funding.',
      action: 'Write down the monthly Groundwork revenue number that lets you go full-time. Put it where you see it daily.' },
    { founder: 'Sam Walton', co: 'Walmart', title: 'Serve who everyone else ignores.',
      story: 'Walton built Walmart in small-town Arkansas — towns every big retailer said were too small to matter. The overlooked market made him the richest man in America.',
      principle: 'The underserved customer is the open goal.',
      action: 'List 5 local businesses too small for the big agencies to care about. They\'re exactly your customer.' },
    { founder: 'Estée Lauder', co: 'Estée Lauder', title: 'Give first. They come back.',
      story: 'Nobody knew Estée Lauder, so she gave free samples and free makeovers in salons and hotel lobbies. The free touch became customers for life — and a cosmetics empire.',
      principle: 'Free done right isn\'t a cost — it\'s your best salesperson.',
      action: 'Your FREE starter tier is this exact play. Offer it directly to 3 businesses this week — personally, by name.' },
    { founder: 'Ray Kroc', co: 'McDonald\'s', title: 'The system is the product.',
      story: 'Kroc was a 52-year-old milkshake-machine salesman when he saw one burger stand running like clockwork. He didn\'t invent the burger — he productised the SYSTEM and repeated it thousands of times.',
      principle: 'Money made once is income. A system sold many times is a company.',
      action: 'Take your best build so far and write down the 5 pieces every similar business would also need. That\'s your first kit.' },
    { founder: 'Melanie Perkins', co: 'Canva', title: 'Start with the tiny version.',
      story: 'Perth\'s Melanie Perkins was rejected by over 100 investors. Her billion-dollar design platform started as a tiny tool for school yearbooks — the small version proved the big vision.',
      principle: 'Ship the small version of the big dream. It buys you the right to build the rest.',
      action: 'Your OS is your yearbook-tool moment. Note ONE thing clients keep asking for — that\'s the seed of your platform.' },
    { founder: 'Phil Knight', co: 'Nike', title: 'Sell where they already gather.',
      story: 'Knight started by selling running shoes from the boot of his car at track meets — going where runners already were instead of waiting for them to find a store.',
      principle: 'Don\'t build an audience from zero. Borrow the gathering that already exists.',
      action: 'Find 2 local Facebook groups or business meetups where Sydney small-business owners already talk. Show up there.' },
    { founder: 'Brian Chesky', co: 'Airbnb', title: 'Do things that don\'t scale.',
      story: 'Airbnb\'s founders sold novelty cereal boxes to stay alive, then personally photographed hosts\' apartments one by one. The unscalable hustle taught them what customers actually wanted.',
      principle: 'Early on, hand-to-hand beats automation. Scale comes after understanding.',
      action: 'Personally message every enquiry within an hour this month. Speed of reply is your unfair advantage right now.' },
    { founder: 'Jan Koum', co: 'WhatsApp', title: 'One thing. Perfectly.',
      story: 'Koum grew up on food stamps and was rejected for a job at Facebook. WhatsApp did exactly one thing — messaging — with no ads and no clutter. Facebook later paid $19 billion for it.',
      principle: 'Focus is a feature. Every "extra" dilutes the promise.',
      action: 'Review your site: is there anything that distracts from "tell us what you need"? Cut one thing this week.' },
    { founder: 'Howard Schultz', co: 'Starbucks', title: 'Sell the feeling, not the product.',
      story: 'Schultz grew up in Brooklyn public housing. He didn\'t sell coffee — he sold the "third place" between home and work. People pay multiples for how a business makes them feel.',
      principle: 'Premium is an experience, not a price tag.',
      action: 'Walk through your own client journey as if you were the customer. Find one moment to make feel more premium.' },
    { founder: 'Steve Jobs', co: 'Apple', title: 'Get the order first. Build second.',
      story: 'Apple\'s first sale wasn\'t a product on a shelf — the Byte Shop ordered 50 computers BEFORE they were built. Jobs and Wozniak used the order to get parts on credit.',
      principle: 'A pre-sale is proof. Build with the customer\'s money, not your savings.',
      action: 'Next proposal: offer a deposit-to-start structure. The deposit IS the commitment.' },
    { founder: 'Warren Buffett', co: 'Berkshire Hathaway', title: 'Compounding beats intensity.',
      story: 'Buffett bought his first stock at 11 and ran paper routes as a kid. His fortune isn\'t from one big win — it\'s from small gains compounding for 80 years without interruption.',
      principle: 'Consistency, uninterrupted, beats brilliance in bursts.',
      action: 'Protect your posting streak: batch 3 pieces of content today so a busy week never breaks the chain.' },
    { founder: 'Mark Cuban', co: 'MicroSolutions', title: 'Out-know everyone.',
      story: 'Cuban sold garbage bags door-to-door at 12. At MicroSolutions he read every software manual his competitors didn\'t. Clients paid the person who knew their problem best.',
      principle: 'The best-informed person in the room wins the deal.',
      action: 'Pick your niche and spend 30 minutes learning its biggest operational headache. Speak their language in your next post.' },
    { founder: 'Daymond John', co: 'FUBU', title: 'Start with what you have.',
      story: 'Daymond John sewed FUBU hats at home while working at Red Lobster, starting with about $40 of fabric. He mortgaged nothing at first — he used exactly what he had.',
      principle: 'The starting line is wherever you\'re standing.',
      action: 'You already have the OS, the site and the skills. Write one post today showing something you\'ve ALREADY built.' },
    { founder: 'Walt Disney', co: 'Disney', title: 'Survive the early flops.',
      story: 'Disney was told he "lacked imagination", and his first studio went bankrupt. The empire came AFTER the failure — because he kept making things anyway.',
      principle: 'Early failure is tuition, not a verdict.',
      action: 'Think of the last pitch that went nowhere. Extract one lesson from it, write it in your AI Hub, move on.' },
    { founder: 'Tony Robbins', co: 'Robbins Research', title: 'Success leaves clues.',
      story: 'Robbins was a janitor who couldn\'t afford college. His method: find people getting the results you want and model exactly what they do — then bring your own energy to it.',
      principle: 'Don\'t reinvent. Model the best, then add your flavour.',
      action: 'Find one agency or builder whose business you admire. Study their offer page for 15 minutes. Steal the structure, not the words.' },
    { founder: 'Ingvar Kamprad', co: 'IKEA', title: 'Cost innovation is innovation.',
      story: 'Kamprad started IKEA at 17 selling pens by mail. Flat-pack furniture happened when his team removed a table\'s legs to fit it in a car — cutting cost became the product itself.',
      principle: 'Being cheaper through cleverness (not corner-cutting) is a moat.',
      action: 'Your no-backend builds ARE your flat-pack. Mention "no bloated agency overheads" in your pricing story.' },
    { founder: 'Jack Ma', co: 'Alibaba', title: 'Rejection is redirection.',
      story: 'Jack Ma was rejected from dozens of jobs — including KFC, where 23 of 24 applicants got hired and he didn\'t. The English teacher built Alibaba by refusing to accept that "no" was final.',
      principle: 'Every no is data, not destiny.',
      action: 'Follow up with one lead who went quiet. A polite second touch wins deals the first message started.' },
    { founder: 'Larry Page & Sergey Brin', co: 'Google', title: 'Don\'t undervalue your asset.',
      story: 'In 1999 Google\'s founders tried to sell their engine to Excite for under $1 million. Excite said no. The thing they almost let go became one of the most valuable companies ever.',
      principle: 'You are probably underpricing what you build. Most builders do.',
      action: 'Review your last quote. Would the RIGHT client have paid 20% more? Adjust the next one.' },
    { founder: 'Reid Hoffman', co: 'LinkedIn', title: 'Ship before you\'re proud.',
      story: 'Hoffman\'s rule for LinkedIn: "If you\'re not embarrassed by the first version, you launched too late." Perfect is a form of hiding.',
      principle: 'Launch, learn, iterate. The market is the only real reviewer.',
      action: 'Whatever you\'re polishing right now — is it actually ready enough? Ship it today and improve it live.' },
    { founder: 'Yvon Chouinard', co: 'Patagonia', title: 'Values attract the tribe.',
      story: 'Chouinard sold climbing gear from the back of his car. Patagonia grew because it stood for something — customers joined a belief, not just a brand.',
      principle: 'People buy what you believe when you say it out loud.',
      action: 'Your motto — "service the community while we service your business" — post the story BEHIND it this week.' },
    { founder: 'Elon Musk', co: 'Zip2 → Tesla', title: 'Reinvest. Bet on yourself.',
      story: 'At Zip2, Musk slept in the office and showered at the YMCA. When PayPal sold, he rolled nearly everything into Tesla and SpaceX instead of cashing out comfortable.',
      principle: 'Early profits are fuel, not lifestyle.',
      action: 'Decide your reinvestment rule now — e.g. 30% of every build goes back into tools, ads or learning. Write it down.' },
    { founder: 'Oprah Winfrey', co: 'Harpo', title: 'Own the platform.',
      story: 'Oprah went from rural poverty to media empire — and the empire move was OWNING her show through Harpo instead of staying a paid host on someone else\'s network.',
      principle: 'Renting an audience is fine. Owning one is wealth.',
      action: 'Instagram is rented. Start collecting emails from day one — every brief and feedback form already captures them. Keep the list.' },
    { founder: 'Henry Ford', co: 'Ford', title: 'Fail, learn, systemise.',
      story: 'Ford\'s first two car companies failed. The third worked because he stopped obsessing over the car and obsessed over the LINE that built it — the assembly system changed the world.',
      principle: 'When the product struggles, fix the process behind it.',
      action: 'Map your build process start-to-finish in 6 steps. Find the ONE step that always slows you down. Fix that first.' },
    { founder: 'Andrew Carnegie', co: 'Carnegie Steel', title: 'Every job is the classroom.',
      story: 'Carnegie started as a bobbin boy earning $1.20 a week, then a telegraph messenger — where he memorised every business and businessman in Pittsburgh. Each "small" job built the network and knowledge for the empire.',
      principle: 'You\'re never just working — you\'re collecting assets: skills, names, trust.',
      action: 'Your day job is intel: note one system or process from it this week that a Groundwork client would pay for.' },
  ];

  /* ---------- state (persists + syncs via DB) ---------- */
  function state() {
    DB.coach = DB.coach || { doneDates: [], doneCount: 0, offset: 0 };
    return DB.coach;
  }
  const dayKey = () => new Date().toISOString().slice(0, 10);
  const dayOfYear = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);

  function todayLesson() {
    const s = state();
    return LESSONS[(dayOfYear() + (s.offset || 0)) % LESSONS.length];
  }

  function streak() {
    const dates = [...new Set(state().doneDates)].sort().reverse();
    if (!dates.length) return 0;
    let run = 0;
    const d = new Date();
    if (dates[0] !== dayKey()) d.setDate(d.getDate() - 1); // allow "yesterday" to keep a live streak
    for (const dateStr of dates) {
      if (dateStr === d.toISOString().slice(0, 10)) { run++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return run;
  }

  /* ---------- render ---------- */
  function card() {
    const s = state();
    const l = todayLesson();
    const doneToday = s.doneDates.includes(dayKey());
    const st = streak();
    return `<div class="span-12">${UI.card({
      title: 'Daily Coaching — The Founder\'s Corner', icon: 'zap',
      link: st ? `🔥 ${st}-day streak · ${s.doneCount} lessons done` : `${s.doneCount} lessons done`,
      body: `<div class="coach-wrap" style="display:flex;gap:22px;align-items:flex-start;flex-wrap:wrap">
        <div style="flex:1;min-width:260px">
          <div class="flex" style="gap:10px;margin-bottom:10px">
            ${UI.avatar(l.founder.split(/\s+/).map(w => w[0]).join('').slice(0, 2), 'a40', true)}
            <div class="stack" style="gap:0">
              <b style="font-size:15px">${UI.esc(l.title)}</b>
              <span class="tiny t3">${UI.esc(l.founder)} · ${UI.esc(l.co)}</span>
            </div>
          </div>
          <p class="small t2" style="line-height:1.7">${UI.esc(l.story)}</p>
          <p class="small" style="margin-top:10px;color:var(--accent);font-weight:550">📌 ${UI.esc(l.principle)}</p>
        </div>
        <div style="flex:1;min-width:240px;background:var(--card-2);border:1px solid var(--border);border-radius:var(--r-md);padding:15px 17px">
          <span class="label">Your move today</span>
          <p class="small" style="margin-top:7px;line-height:1.65;color:var(--text)">${UI.esc(l.action)}</p>
          <div class="flex" style="margin-top:14px;flex-wrap:wrap">
            <button class="btn sm ${doneToday ? '' : 'primary'}" data-coach-done ${doneToday ? 'disabled style="opacity:.6"' : ''}>${icon('check')}${doneToday ? 'Done today' : "I'm on it"}</button>
            <button class="btn sm" data-coach-task>${icon('tasks')}Make it a task</button>
            <button class="btn sm ghost" data-coach-next>${icon('refresh')}Another lesson</button>
          </div>
        </div>
      </div>`,
    })}</div>`;
  }

  function wire() {
    document.querySelector('[data-coach-done]')?.addEventListener('click', () => {
      const s = state();
      if (s.doneDates.includes(dayKey())) return;
      s.doneDates.push(dayKey());
      if (s.doneDates.length > 400) s.doneDates = s.doneDates.slice(-400);
      s.doneCount++;
      saveDB();
      App.refresh();
      UI.toast(streak() > 1 ? `🔥 ${streak()}-day streak — keep stacking` : 'Lesson locked in. See you tomorrow, champion.');
    });
    document.querySelector('[data-coach-task]')?.addEventListener('click', () => {
      const l = todayLesson();
      DB.tasks.unshift({
        id: uid('t'), title: `Coach: ${l.action.slice(0, 80)}${l.action.length > 80 ? '…' : ''}`,
        projectId: null, clientId: null, priority: 'Medium', due: 'Today',
        status: 'Todo', tags: ['coaching'], done: false,
      });
      saveDB();
      App.refresh();
      UI.toast('Coaching action added to today\'s tasks');
    });
    document.querySelector('[data-coach-next]')?.addEventListener('click', () => {
      state().offset = (state().offset || 0) + 1;
      saveDB();
      App.refresh();
    });
  }

  return { card, wire };
})();
