/* ============================================================
   STUDIO ANALYTICS — shell, views, data editor, Ask panel
   ============================================================ */

const App = (() => {
  const $ = Store.fmt$;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  const I = {
    logo: '<svg viewBox="0 0 100 100" fill="none"><rect width="100" height="100" rx="22" fill="rgba(255,255,255,.18)"/><path d="M22 72 42 40l14 18 12-26 10 40z" fill="white"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
    dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    report: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 13v4M12 9v8M17 5v12"/></svg>',
    data: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a1 1 0 0 1 .93.63l1.6 4.1a1 1 0 0 0 .57.57l4.1 1.6a1 1 0 0 1 0 1.86l-4.1 1.6a1 1 0 0 0-.57.57l-1.6 4.1a1 1 0 0 1-1.86 0l-1.6-4.1a1 1 0 0 0-.57-.57l-4.1-1.6a1 1 0 0 1 0-1.86l4.1-1.6a1 1 0 0 0 .57-.57l1.6-4.1A1 1 0 0 1 12 3z"/><path d="M19 3v3M20.5 4.5h-3"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 12a9 9 0 0 1 15.5-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.4L3 16M3 21v-5h5"/></svg>',
  };

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dash' },
    { id: 'reports', label: 'Reports', icon: 'report' },
    { id: 'data', label: 'Data', icon: 'data' },
    { id: 'ask', label: 'Ask AI', icon: 'ai' },
  ];

  let view = 'dashboard';
  let dataTab = 0;
  let askOpen = window.innerWidth > 1180;
  let askBooted = false;
  let currentReport = null;

  /* ================= shell ================= */
  function boot() {
    document.body.innerHTML = `
      <header class="topbar">
        <span class="logo">${I.logo}<span>Studio&nbsp;Analytics</span></span>
        <span class="tb-tag">AIMAN STUDIO</span>
        <button class="tb-search" id="tb-ask-shortcut">${I.search}<span>Ask anything about your business…</span></button>
        <button class="tb-btn" id="tb-refresh" title="Refresh">${I.refresh}</button>
        <span class="tb-avatar">AM</span>
      </header>
      <div class="frame">
        <nav class="rail">
          <button class="create-btn" id="create-btn">${I.plus}<span>Create</span></button>
          ${NAV.map(n => `<button class="rail-item ${n.id === view ? 'active' : ''}" data-view="${n.id}">${I[n.icon]}<span>${n.label}</span></button>`).join('')}
        </nav>
        <div class="canvas"><div class="canvas-scroll" id="canvas"></div></div>
        <aside class="ask-panel ${askOpen ? '' : 'hidden'}" id="ask-panel">
          <div class="ask-head">
            <span class="ask-logo">${I.ai}</span>
            <div><b>Ask AI</b><div class="tiny t2">Answers from your live data</div></div>
            <button class="ask-close" id="ask-close">${I.x}</button>
          </div>
          <div class="ask-body" id="ask-body"></div>
          <div class="ask-input-row">
            <input class="ask-input" id="ask-input" placeholder="e.g. show revenue by client" autocomplete="off">
            <button class="ask-send" id="ask-send">${I.send}</button>
          </div>
        </aside>
      </div>
      <button class="ask-fab" id="ask-fab" style="display:${askOpen ? 'none' : 'flex'}">${I.ai} Ask AI</button>`;

    document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
    document.getElementById('ask-close').addEventListener('click', () => toggleAsk(false));
    document.getElementById('ask-fab').addEventListener('click', () => toggleAsk(true));
    document.getElementById('tb-ask-shortcut').addEventListener('click', () => { toggleAsk(true); document.getElementById('ask-input').focus(); });
    document.getElementById('tb-refresh').addEventListener('click', () => { render(); toast('Refreshed from your data'); });
    document.getElementById('create-btn').addEventListener('click', () => openRowModal());

    const input = document.getElementById('ask-input');
    input.addEventListener('keydown', e => { if (e.key === 'Enter') sendAsk(); });
    document.getElementById('ask-send').addEventListener('click', sendAsk);

    bootAsk();
    render();
  }

  function go(v) {
    if (v === 'ask') { toggleAsk(true); document.getElementById('ask-input').focus(); return; }
    view = v; currentReport = null;
    document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === v));
    render();
  }

  function toggleAsk(open) {
    askOpen = open;
    document.getElementById('ask-panel').classList.toggle('hidden', !open);
    document.getElementById('ask-fab').style.display = open ? 'none' : 'flex';
    document.querySelectorAll('[data-view]').forEach(b => {
      if (b.dataset.view === 'ask') b.classList.toggle('active', open);
    });
  }

  function render() {
    const c = document.getElementById('canvas');
    c.scrollTop = 0;
    if (view === 'dashboard') c.innerHTML = dashboardView();
    if (view === 'reports') c.innerHTML = currentReport ? reportView(currentReport) : reportsView();
    if (view === 'data') { c.innerHTML = dataView(); wireData(); }
    if (view === 'reports') wireReports();
  }

  /* ================= dashboard ================= */
  function dashboardView() {
    const t = Store.totals();
    const rev = Store.revenueByMonth();
    const exp = Store.expensesByMonth();
    const rc = Store.revenueByClient();
    const inv = Store.get().invoices.filter(i => i.status !== 'Paid');

    return `<div class="page">
      <div class="page-head">
        <div>
          <div class="page-title">Executive Dashboard</div>
          <div class="page-sub">Live from your data · ${new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <div class="page-actions">
          <button class="btn" data-goto="data">${I.data} Edit data</button>
          <button class="btn primary" data-open-ask>${I.ai} Ask AI</button>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi mint">
          <div class="kpi-label">Revenue in 2026</div>
          <div class="kpi-value num">${$(t.revenue)} ${I.up}</div>
          <div class="kpi-sub">${$(t.revThisMonth)} in ${t.thisMonthLabel} so far</div>
          <div style="margin-top:10px">${Charts.spark(rev.values, { color: '#156A3D' })}</div>
        </div>
        <div class="kpi lav">
          <div class="kpi-label">Profit margin</div>
          <div class="kpi-value num">${t.margin}% ${I.up}</div>
          <div class="kpi-sub">${$(t.profit)} net profit YTD</div>
          <div style="margin-top:10px">${Charts.spark(Store.profitByMonth().values, { color: '#5B3E8E' })}</div>
        </div>
        <div class="kpi peach">
          <div class="kpi-label">Outstanding invoices</div>
          <div class="kpi-value num">${$(t.outstanding)}</div>
          <div class="kpi-sub">${t.overdueCount ? t.overdueCount + ' overdue · ' + $(t.overdueSum) : 'nothing overdue'}</div>
          <div style="margin-top:10px">${Charts.spark(inv.map(i => +i.amount), { color: '#96520E' })}</div>
        </div>
        <div class="kpi sky">
          <div class="kpi-label">Open pipeline</div>
          <div class="kpi-value num">${$(t.openPipeline)}</div>
          <div class="kpi-sub">${Store.get().pipeline.filter(p => !['Won', 'Lost'].includes(p.stage)).length} opportunities in play</div>
          <div style="margin-top:10px">${Charts.spark(Store.get().pipeline.map(p => +p.value), { color: '#1D4FA8' })}</div>
        </div>
      </div>

      <div class="grid g2" style="margin-bottom:14px">
        <div class="card">
          <div class="card-head"><span class="card-title">Sales Trend by Month</span>
            ${Charts.legend([{ color: 'var(--s1)', label: 'Revenue' }, { color: 'var(--s5)', label: 'Expenses' }])}</div>
          ${Charts.lines(rev.labels, [
            { name: 'Revenue', values: rev.values, color: 'var(--s1)' },
            { name: 'Expenses', values: exp.values, color: 'var(--s5)' },
          ], { format: $ })}
        </div>
        <div class="card">
          <div class="card-head"><span class="card-title">Revenue by Client</span><a class="card-link" data-report="rev-client" href="javascript:void(0)">Full report</a></div>
          ${Charts.hbars(rc.slice(0, 6), { format: $ })}
        </div>
      </div>

      <div class="grid g3">
        <div class="card">
          <div class="card-head"><span class="card-title">Invoices by Status</span></div>
          ${Charts.donut(Store.invoicesByStatus(), { format: $, size: 150 })}
        </div>
        <div class="card">
          <div class="card-head"><span class="card-title">Expenses by Category</span></div>
          ${Charts.donut(Store.expensesByCategory(), { format: $, size: 150 })}
        </div>
        <div class="card">
          <div class="card-head"><span class="card-title">Pipeline by Stage</span></div>
          ${Charts.donut(Store.pipelineByStage(), { format: $, size: 150 })}
        </div>
      </div>

      <div class="card" style="margin-top:14px">
        <div class="card-head"><span class="card-title">Open Invoices</span><a class="card-link" data-goto="data" href="javascript:void(0)">Manage</a></div>
        ${inv.length ? `<div class="table-wrap"><table class="table">
          <thead><tr><th>Invoice</th><th>Client</th><th>Status</th><th>Due</th><th class="right">Amount</th></tr></thead>
          <tbody>${inv.map(i => `<tr><td class="strong">${i.id}</td><td>${esc(i.client)}</td><td>${statusPill(i.status)}</td><td>${fmtDate(i.due)}</td><td class="right strong num">${$(i.amount)}</td></tr>`).join('')}</tbody>
        </table></div>` : `<div class="empty"><b>All invoices paid</b>Nothing outstanding right now.</div>`}
      </div>
    </div>`;
  }

  /* ================= reports ================= */
  const REPORTS = [
    { id: 'rev-month', name: 'Revenue by Month', desc: 'Monthly income trend', color: 'var(--s1)', bg: '#E7EDFB' },
    { id: 'rev-quarter', name: 'Revenue by Quarter', desc: 'Quarterly rollup', color: 'var(--s1)', bg: '#E7EDFB' },
    { id: 'rev-client', name: 'Revenue by Client', desc: 'Who pays the bills', color: 'var(--s2)', bg: '#E3F4E9' },
    { id: 'profit', name: 'Profit Trend', desc: 'Net after expenses', color: 'var(--s2)', bg: '#E3F4E9' },
    { id: 'exp-cat', name: 'Expenses by Category', desc: 'Where money goes', color: 'var(--s5)', bg: '#FBE7E7' },
    { id: 'inv-status', name: 'Invoices by Status', desc: 'Paid, sent, overdue', color: 'var(--s3)', bg: '#FCF0DA' },
    { id: 'pipe', name: 'Pipeline by Stage', desc: 'Deals in motion', color: 'var(--s4)', bg: '#EFE7F7' },
  ];

  function reportsView() {
    return `<div class="page">
      <div class="page-head">
        <div><div class="page-title">Reports</div><div class="page-sub">Prebuilt views over your live data — click any to open.</div></div>
        <div class="page-actions"><button class="btn primary" data-open-ask>${I.ai} Ask for a custom one</button></div>
      </div>
      <div class="tile-grid">
        ${REPORTS.map(r => `<div class="tile" data-report="${r.id}">
          <span class="t-icon" style="background:${r.bg};color:${r.color}">${I.report}</span>
          <b>${r.name}</b><div class="tiny t3">${r.desc}</div>
        </div>`).join('')}
      </div>
    </div>`;
  }

  function reportView(id) {
    const r = REPORTS.find(x => x.id === id);
    let body = '', table = '';
    const wrap = (chart, rows, cols) => {
      body = chart;
      table = `<div class="card" style="margin-top:14px"><div class="card-head"><span class="card-title">Data behind this report</span></div>
        <div class="table-wrap"><table class="table"><thead><tr>${cols.map(c => `<th class="${c === 'Amount' ? 'right' : ''}">${c}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(row => `<tr>${row.map((c, i) => `<td class="${i === row.length - 1 ? 'right strong num' : i === 0 ? 'strong' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
    };

    if (id === 'rev-month') { const d = Store.revenueByMonth(); wrap(Charts.bars(d.labels, d.values, { format: $, name: 'Revenue', height: 260 }), d.labels.map((l, i) => [l, $(d.values[i])]), ['Month', 'Amount']); }
    if (id === 'rev-quarter') { const d = Store.revenueByMonth(); const labels = [], values = []; for (let i = 0; i < d.values.length; i += 3) { labels.push('Q' + (Math.floor(i / 3) + 1)); values.push(d.values.slice(i, i + 3).reduce((a, b) => a + b, 0)); } wrap(Charts.bars(labels, values, { format: $, name: 'Revenue', height: 260 }), labels.map((l, i) => [l, $(values[i])]), ['Quarter', 'Amount']); }
    if (id === 'rev-client') { const d = Store.revenueByClient(); wrap(Charts.hbars(d, { format: $ }), d.map(([k, v]) => [esc(k), $(v)]), ['Client', 'Amount']); }
    if (id === 'profit') { const d = Store.profitByMonth(); wrap(Charts.lines(d.labels, [{ name: 'Profit', values: d.values, color: 'var(--s2)' }], { format: $, height: 260 }), d.labels.map((l, i) => [l, $(d.values[i])]), ['Month', 'Amount']); }
    if (id === 'exp-cat') { const d = Store.expensesByCategory(); wrap(Charts.donut(d, { format: $ }), d.map(([k, v]) => [esc(k), $(v)]), ['Category', 'Amount']); }
    if (id === 'inv-status') { const d = Store.invoicesByStatus(); wrap(Charts.donut(d, { format: $ }), d.map(([k, v]) => [statusPill(k), $(v)]), ['Status', 'Amount']); }
    if (id === 'pipe') { const d = Store.pipelineByStage(); wrap(Charts.donut(d, { format: $ }), d.map(([k, v]) => [esc(k), $(v)]), ['Stage', 'Amount']); }

    return `<div class="page">
      <div class="page-head">
        <div><a class="card-link" data-report-back href="javascript:void(0)">← All reports</a>
        <div class="page-title" style="margin-top:4px">${r.name}</div><div class="page-sub">${r.desc}</div></div>
      </div>
      <div class="card">${body}</div>
      ${table}
    </div>`;
  }

  function wireReports() {
    document.querySelectorAll('[data-report]').forEach(t => t.addEventListener('click', () => {
      currentReport = t.dataset.report; view = 'reports'; render(); wireReports();
    }));
    document.querySelector('[data-report-back]')?.addEventListener('click', () => { currentReport = null; render(); wireReports(); });
  }

  /* ================= data editor ================= */
  const TABLES = [
    { key: 'transactions', label: 'Transactions', cols: ['Date', 'Type', 'Client / Vendor', 'Category', 'Note', 'Amount', ''] },
    { key: 'invoices', label: 'Invoices', cols: ['Invoice', 'Client', 'Status', 'Due', 'Amount', ''] },
    { key: 'pipeline', label: 'Pipeline', cols: ['Client / Deal', 'Stage', 'Next step', 'Value', ''] },
  ];

  function dataView() {
    const t = TABLES[dataTab];
    const rows = Store.get()[t.key];
    return `<div class="page">
      <div class="page-head">
        <div><div class="page-title">Data</div><div class="page-sub">Your numbers, editable. Saved automatically in this browser.</div></div>
        <div class="page-actions">
          <button class="btn" id="btn-export">${I.download} Export</button>
          <button class="btn" id="btn-import">${I.upload} Import</button>
          <button class="btn primary" id="btn-add-row">${I.plus} Add ${t.label.slice(0, -1).toLowerCase()}</button>
        </div>
      </div>
      <div class="seg" style="margin-bottom:16px">${TABLES.map((x, i) => `<button class="${i === dataTab ? 'active' : ''}" data-dtab="${i}">${x.label}</button>`).join('')}</div>
      <div class="card" style="padding:6px 8px">
        <div class="table-wrap"><table class="table">
          <thead><tr>${t.cols.map((c, i) => `<th class="${c === 'Amount' || c === 'Value' ? 'right' : ''}">${c}</th>`).join('')}</tr></thead>
          <tbody>
          ${rows.length ? rows.map(r => dataRow(t.key, r)).join('') : `<tr><td colspan="${t.cols.length}"><div class="empty"><b>No rows yet</b>Add your first ${t.label.slice(0, -1).toLowerCase()} to see it flow into the dashboard.</div></td></tr>`}
          </tbody>
        </table></div>
      </div>
      <div class="tiny t3" style="margin-top:12px">Tip: everything you change here updates the dashboard, reports and Ask AI instantly. <a class="card-link" id="btn-reset" href="javascript:void(0)">Reset to sample data</a></div>
      <input type="file" id="import-file" accept=".json" style="display:none">
    </div>`;
  }

  function dataRow(key, r) {
    const del = `<td class="right"><button class="btn sm danger-ghost" data-del="${r.id}" title="Delete">${I.trash}</button></td>`;
    if (key === 'transactions') return `<tr>
      <td>${fmtDate(r.date)}</td>
      <td>${r.kind === 'Income' ? '<span class="pill good"><i></i>Income</span>' : '<span class="pill bad"><i></i>Expense</span>'}</td>
      <td class="strong">${esc(r.who)}</td><td>${esc(r.category)}</td><td class="t3">${esc(r.note || '')}</td>
      <td class="right strong num">${$(r.amount)}</td>${del}</tr>`;
    if (key === 'invoices') return `<tr>
      <td class="strong">${esc(r.id)}</td><td>${esc(r.client)}</td><td>${statusPill(r.status)}</td>
      <td>${fmtDate(r.due)}</td><td class="right strong num">${$(r.amount)}</td>${del}</tr>`;
    return `<tr>
      <td class="strong">${esc(r.client)}</td><td>${statusPill(r.stage)}</td><td class="t3">${esc(r.next || '')}</td>
      <td class="right strong num">${$(r.value)}</td>${del}</tr>`;
  }

  function wireData() {
    document.querySelectorAll('[data-dtab]').forEach(b => b.addEventListener('click', () => { dataTab = +b.dataset.dtab; render(); }));
    document.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      Store.remove(TABLES[dataTab].key, b.dataset.del);
      render(); toast('Row deleted');
    }));
    document.getElementById('btn-add-row').addEventListener('click', () => openRowModal(TABLES[dataTab].key));
    document.getElementById('btn-export').addEventListener('click', () => {
      const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'studio-analytics-data.json';
      a.click();
      toast('Data exported');
    });
    const file = document.getElementById('import-file');
    document.getElementById('btn-import').addEventListener('click', () => file.click());
    file.addEventListener('change', () => {
      const f = file.files[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try { Store.importJSON(reader.result); render(); toast('Data imported'); }
        catch (e) { toast('That file doesn\'t look like a Studio Analytics export'); }
      };
      reader.readAsText(f);
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('Replace all current data with the sample data?')) { Store.reset(); render(); toast('Reset to sample data'); }
    });
  }

  /* ---- add-row modal ---- */
  function openRowModal(tableKey) {
    tableKey = tableKey || TABLES[dataTab]?.key || 'transactions';
    const today = new Date().toISOString().slice(0, 10);
    const forms = {
      transactions: {
        title: 'Add transaction',
        fields: `
          <label class="field"><span class="label">Date</span><input class="input" name="date" type="date" value="${today}" required></label>
          <label class="field"><span class="label">Type</span><select class="select" name="kind"><option>Income</option><option>Expense</option></select></label>
          <label class="field"><span class="label">Client / Vendor</span><input class="input" name="who" placeholder="e.g. Kahil Meats" required></label>
          <label class="field"><span class="label">Category</span><input class="input" name="category" placeholder="e.g. Project, Software" required></label>
          <label class="field full"><span class="label">Note</span><input class="input" name="note" placeholder="Optional"></label>
          <label class="field full"><span class="label">Amount ($)</span><input class="input" name="amount" type="number" min="0" step="1" placeholder="0" required></label>`,
        build: f => ({ date: f.date, kind: f.kind, who: f.who, category: f.category, note: f.note, amount: +f.amount }),
      },
      invoices: {
        title: 'Add invoice',
        fields: `
          <label class="field"><span class="label">Invoice #</span><input class="input" name="id" placeholder="INV-1047" required></label>
          <label class="field"><span class="label">Client</span><input class="input" name="client" required></label>
          <label class="field"><span class="label">Status</span><select class="select" name="status"><option>Draft</option><option>Sent</option><option>Paid</option><option>Overdue</option></select></label>
          <label class="field"><span class="label">Due date</span><input class="input" name="due" type="date" value="${today}" required></label>
          <label class="field full"><span class="label">Amount ($)</span><input class="input" name="amount" type="number" min="0" step="1" required></label>`,
        build: f => ({ id: f.id, client: f.client, status: f.status, due: f.due, amount: +f.amount }),
      },
      pipeline: {
        title: 'Add opportunity',
        fields: `
          <label class="field full"><span class="label">Client / Deal</span><input class="input" name="client" required></label>
          <label class="field"><span class="label">Stage</span><select class="select" name="stage"><option>Idea</option><option>Lead</option><option>Proposal</option><option>Review</option><option>Won</option><option>Lost</option></select></label>
          <label class="field"><span class="label">Value ($)</span><input class="input" name="value" type="number" min="0" step="1" required></label>
          <label class="field full"><span class="label">Next step</span><input class="input" name="next" placeholder="e.g. Follow up Friday"></label>`,
        build: f => ({ client: f.client, stage: f.stage, value: +f.value, next: f.next }),
      },
    };
    const cfg = forms[tableKey];
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = `<div class="modal">
      <div class="modal-head"><b>${cfg.title}</b><button class="ask-close" data-close>${I.x}</button></div>
      <div class="modal-body"><form id="row-form"><div class="form-grid">${cfg.fields}</div>
        <div class="modal-foot"><button type="button" class="btn" data-close>Cancel</button><button type="submit" class="btn primary">${I.check} Save</button></div>
      </form></div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('mousedown', e => { if (e.target === ov) ov.remove(); });
    ov.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => ov.remove()));
    ov.querySelector('#row-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target).entries());
      Store.add(tableKey, cfg.build(f));
      ov.remove();
      view = 'data';
      dataTab = TABLES.findIndex(t => t.key === tableKey);
      document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === 'data'));
      render();
      toast('Saved — dashboard updated');
    });
    ov.querySelector('input, select')?.focus();
  }

  /* ================= Ask AI ================= */
  function bootAsk() {
    if (askBooted) return;
    askBooted = true;
    aiSay(`Hello Aiman! 👋 Ask me anything about your business — I answer with live charts from your own data.`, null, Ask.SUGGESTIONS.slice(0, 4));
  }

  function sendAsk() {
    const input = document.getElementById('ask-input');
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    toggleAsk(true);
    const body = document.getElementById('ask-body');
    body.insertAdjacentHTML('beforeend', `<div class="msg me"><span class="m-av">AM</span><div class="m-body"><div class="m-bubble">${esc(q)}</div></div></div>`);
    const typing = document.createElement('div');
    typing.className = 'msg ai';
    typing.innerHTML = `<span class="m-av">AI</span><div class="m-body"><div class="m-bubble typing"><i></i><i></i><i></i></div></div>`;
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
    setTimeout(() => {
      typing.remove();
      const a = Ask.answer(q);
      aiSay(a.text, a.widgetTitle ? { title: a.widgetTitle, html: a.widgetHTML } : null, a.chips);
    }, 650 + Math.random() * 500);
  }

  function aiSay(text, widget, chips) {
    const body = document.getElementById('ask-body');
    let html = `<div class="msg ai"><span class="m-av">AI</span><div class="m-body"><div class="m-bubble">${text}</div>`;
    if (widget) html += `<div class="m-widget"><div class="w-title">${widget.title}</div>${widget.html}</div>`;
    if (chips) html += `<div class="chips" style="margin-top:10px">${chips.map(c => `<button class="chip" data-chip="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
    html += `</div></div>`;
    body.insertAdjacentHTML('beforeend', html);
    body.querySelectorAll('[data-chip]').forEach(b => {
      if (b.dataset.wired) return; b.dataset.wired = '1';
      b.addEventListener('click', () => { document.getElementById('ask-input').value = b.dataset.chip; sendAsk(); });
    });
    body.scrollTop = body.scrollHeight;
  }

  /* ================= shared ================= */
  function statusPill(status) {
    const map = { Paid: 'good', Won: 'good', Sent: 'info', Review: 'info', Proposal: 'warn', Overdue: 'bad', Lost: 'bad', Draft: 'gray', Lead: 'gray', Idea: 'gray' };
    return `<span class="pill ${map[status] || 'gray'}"><i></i>${esc(status)}</span>`;
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d) ? esc(iso) : d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
  }
  function toast(msg) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${I.check}<span>${esc(msg)}</span>`;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 320); }, 2400);
  }

  /* delegated: dashboard buttons */
  document.addEventListener('click', e => {
    const goBtn = e.target.closest('[data-goto]');
    if (goBtn) go(goBtn.dataset.goto);
    if (e.target.closest('[data-open-ask]')) { toggleAsk(true); document.getElementById('ask-input').focus(); }
  });

  document.addEventListener('DOMContentLoaded', boot);
  return { statusPill, go };
})();
