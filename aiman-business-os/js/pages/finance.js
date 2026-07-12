/* ============================================================
   Finance — cash flow, invoices, expenses, subscriptions, tax
   ============================================================ */

Pages.finance = () => {
  const f = DB.finance;
  const totalSubs = f.subscriptions.reduce((a, s) => a + s.cost, 0);
  const juneNet = f.income[5] - f.expenses[5];

  const openInv = DB.invoices.filter(i => ['Sent', 'Overdue', 'Draft'].includes(i.status));
  const outstanding = openInv.reduce((a, i) => a + (+i.amount || 0), 0);
  const overdueInv = DB.invoices.filter(i => i.status === 'Overdue');

  return pageHead('Finance', 'Cash in, cash out, and what\'s coming. Click an invoice status to move it along.',
    `<button class="btn primary" data-new-invoice>${icon('plus')}New invoice</button>`)

    + `<div class="stat-row">
      ${statTile('Profit YTD', fmt$(f.profitYTD), `across ${DB.clients.length} clients`, 'good', f.income.map((v, i) => v - f.expenses[i]))}
      ${statTile('Outstanding', fmt$(outstanding), overdueInv.length ? `${overdueInv.length} overdue — ${overdueInv.map(i => i.client).join(', ')}` : 'nothing overdue', 'warn', [2, 3, 2, 4, 3, 5, 6.25])}
      ${statTile('Monthly costs', fmt$(totalSubs), `${f.subscriptions.length} subscriptions`, '', [180, 195, 201, 206, 206, 206])}
      ${statTile('Tax set aside', fmt$(f.taxEstimate), '25% of YTD profit', '', [2, 3.5, 5, 6.2, 7.8, 9.6].map(x => x * 1000))}
    </div>

    <div class="dash-grid">
      <div class="span-8">${UI.card({
        title: 'Cash Flow', icon: 'trendUp',
        body: `<div class="spread" style="margin-bottom:14px">
            <div><div class="chart-head-val">${fmt$(juneNet)}</div><div class="small t3">Net, June — best month yet</div></div>
            ${Charts.legend([{ color: 'var(--series-1)', label: 'Income' }, { color: 'var(--series-2)', label: 'Expenses' }])}
          </div>
          ${Charts.cashflow(f.months, f.income, f.expenses, { format: fmt$ })}`,
      })}</div>

      <div class="span-4">${UI.card({
        title: 'Upcoming Payments', icon: 'clock',
        body: f.upcoming.map(u => `
          <div class="row">
            <div class="row-main"><div class="row-title">${UI.esc(u.name)}</div><div class="row-sub">${u.date}</div></div>
            <span class="strong num small">${fmt$(u.amount)}</span>
          </div>`).join('')
          + `<hr class="divider">
          <div class="spread">
            <span class="small t3">Quarterly tax estimate</span>
            <span class="badge warn">${fmt$(2394)} · Jul 28</span>
          </div>`,
      })}</div>

      <div class="span-7">${UI.card({
        title: 'Invoices', icon: 'receipt',
        body: `<div style="overflow-x:auto"><table class="table">
          <thead><tr><th>Invoice</th><th>Client</th><th>Status</th><th>Due</th><th>Amount</th><th></th></tr></thead>
          <tbody>${DB.invoices.map(i => `<tr>
            <td class="strong">${UI.esc(i.id)}</td><td>${UI.esc(i.client)}</td>
            <td><button data-inv-status="${UI.esc(i.id)}" title="Click to change status" style="cursor:pointer">${UI.statusBadge(i.status)}</button></td>
            <td>${UI.esc(i.due)}</td>
            <td><span class="strong num">${fmt$(i.amount)}</span></td>
            <td style="width:34px"><button class="row-del" data-del-invoice="${UI.esc(i.id)}" title="Delete">${icon('x')}</button></td>
          </tr>`).join('')}</tbody>
        </table></div>`,
      })}</div>

      <div class="span-5">
        ${UI.card({
          title: 'Subscriptions', icon: 'creditCard',
          body: f.subscriptions.map(s => `
            <div class="sub-row">
              <span class="sub-logo">${s.logo}</span>
              <div class="row-main"><div class="row-title">${UI.esc(s.name)}</div><div class="row-sub">${s.cycle}</div></div>
              <span class="strong num small">${fmt$(s.cost)}</span>
            </div>`).join('')
            + `<hr class="divider"><div class="spread"><span class="small t2">Total / month</span><b class="num">${fmt$(totalSubs)}</b></div>`,
        })}
      </div>

      <div class="span-7">${UI.card({
        title: 'Recent Expenses', icon: 'arrowDown',
        body: UI.table(['Expense', 'Category', 'Date', 'Amount'],
          f.expensesList.map(e => [
            `<span class="strong">${UI.esc(e.name)}</span>`, `<span class="tag">${e.cat}</span>`, e.date,
            `<span class="strong num">${fmt$(e.amount)}</span>`,
          ])),
      })}</div>

      <div class="span-5">${UI.card({
        title: 'Tax Estimate', icon: 'shield',
        body: `<div class="flex" style="gap:20px">
            ${Charts.ring(25, { size: 96, color: 'var(--warn)' })}
            <div class="stack" style="gap:4px">
              <b style="font-size:15px">${fmt$(DB.finance.taxEstimate)} set aside</b>
              <span class="small t2" style="line-height:1.55">Running at 25% of profit. Based on YTD numbers you're covered through Q1 — BAS estimate due Jul 28.</span>
            </div>
          </div>`,
      })}</div>
    </div>`;
};

Pages._mount.finance = () => {
  document.querySelector('[data-new-invoice]')?.addEventListener('click', () => Create.invoice());
  const CYCLE = ['Draft', 'Sent', 'Paid', 'Overdue'];
  document.querySelectorAll('[data-inv-status]').forEach(b =>
    b.addEventListener('click', () => {
      const inv = DB.invoices.find(i => i.id === b.dataset.invStatus);
      if (!inv) return;
      inv.status = CYCLE[(CYCLE.indexOf(inv.status) + 1) % CYCLE.length];
      saveDB(); App.refresh();
      UI.toast(`${inv.id} → ${inv.status}`);
    }));
  document.querySelectorAll('[data-del-invoice]').forEach(b =>
    b.addEventListener('click', () => {
      const inv = DB.invoices.find(i => i.id === b.dataset.delInvoice);
      if (inv && confirm(`Delete ${inv.id} (${fmt$(inv.amount)} — ${inv.client})?`)) {
        DB.invoices = DB.invoices.filter(i => i.id !== inv.id);
        saveDB(); App.refresh();
        UI.toast('Invoice deleted');
      }
    }));
};
