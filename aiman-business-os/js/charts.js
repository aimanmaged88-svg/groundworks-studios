/* ============================================================
   BUSINESS STUDIO OS — SVG chart engine
   Thin marks, rounded data-ends, hairline grid, hover tooltips.
   Series colors are validated per-theme via CSS vars.
   ============================================================ */

const Charts = (() => {

  let tipEl = null;
  function tip() {
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.className = 'viz-tip';
      document.body.appendChild(tipEl);
    }
    return tipEl;
  }
  function showTip(html, x, y) {
    const t = tip();
    t.innerHTML = html;
    t.classList.add('show');
    const r = t.getBoundingClientRect();
    let left = x + 14, top = y - r.height - 10;
    if (left + r.width > window.innerWidth - 12) left = x - r.width - 14;
    if (top < 12) top = y + 16;
    t.style.left = left + 'px';
    t.style.top = top + 'px';
  }
  function hideTip() { tip().classList.remove('show'); }

  function ttRow(color, label, value) {
    return `<div class="tt-row"><i style="background:${color}"></i>${label}<b>${value}</b></div>`;
  }

  /* --- sparkline: single series, decorative trend in a stat tile --- */
  function sparkline(values, { width = 220, height = 40, color = 'var(--series-1)' } = {}) {
    const min = Math.min(...values), max = Math.max(...values);
    const pad = 3;
    const span = (max - min) || 1;
    const pts = values.map((v, i) => [
      pad + i * (width - pad * 2) / (values.length - 1),
      height - pad - ((v - min) / span) * (height - pad * 2),
    ]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const last = pts[pts.length - 1];
    const area = d + ` L ${last[0].toFixed(1)} ${height} L ${pts[0][0].toFixed(1)} ${height} Z`;
    const gid = 'sg' + Math.abs(values.reduce((a, b) => a * 31 + b, 7)) % 99991;
    return `<svg class="spark" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${color}" stop-opacity="0.22"/>
        <stop offset="1" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${area}" fill="url(#${gid})"/>
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="3" fill="${color}"/>
    </svg>`;
  }

  /* --- bar chart: single series with per-bar hover --- */
  function bars(labels, values, { height = 190, format = v => v } = {}) {
    const max = Math.max(...values) * 1.15;
    const W = 560, H = height, padB = 24, padT = 8;
    const plotH = H - padB - padT;
    const n = values.length;
    const slot = W / n;
    const bw = Math.min(34, slot * 0.44);
    let out = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" class="bar-chart" style="overflow:visible">`;
    // hairline grid
    for (let g = 1; g <= 3; g++) {
      const y = padT + plotH - (plotH * g / 3);
      out += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="var(--grid-line)" stroke-width="1"/>`;
    }
    out += `<line x1="0" x2="${W}" y1="${padT + plotH}" y2="${padT + plotH}" stroke="var(--border-strong)" stroke-width="1"/>`;
    values.forEach((v, i) => {
      const h = Math.max(4, (v / max) * plotH);
      const x = slot * i + (slot - bw) / 2;
      const y = padT + plotH - h;
      const isLast = i === n - 1;
      out += `<path class="bar-mark" data-i="${i}"
        d="M${x} ${padT + plotH} L${x} ${y + 4} Q${x} ${y} ${x + 4} ${y} L${x + bw - 4} ${y} Q${x + bw} ${y} ${x + bw} ${y + 4} L${x + bw} ${padT + plotH} Z"
        fill="var(--series-1)" opacity="${isLast ? 1 : 0.55}" style="transition: opacity 150ms"/>`;
      out += `<rect class="bar-hit" data-i="${i}" x="${slot * i}" y="0" width="${slot}" height="${H}" fill="transparent"/>`;
      out += `<text x="${slot * i + slot / 2}" y="${H - 6}" text-anchor="middle" font-size="10.5" fill="var(--axis-ink)" font-family="var(--font-ui)">${labels[i]}</text>`;
    });
    out += '</svg>';

    // behavior hookup after insert
    queueMicrotask(() => {
      document.querySelectorAll('.bar-chart').forEach(svg => {
        if (svg.dataset.wired) return;
        svg.dataset.wired = '1';
        svg.addEventListener('mousemove', e => {
          const hit = e.target.closest('.bar-hit');
          if (!hit) return hideTip();
          const i = +hit.dataset.i;
          svg.querySelectorAll('.bar-mark').forEach(b => b.style.opacity = (+b.dataset.i === i) ? 1 : 0.35);
          showTip(`<div class="tt-title">${labels[i]}</div>${ttRow('var(--series-1)', 'Revenue', format(values[i]))}`, e.clientX, e.clientY);
        });
        svg.addEventListener('mouseleave', () => {
          svg.querySelectorAll('.bar-mark').forEach((b, i) => b.style.opacity = (i === n - 1) ? 1 : 0.55);
          hideTip();
        });
      });
    });
    return out;
  }

  /* --- two-series area/line: income vs expenses, crosshair tooltip --- */
  function cashflow(labels, s1, s2, { height = 220, format = v => v, names = ['Income', 'Expenses'] } = {}) {
    const W = 640, H = height, padB = 24, padT = 10;
    const plotH = H - padB - padT;
    const max = Math.max(...s1, ...s2) * 1.12;
    const n = labels.length;
    const xAt = i => (W - 8) * i / (n - 1) + 4;
    const yAt = v => padT + plotH - (v / max) * plotH;
    const line = s => s.map((v, i) => (i ? 'L' : 'M') + xAt(i).toFixed(1) + ' ' + yAt(v).toFixed(1)).join(' ');
    const a1 = line(s1) + ` L ${xAt(n - 1)} ${padT + plotH} L ${xAt(0)} ${padT + plotH} Z`;

    let out = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" class="flow-chart" style="overflow:visible">`;
    out += `<defs><linearGradient id="cfg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--series-1)" stop-opacity="0.18"/>
      <stop offset="1" stop-color="var(--series-1)" stop-opacity="0"/>
    </linearGradient></defs>`;
    for (let g = 1; g <= 3; g++) {
      const y = padT + plotH - (plotH * g / 3);
      out += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="var(--grid-line)"/>`;
    }
    out += `<line x1="0" x2="${W}" y1="${padT + plotH}" y2="${padT + plotH}" stroke="var(--border-strong)"/>`;
    out += `<path d="${a1}" fill="url(#cfg)"/>`;
    out += `<path d="${line(s1)}" fill="none" stroke="var(--series-1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    out += `<path d="${line(s2)}" fill="none" stroke="var(--series-2)" stroke-width="2" stroke-dasharray="1 0" stroke-linecap="round" stroke-linejoin="round"/>`;
    labels.forEach((l, i) => {
      out += `<text x="${xAt(i)}" y="${H - 6}" text-anchor="middle" font-size="10.5" fill="var(--axis-ink)">${l}</text>`;
    });
    out += `<line class="cf-cursor" x1="0" x2="0" y1="${padT}" y2="${padT + plotH}" stroke="var(--border-strong)" stroke-dasharray="3 3" opacity="0"/>`;
    out += `<circle class="cf-d1" r="4" fill="var(--series-1)" stroke="var(--card)" stroke-width="2" opacity="0"/>`;
    out += `<circle class="cf-d2" r="4" fill="var(--series-2)" stroke="var(--card)" stroke-width="2" opacity="0"/>`;
    out += '</svg>';

    queueMicrotask(() => {
      document.querySelectorAll('.flow-chart').forEach(svg => {
        if (svg.dataset.wired) return;
        svg.dataset.wired = '1';
        const cursor = svg.querySelector('.cf-cursor');
        const d1 = svg.querySelector('.cf-d1'), d2 = svg.querySelector('.cf-d2');
        svg.addEventListener('mousemove', e => {
          const r = svg.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width * W;
          const i = Math.max(0, Math.min(n - 1, Math.round((px - 4) / ((W - 8) / (n - 1)))));
          const x = xAt(i);
          cursor.setAttribute('x1', x); cursor.setAttribute('x2', x); cursor.setAttribute('opacity', 1);
          d1.setAttribute('cx', x); d1.setAttribute('cy', yAt(s1[i])); d1.setAttribute('opacity', 1);
          d2.setAttribute('cx', x); d2.setAttribute('cy', yAt(s2[i])); d2.setAttribute('opacity', 1);
          showTip(
            `<div class="tt-title">${labels[i]}</div>` +
            ttRow('var(--series-1)', names[0], format(s1[i])) +
            ttRow('var(--series-2)', names[1], format(s2[i])) +
            ttRow('transparent', 'Net', format(s1[i] - s2[i])),
            e.clientX, e.clientY
          );
        });
        svg.addEventListener('mouseleave', () => {
          [cursor, d1, d2].forEach(el => el.setAttribute('opacity', 0));
          hideTip();
        });
      });
    });
    return out;
  }

  /* --- donut / ring progress --- */
  function ring(pct, { size = 96, stroke = 8, color = 'var(--accent)' } = {}) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const off = c * (1 - pct / 100);
    return `<div class="ring-wrap" style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--card-3)" stroke-width="${stroke}"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
          stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"
          transform="rotate(-90 ${size / 2} ${size / 2})" style="transition: stroke-dashoffset 800ms var(--ease)"/>
      </svg>
      <div class="ring-num">${pct}%</div>
    </div>`;
  }

  /* --- legend --- */
  function legend(items) {
    return `<div class="legend">${items.map(i =>
      `<span class="lg-item"><i style="background:${i.color}"></i>${i.label}</span>`).join('')}</div>`;
  }

  return { sparkline, bars, cashflow, ring, legend };
})();
