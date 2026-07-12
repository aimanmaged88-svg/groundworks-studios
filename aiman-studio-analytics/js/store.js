/* ============================================================
   STUDIO ANALYTICS — data store
   Seeded with realistic studio data; everything you add or edit
   is saved to your browser (localStorage). Export/import as JSON.
   ============================================================ */

const Store = (() => {
  const KEY = 'studio-analytics-v1';

  const seed = {
    transactions: [
      // ---- Income (client payments) ----
      { id: 'x1',  date: '2026-01-20', kind: 'Income',  who: 'Borealis SIL',     category: 'Retainer',   amount: 1800, note: 'Monthly retainer' },
      { id: 'x2',  date: '2026-01-28', kind: 'Income',  who: 'Life HQ sponsor',  category: 'Project',    amount: 3400, note: 'Personal OS build milestone' },
      { id: 'x3',  date: '2026-02-12', kind: 'Income',  who: 'Kahil Meats',      category: 'Deposit',    amount: 2100, note: 'Ordering app deposit' },
      { id: 'x4',  date: '2026-02-20', kind: 'Income',  who: 'Borealis SIL',     category: 'Retainer',   amount: 1800, note: 'Monthly retainer' },
      { id: 'x5',  date: '2026-02-25', kind: 'Income',  who: 'Your Voice',       category: 'Project',    amount: 2900, note: 'AAC app launch package' },
      { id: 'x6',  date: '2026-03-08', kind: 'Income',  who: 'Love of the Game', category: 'Project',    amount: 3100, note: 'Platform launch' },
      { id: 'x7',  date: '2026-03-20', kind: 'Income',  who: 'Borealis SIL',     category: 'Retainer',   amount: 1800, note: 'Monthly retainer' },
      { id: 'x8',  date: '2026-03-27', kind: 'Income',  who: 'Kahil Meats',      category: 'Milestone',  amount: 2500, note: 'Menu design approved' },
      { id: 'x9',  date: '2026-04-10', kind: 'Income',  who: 'Eagles Gym',       category: 'Deposit',    amount: 1750, note: 'Redesign concept' },
      { id: 'x10', date: '2026-04-20', kind: 'Income',  who: 'Borealis SIL',     category: 'Retainer',   amount: 1800, note: 'Monthly retainer' },
      { id: 'x11', date: '2026-04-28', kind: 'Income',  who: 'Life HQ sponsor',  category: 'Project',    amount: 2550, note: 'Calendar module' },
      { id: 'x12', date: '2026-05-07', kind: 'Income',  who: 'Love of the Game', category: 'Feature',    amount: 2400, note: 'Wed Night ladder' },
      { id: 'x13', date: '2026-05-19', kind: 'Income',  who: 'Crown Fencing',    category: 'Deposit',    amount: 2700, note: 'Quote platform deposit' },
      { id: 'x14', date: '2026-05-20', kind: 'Income',  who: 'Borealis SIL',     category: 'Retainer',   amount: 1800, note: 'Monthly retainer' },
      { id: 'x15', date: '2026-05-29', kind: 'Income',  who: 'Kahil Meats',      category: 'Milestone',  amount: 2000, note: 'Order flow build' },
      { id: 'x16', date: '2026-06-05', kind: 'Income',  who: 'Love of the Game', category: 'Feature',    amount: 3100, note: 'Merch store' },
      { id: 'x17', date: '2026-06-18', kind: 'Income',  who: 'Crown Fencing',    category: 'Milestone',  amount: 2700, note: 'Quote flow complete' },
      { id: 'x18', date: '2026-06-20', kind: 'Income',  who: 'Borealis SIL',     category: 'Retainer',   amount: 1800, note: 'Monthly retainer' },
      { id: 'x19', date: '2026-06-30', kind: 'Income',  who: 'Trained by Zee',   category: 'Deposit',    amount: 2000, note: 'Demo + concept' },
      { id: 'x20', date: '2026-07-01', kind: 'Income',  who: 'Love of the Game', category: 'Feature',    amount: 3100, note: 'AI team builder' },
      { id: 'x21', date: '2026-07-05', kind: 'Income',  who: 'Borealis SIL',     category: 'Retainer',   amount: 1800, note: 'Monthly retainer' },
      { id: 'x22', date: '2026-07-08', kind: 'Income',  who: 'Kahil Meats',      category: 'Milestone',  amount: 2400, note: 'Build verified' },

      // ---- Expenses ----
      { id: 'e1',  date: '2026-01-05', kind: 'Expense', who: 'Claude Max',       category: 'Software',       amount: 90,  note: 'AI subscription' },
      { id: 'e2',  date: '2026-01-12', kind: 'Expense', who: 'Netlify + Supabase', category: 'Infrastructure', amount: 67,  note: 'Hosting' },
      { id: 'e3',  date: '2026-01-25', kind: 'Expense', who: 'Adobe + Figma',    category: 'Software',       amount: 38,  note: 'Design tools' },
      { id: 'e4',  date: '2026-02-05', kind: 'Expense', who: 'Claude Max',       category: 'Software',       amount: 90,  note: 'AI subscription' },
      { id: 'e5',  date: '2026-02-14', kind: 'Expense', who: 'Domain renewals',  category: 'Infrastructure', amount: 54,  note: '3 domains' },
      { id: 'e6',  date: '2026-02-22', kind: 'Expense', who: 'IG boost',         category: 'Marketing',      amount: 80,  note: 'Your Voice launch' },
      { id: 'e7',  date: '2026-03-05', kind: 'Expense', who: 'Claude Max',       category: 'Software',       amount: 90,  note: 'AI subscription' },
      { id: 'e8',  date: '2026-03-15', kind: 'Expense', who: 'Coworking passes', category: 'Office',         amount: 75,  note: '3 day passes' },
      { id: 'e9',  date: '2026-03-28', kind: 'Expense', who: 'Netlify + Supabase', category: 'Infrastructure', amount: 67,  note: 'Hosting' },
      { id: 'e10', date: '2026-04-05', kind: 'Expense', who: 'Claude Max',       category: 'Software',       amount: 90,  note: 'AI subscription' },
      { id: 'e11', date: '2026-04-18', kind: 'Expense', who: 'Stock photos',     category: 'Marketing',      amount: 49,  note: 'Content pack' },
      { id: 'e12', date: '2026-05-05', kind: 'Expense', who: 'Claude Max',       category: 'Software',       amount: 90,  note: 'AI subscription' },
      { id: 'e13', date: '2026-05-20', kind: 'Expense', who: 'IG boost',         category: 'Marketing',      amount: 60,  note: 'LOTG ladder push' },
      { id: 'e14', date: '2026-05-26', kind: 'Expense', who: 'Coworking passes', category: 'Office',         amount: 75,  note: '3 day passes' },
      { id: 'e15', date: '2026-06-05', kind: 'Expense', who: 'Claude Max',       category: 'Software',       amount: 90,  note: 'AI subscription' },
      { id: 'e16', date: '2026-06-24', kind: 'Expense', who: 'IG boost',         category: 'Marketing',      amount: 60,  note: 'LOTG launch' },
      { id: 'e17', date: '2026-06-27', kind: 'Expense', who: 'Netlify + Supabase', category: 'Infrastructure', amount: 67,  note: 'Hosting' },
      { id: 'e18', date: '2026-07-01', kind: 'Expense', who: 'Domain renewals',  category: 'Infrastructure', amount: 54,  note: '3 domains' },
      { id: 'e19', date: '2026-07-03', kind: 'Expense', who: 'Stock photos',     category: 'Marketing',      amount: 49,  note: 'Content pack' },
      { id: 'e20', date: '2026-07-05', kind: 'Expense', who: 'Claude Max',       category: 'Software',       amount: 90,  note: 'AI subscription' },
      { id: 'e21', date: '2026-01-08', kind: 'Expense', who: 'MacBook Pro',      category: 'Equipment',      amount: 890, note: 'Payment plan instalment' },
      { id: 'e22', date: '2026-01-15', kind: 'Expense', who: 'Public liability insurance', category: 'Insurance', amount: 120, note: 'Monthly' },
      { id: 'e23', date: '2026-01-15', kind: 'Expense', who: 'Phone & internet', category: 'Office',         amount: 89,  note: 'Business share' },
      { id: 'e24', date: '2026-02-10', kind: 'Expense', who: 'Contractor — design', category: 'Contractors', amount: 850, note: 'Your Voice brand assets' },
      { id: 'e25', date: '2026-02-15', kind: 'Expense', who: 'Public liability insurance', category: 'Insurance', amount: 120, note: 'Monthly' },
      { id: 'e26', date: '2026-02-15', kind: 'Expense', who: 'Phone & internet', category: 'Office',         amount: 89,  note: 'Business share' },
      { id: 'e27', date: '2026-03-12', kind: 'Expense', who: 'Contractor — video edit', category: 'Contractors', amount: 650, note: 'LOTG launch reel' },
      { id: 'e28', date: '2026-03-15', kind: 'Expense', who: 'Public liability insurance', category: 'Insurance', amount: 120, note: 'Monthly' },
      { id: 'e29', date: '2026-03-15', kind: 'Expense', who: 'Phone & internet', category: 'Office',         amount: 89,  note: 'Business share' },
      { id: 'e30', date: '2026-04-09', kind: 'Expense', who: 'Studio monitor',   category: 'Equipment',      amount: 420, note: '27" 4K display' },
      { id: 'e31', date: '2026-04-15', kind: 'Expense', who: 'Public liability insurance', category: 'Insurance', amount: 120, note: 'Monthly' },
      { id: 'e32', date: '2026-04-15', kind: 'Expense', who: 'Phone & internet', category: 'Office',         amount: 89,  note: 'Business share' },
      { id: 'e33', date: '2026-05-11', kind: 'Expense', who: 'Contractor — design', category: 'Contractors', amount: 850, note: 'Crown Fencing logo rebuild' },
      { id: 'e34', date: '2026-05-15', kind: 'Expense', who: 'Public liability insurance', category: 'Insurance', amount: 120, note: 'Monthly' },
      { id: 'e35', date: '2026-05-15', kind: 'Expense', who: 'Phone & internet', category: 'Office',         amount: 89,  note: 'Business share' },
      { id: 'e36', date: '2026-06-10', kind: 'Expense', who: 'Contractor — copywriting', category: 'Contractors', amount: 700, note: 'Kahil Meats site copy' },
      { id: 'e37', date: '2026-06-15', kind: 'Expense', who: 'Public liability insurance', category: 'Insurance', amount: 120, note: 'Monthly' },
      { id: 'e38', date: '2026-06-15', kind: 'Expense', who: 'Phone & internet', category: 'Office',         amount: 89,  note: 'Business share' },
      { id: 'e39', date: '2026-07-02', kind: 'Expense', who: 'Tax agent',        category: 'Accounting',     amount: 380, note: 'FY25-26 return prep' },
      { id: 'e40', date: '2026-07-06', kind: 'Expense', who: 'Public liability insurance', category: 'Insurance', amount: 120, note: 'Monthly' },
      { id: 'e41', date: '2026-07-06', kind: 'Expense', who: 'Phone & internet', category: 'Office',         amount: 89,  note: 'Business share' },
    ],

    invoices: [
      { id: 'INV-1046', client: 'Kahil Meats',      amount: 4200, status: 'Draft',   due: '2026-07-15' },
      { id: 'INV-1045', client: 'Borealis SIL',     amount: 1800, status: 'Sent',    due: '2026-07-20' },
      { id: 'INV-1044', client: 'Love of the Game', amount: 3100, status: 'Paid',    due: '2026-07-01' },
      { id: 'INV-1043', client: 'Crown Fencing',    amount: 2700, status: 'Sent',    due: '2026-07-12' },
      { id: 'INV-1042', client: 'Eagles Gym',       amount: 1750, status: 'Overdue', due: '2026-06-28' },
      { id: 'INV-1041', client: 'Borealis SIL',     amount: 1800, status: 'Paid',    due: '2026-06-20' },
      { id: 'INV-1040', client: 'Love of the Game', amount: 3100, status: 'Paid',    due: '2026-06-01' },
    ],

    pipeline: [
      { id: 'pl1', client: 'Kahil Meats',      stage: 'Won',      value: 8400, next: 'Deploy + launch Jul 15' },
      { id: 'pl2', client: 'Crown Fencing',    stage: 'Review',   value: 5400, next: 'Sign-off due Jul 10' },
      { id: 'pl3', client: 'Trained by Zee',   stage: 'Proposal', value: 4800, next: 'Follow up Friday' },
      { id: 'pl4', client: 'Eagles Gym',       stage: 'Lead',     value: 3500, next: 'Nudge next week' },
      { id: 'pl5', client: 'Borealis SIL',     stage: 'Won',      value: 7200, next: 'AI summaries Jul 31' },
      { id: 'pl6', client: 'Love of the Game', stage: 'Won',      value: 6200, next: 'Season 2 Jul 24' },
      { id: 'pl7', client: 'NDIS starter kit', stage: 'Idea',     value: 9000, next: 'Productise Borealis build' },
    ],
  };

  let data = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.transactions && d.invoices && d.pipeline) return d;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(seed));
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }

  function add(table, row) {
    row.id = row.id || (table[0] + '-' + Date.now().toString(36));
    data[table].unshift(row);
    save();
    return row;
  }
  function remove(table, id) {
    data[table] = data[table].filter(r => r.id !== id);
    save();
  }
  function update(table, id, patch) {
    const r = data[table].find(r => r.id === id);
    if (r) { Object.assign(r, patch); save(); }
    return r;
  }
  function reset() { data = JSON.parse(JSON.stringify(seed)); save(); }
  function exportJSON() { return JSON.stringify(data, null, 2); }
  function importJSON(text) {
    const d = JSON.parse(text);
    if (!d.transactions || !d.invoices || !d.pipeline) throw new Error('Invalid file');
    data = d; save();
  }

  /* ---------- metrics ---------- */
  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function monthsInData() {
    const set = new Set(data.transactions.map(t => t.date.slice(0, 7)));
    return [...set].sort();
  }
  function monthLabel(ym) { return MONTH_LABELS[+ym.slice(5, 7) - 1]; }

  function seriesByMonth(kind) {
    const months = monthsInData();
    return {
      labels: months.map(monthLabel),
      values: months.map(m => data.transactions
        .filter(t => t.kind === kind && t.date.startsWith(m))
        .reduce((a, t) => a + (+t.amount || 0), 0)),
    };
  }
  const revenueByMonth = () => seriesByMonth('Income');
  const expensesByMonth = () => seriesByMonth('Expense');
  function profitByMonth() {
    const r = revenueByMonth(), e = expensesByMonth();
    return { labels: r.labels, values: r.values.map((v, i) => v - (e.values[i] || 0)) };
  }

  function groupSum(rows, keyFn, valFn) {
    const map = {};
    rows.forEach(r => { const k = keyFn(r); map[k] = (map[k] || 0) + valFn(r); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }
  const revenueByClient = () => groupSum(data.transactions.filter(t => t.kind === 'Income'), t => t.who, t => +t.amount || 0);
  const expensesByCategory = () => groupSum(data.transactions.filter(t => t.kind === 'Expense'), t => t.category, t => +t.amount || 0);
  const invoicesByStatus = () => groupSum(data.invoices, i => i.status, i => +i.amount || 0);
  const pipelineByStage = () => groupSum(data.pipeline, p => p.stage, p => +p.value || 0);

  function totals() {
    const rev = data.transactions.filter(t => t.kind === 'Income').reduce((a, t) => a + (+t.amount || 0), 0);
    const exp = data.transactions.filter(t => t.kind === 'Expense').reduce((a, t) => a + (+t.amount || 0), 0);
    const outstanding = data.invoices.filter(i => ['Sent', 'Overdue', 'Draft'].includes(i.status)).reduce((a, i) => a + (+i.amount || 0), 0);
    const overdue = data.invoices.filter(i => i.status === 'Overdue');
    const openPipeline = data.pipeline.filter(p => !['Won', 'Lost'].includes(p.stage)).reduce((a, p) => a + (+p.value || 0), 0);
    const months = monthsInData();
    const thisMonth = months[months.length - 1] || '';
    const revThisMonth = data.transactions.filter(t => t.kind === 'Income' && t.date.startsWith(thisMonth)).reduce((a, t) => a + (+t.amount || 0), 0);
    return {
      revenue: rev, expenses: exp, profit: rev - exp,
      roi: exp ? Math.round((rev - exp) / exp * 1000) / 10 : 0,
      margin: rev ? Math.round((rev - exp) / rev * 100) : 0,
      outstanding, overdueCount: overdue.length, overdueSum: overdue.reduce((a, i) => a + (+i.amount || 0), 0),
      openPipeline, revThisMonth, thisMonthLabel: thisMonth ? monthLabel(thisMonth) : '—',
    };
  }

  const fmt$ = n => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-AU');

  return {
    get: () => data, save, add, remove, update, reset, exportJSON, importJSON,
    revenueByMonth, expensesByMonth, profitByMonth,
    revenueByClient, expensesByCategory, invoicesByStatus, pipelineByStage,
    totals, fmt$, monthsInData, monthLabel,
  };
})();
