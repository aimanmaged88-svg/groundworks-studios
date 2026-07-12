/* ============================================================
   Analytics — studio performance at a glance
   ============================================================ */

Pages.analytics = () => {
  const a = DB.analytics, f = DB.finance;
  const convRate = Math.round(a.conversions.reduce((x, y) => x + y) / a.leads.reduce((x, y) => x + y) * 100);

  return pageHead('Analytics', 'How the studio is actually performing — 2026 year to date.',
    `<div class="seg"><button>30 days</button><button>Quarter</button><button class="active">YTD</button></div>
     <button class="btn">${icon('download')}Export report</button>`)

    + `<div class="stat-row">
      ${statTile('Revenue YTD', fmt$(f.income.reduce((x, y) => x + y)), `+${a.growth}% monthly growth`, 'good', f.income)}
      ${statTile('Leads → Clients', `${convRate}%`, `${a.conversions.reduce((x, y) => x + y)} won from ${a.leads.reduce((x, y) => x + y)} leads`, 'good', a.conversions)}
      ${statTile('Apps built', String(a.appsBuilt), `+ ${a.sitesBuilt} websites`, '', [1, 2, 3, 4, 6, 8])}
      ${statTile('Completion rate', a.completion + '%', 'on-time delivery', 'good', [88, 90, 86, 92, 95, 94])}
    </div>

    <div class="dash-grid">
      <div class="span-7">${UI.card({
        title: 'Revenue Trend', icon: 'trendUp',
        body: `<div class="spread" style="margin-bottom:14px">
            <div><div class="chart-head-val">${fmt$(f.income[5])}</div><div class="small t3">Best month — June 2026</div></div>
            ${Charts.legend([{ color: 'var(--series-1)', label: 'Monthly revenue' }])}
          </div>
          ${Charts.bars(f.months, f.income, { format: fmt$ })}`,
      })}</div>

      <div class="span-5">${UI.card({
        title: 'Leads & Conversions', icon: 'target',
        body: `<div class="spread" style="margin-bottom:14px">
            <div><div class="chart-head-val">${convRate}%</div><div class="small t3">Lead → client conversion</div></div>
            ${Charts.legend([{ color: 'var(--series-1)', label: 'Leads' }, { color: 'var(--series-2)', label: 'Won' }])}
          </div>
          ${Charts.cashflow(f.months, a.leads, a.conversions, { height: 190, names: ['Leads', 'Won'], format: v => v })}`,
      })}</div>

      <div class="span-4">${UI.card({
        title: 'Hours Worked', icon: 'clock',
        body: `<div class="chart-head-val" style="margin-bottom:2px">${a.hoursMonth}h</div>
          <div class="small t3" style="margin-bottom:12px">this month · avg 111h / month</div>
          ${Charts.sparkline(a.hours, { height: 56 })}
          <hr class="divider">
          <div class="spread"><span class="small t2">Effective rate</span><b class="num small">$96 / hr</b></div>`,
      })}</div>

      <div class="span-4">${UI.card({
        title: 'Delivery', icon: 'check',
        body: `<div style="display:grid;place-items:center;padding:6px 0 14px">${Charts.ring(a.completion, { size: 110, stroke: 9, color: 'var(--good)' })}</div>
          <div class="spread" style="padding:4px 0"><span class="small t2">Projects on time</span><b class="small num">15 / 16</b></div>
          <div class="spread" style="padding:4px 0"><span class="small t2">Avg build time</span><b class="small num">3.2 weeks</b></div>`,
      })}</div>

      <div class="span-4">${UI.card({
        title: 'Portfolio Growth', icon: 'analytics',
        body: `<div class="spread" style="padding:7px 0"><span class="small t2">Apps in production</span><b class="num">${a.appsBuilt}</b></div>
          ${UI.progress(80)}
          <div class="spread" style="padding:14px 0 7px"><span class="small t2">Websites live</span><b class="num">${a.sitesBuilt}</b></div>
          ${UI.progress(50)}
          <div class="spread" style="padding:14px 0 7px"><span class="small t2">Repeat clients</span><b class="num">4 of 6</b></div>
          ${UI.progress(66, 'good')}
          <hr class="divider">
          <div class="small t3" style="line-height:1.6">Two-thirds of clients come back for a second build — the strongest signal in the business.</div>`,
      })}</div>
    </div>`;
};
