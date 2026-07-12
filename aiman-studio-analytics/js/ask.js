/* ============================================================
   ASK AI — natural-language questions over your own data.
   Runs entirely in the browser: a query engine over the Store,
   answering with live charts, tables and plain English.
   ============================================================ */

const Ask = (() => {
  const $ = Store.fmt$;

  const SUGGESTIONS = [
    'Show revenue by month',
    'Revenue by client',
    'Which invoices are overdue?',
    'Profit trend this year',
    'Where is my money going?',
    'Show my open pipeline',
    'What is my ROI?',
    'Best month so far',
  ];

  function answer(q) {
    const s = q.toLowerCase();
    const has = (...words) => words.some(w => s.includes(w));

    /* ---- invoices ---- */
    if (has('invoice', 'unpaid', 'owed', 'owes', 'outstanding')) {
      if (has('status', 'breakdown', 'split')) {
        return widget('Invoices by status', Charts.donut(Store.invoicesByStatus(), { format: $ }),
          `Here's every invoice grouped by status. ${overdueLine()}`);
      }
      const inv = Store.get().invoices.filter(i => has('overdue') ? i.status === 'Overdue' : i.status !== 'Paid');
      const label = has('overdue') ? 'Overdue invoices' : 'Open invoices';
      if (!inv.length) return text(`Good news — no ${label.toLowerCase()} right now. Everything is paid up. 🎉`);
      const total = inv.reduce((a, i) => a + +i.amount, 0);
      return widget(label, invoiceTable(inv),
        `You have <b>${inv.length} ${label.toLowerCase()}</b> worth <b>${$(total)}</b>. ${overdueLine()}`);
    }

    /* ---- pipeline / leads ---- */
    if (has('pipeline', 'lead', 'deals', 'proposal', 'opportunit')) {
      const open = Store.get().pipeline.filter(p => !['Won', 'Lost'].includes(p.stage));
      const t = Store.totals();
      if (has('stage', 'status', 'breakdown')) {
        return widget('Pipeline by stage', Charts.donut(Store.pipelineByStage(), { format: $ }),
          `Your pipeline split by stage — <b>${$(t.openPipeline)}</b> of it is still open.`);
      }
      return widget('Open pipeline', Charts.hbars(open.map(p => [p.client, +p.value]), { color: 'var(--s4)', format: $ }),
        `You have <b>${open.length} open opportunities</b> worth <b>${$(t.openPipeline)}</b>. Closest to closing: <b>${open[0]?.client || '—'}</b> (${open[0]?.next || ''}).`);
    }

    /* ---- expenses ---- */
    if (has('expense', 'spend', 'cost', 'money going', 'burn')) {
      if (has('month', 'trend', 'over time')) {
        const e = Store.expensesByMonth();
        return widget('Expenses by month', Charts.lines(e.labels, [{ name: 'Expenses', values: e.values, color: 'var(--s5)' }], { format: $ }),
          `Expenses month by month. You're averaging <b>${$(avg(e.values))}</b> a month.`);
      }
      const cats = Store.expensesByCategory();
      return widget('Expenses by category', Charts.donut(cats, { format: $ }),
        `Your biggest cost is <b>${cats[0]?.[0] || '—'}</b> at <b>${$(cats[0]?.[1] || 0)}</b>. Total spend so far: <b>${$(Store.totals().expenses)}</b>.`);
    }

    /* ---- profit / roi / margin ---- */
    if (has('roi', 'return on')) {
      const t = Store.totals();
      return text(`Your ROI is <b>${t.roi}%</b> — you've earned ${$(t.revenue)} on ${$(t.expenses)} of costs, keeping <b>${$(t.profit)}</b>. Profit margin: <b>${t.margin}%</b>.`);
    }
    if (has('profit', 'net', 'margin')) {
      const p = Store.profitByMonth();
      const t = Store.totals();
      return widget('Profit by month', Charts.lines(p.labels, [{ name: 'Profit', values: p.values, color: 'var(--s2)' }], { format: $ }),
        `Net profit is <b>${$(t.profit)}</b> year to date at a <b>${t.margin}% margin</b>. ${bestLine(p)}`);
    }

    /* ---- revenue ---- */
    if (has('revenue', 'income', 'sales', 'earn', 'made')) {
      if (has('client', 'who', 'customer')) {
        const rc = Store.revenueByClient();
        return widget('Revenue by client', Charts.hbars(rc, { format: $ }),
          `<b>${rc[0]?.[0] || '—'}</b> is your top client at <b>${$(rc[0]?.[1] || 0)}</b> — ${Math.round((rc[0]?.[1] || 0) / Math.max(1, Store.totals().revenue) * 100)}% of all revenue.`);
      }
      if (has('this month', 'current month')) {
        const t = Store.totals();
        return text(`Revenue in ${t.thisMonthLabel} so far: <b>${$(t.revThisMonth)}</b>.`);
      }
      const r = Store.revenueByMonth();
      if (has('quarter')) {
        const q = toQuarters(r);
        return widget('Revenue by quarter', Charts.bars(q.labels, q.values, { format: $, name: 'Revenue' }),
          `Revenue rolled up by quarter. Total so far: <b>${$(Store.totals().revenue)}</b>.`);
      }
      return widget('Revenue by month', Charts.bars(r.labels, r.values, { format: $, name: 'Revenue' }),
        `Total revenue is <b>${$(Store.totals().revenue)}</b>. ${bestLine(r)}`);
    }

    /* ---- best / worst month ---- */
    if (has('best month', 'top month', 'strongest')) {
      const r = Store.revenueByMonth();
      return widget('Revenue by month', Charts.bars(r.labels, r.values, { format: $, name: 'Revenue' }), bestLine(r));
    }

    /* ---- clients generic ---- */
    if (has('client', 'customer')) {
      const rc = Store.revenueByClient();
      return widget('Revenue by client', Charts.hbars(rc, { format: $ }),
        `You've been paid by <b>${rc.length} clients</b> this year. <b>${rc[0]?.[0]}</b> leads at ${$(rc[0]?.[1])}.`);
    }

    /* ---- summary / how is business ---- */
    if (has('summary', 'overview', 'how is', 'how am i', 'health', 'doing')) {
      const t = Store.totals();
      const r = Store.revenueByMonth();
      return widget('Revenue by month', Charts.bars(r.labels, r.values, { format: $, name: 'Revenue' }),
        `The short version: <b>${$(t.revenue)}</b> revenue, <b>${$(t.profit)}</b> profit (${t.margin}% margin), <b>${$(t.outstanding)}</b> waiting in open invoices and <b>${$(t.openPipeline)}</b> in open pipeline. ${overdueLine()}`);
    }

    /* ---- fallback ---- */
    return {
      text: `I can answer questions about your <b>revenue, expenses, profit, invoices, clients and pipeline</b>. Try one of these:`,
      widgetTitle: null,
      widgetHTML: null,
      chips: SUGGESTIONS.slice(0, 5),
    };
  }

  /* helpers */
  function widget(title, html, txt) { return { text: txt, widgetTitle: title, widgetHTML: html, chips: null }; }
  function text(txt) { return { text: txt, widgetTitle: null, widgetHTML: null, chips: null }; }
  const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;

  function bestLine(series) {
    if (!series.values.length) return '';
    const i = series.values.indexOf(Math.max(...series.values));
    return `Best month: <b>${series.labels[i]}</b> at <b>${$(series.values[i])}</b>.`;
  }
  function overdueLine() {
    const t = Store.totals();
    return t.overdueCount
      ? `⚠️ <b>${t.overdueCount} overdue</b> worth ${$(t.overdueSum)} — worth chasing today.`
      : 'Nothing is overdue.';
  }
  function toQuarters(r) {
    const labels = [], values = [];
    for (let i = 0; i < r.values.length; i += 3) {
      labels.push('Q' + (Math.floor(i / 3) + 1));
      values.push(r.values.slice(i, i + 3).reduce((a, b) => a + b, 0));
    }
    return { labels, values };
  }
  function invoiceTable(inv) {
    return `<div class="table-wrap"><table class="table"><thead><tr><th>Invoice</th><th>Client</th><th>Status</th><th class="right">Amount</th></tr></thead><tbody>
      ${inv.map(i => `<tr><td class="strong">${i.id}</td><td>${i.client}</td><td>${App.statusPill(i.status)}</td><td class="right strong num">${$(i.amount)}</td></tr>`).join('')}
    </tbody></table></div>`;
  }

  return { answer, SUGGESTIONS };
})();
