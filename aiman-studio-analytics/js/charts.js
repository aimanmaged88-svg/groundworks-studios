/* ============================================================
   STUDIO ANALYTICS — SVG charts (light theme, hover tooltips)
   Series colors are the CVD-validated light palette in style.css
   ============================================================ */

const Charts = (() => {
  let tipEl = null;
  function tip() {
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'viz-tip'; document.body.appendChild(tipEl); }
    return tipEl;
  }
  function showTip(html, x, y) {
    const t = tip();
    t.innerHTML = html; t.classList.add('show');
    const r = t.getBoundingClientRect();
    let left = x + 14, top = y - r.height - 10;
    if (left + r.width > window.innerWidth - 12) left = x - r.width - 14;
    if (top < 12) top = y + 16;
    t.style.left = left + 'px'; t.style.top = top + 'px';
  }
  function hideTip() { tip().classList.remove('show'); }
  const row = (c, l, v) => `<div class="tt-r"><i style="background:${c}"></i>${l}<b>${v}</b></div>`;

  let uid = 0;

  /* ---- vertical bars, single series ---- */
  function bars(labels, values, { height = 200, color = 'var(--s1)', format = v => v, name = 'Value' } = {}) {
    const id = 'ch' + (++uid);
    const W = 560, H = height, padB = 24, padT = 10;
    const plotH = H - padB - padT;
    const max = Math.max(...values, 1) * 1.12;
    const n = values.length || 1;
    const slot = W / n;
    const bw = Math.min(36, slot * 0.5);
    let s = `<svg id="${id}" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="overflow:visible">`;
    for (let g = 1; g <= 3; g++) {
      const y = padT + plotH - plotH * g / 3;
      s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="var(--grid)"/>`;
    }
    s += `<line x1="0" x2="${W}" y1="${padT + plotH}" y2="${padT + plotH}" stroke="var(--border-2)"/>`;
    values.forEach((v, i) => {
      const h = Math.max(3, v / max * plotH);
      const x = slot * i + (slot - bw) / 2, y = padT + plotH - h;
      s += `<path data-i="${i}" class="bm" d="M${x} ${padT + plotH} L${x} ${y + 4} Q${x} ${y} ${x + 4} ${y} L${x + bw - 4} ${y} Q${x + bw} ${y} ${x + bw} ${y + 4} L${x + bw} ${padT + plotH} Z" fill="${color}" opacity=".85" style="transition:opacity .15s"/>`;
      s += `<rect data-i="${i}" class="bh" x="${slot * i}" y="0" width="${slot}" height="${H}" fill="transparent"/>`;
      s += `<text x="${slot * i + slot / 2}" y="${H - 6}" text-anchor="middle" font-size="10.5" fill="var(--axis)">${labels[i]}</text>`;
    });
    s += '</svg>';
    queueMicrotask(() => wire(id, svg => {
      svg.addEventListener('mousemove', e => {
        const hit = e.target.closest('.bh'); if (!hit) return hideTip();
        const i = +hit.dataset.i;
        svg.querySelectorAll('.bm').forEach(b => b.style.opacity = +b.dataset.i === i ? 1 : .45);
        showTip(`<div class="tt-t">${labels[i]}</div>${row(color, name, format(values[i]))}`, e.clientX, e.clientY);
      });
      svg.addEventListener('mouseleave', () => {
        svg.querySelectorAll('.bm').forEach(b => b.style.opacity = .85); hideTip();
      });
    }));
    return s;
  }

  /* ---- horizontal bars (rankings) ---- */
  function hbars(pairs, { color = 'var(--s1)', format = v => v, height = null } = {}) {
    const max = Math.max(...pairs.map(p => p[1]), 1);
    const rowH = 34, W = 560;
    const H = height || pairs.length * rowH + 6;
    const labelW = 150;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="overflow:visible">`;
    pairs.forEach(([label, v], i) => {
      const y = i * rowH + 6;
      const w = Math.max(3, (W - labelW - 74) * v / max);
      s += `<text x="${labelW - 10}" y="${y + 15}" text-anchor="end" font-size="12" font-weight="600" fill="var(--text-2)">${esc(short(label, 20))}</text>`;
      s += `<rect x="${labelW}" y="${y}" width="${w}" height="20" rx="5" fill="${color}" opacity="${1 - i * 0.09}"/>`;
      s += `<text x="${labelW + w + 8}" y="${y + 15}" font-size="12" font-weight="700" fill="var(--text)">${format(v)}</text>`;
    });
    s += '</svg>';
    return s;
  }

  /* ---- line/area, 1–2 series, crosshair ---- */
  function lines(labels, seriesArr, { height = 220, format = v => v } = {}) {
    const id = 'ch' + (++uid);
    const W = 620, H = height, padB = 24, padT = 10;
    const plotH = H - padB - padT;
    const all = seriesArr.flatMap(s => s.values);
    const max = Math.max(...all, 1) * 1.12;
    const min = Math.min(0, ...all);
    const span = max - min || 1;
    const n = labels.length;
    const xAt = i => n === 1 ? W / 2 : (W - 8) * i / (n - 1) + 4;
    const yAt = v => padT + plotH - (v - min) / span * plotH;
    const path = vals => vals.map((v, i) => (i ? 'L' : 'M') + xAt(i).toFixed(1) + ' ' + yAt(v).toFixed(1)).join(' ');

    let s = `<svg id="${id}" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="overflow:visible">`;
    s += `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${seriesArr[0].color}" stop-opacity=".16"/><stop offset="1" stop-color="${seriesArr[0].color}" stop-opacity="0"/></linearGradient></defs>`;
    for (let g = 1; g <= 3; g++) {
      const y = padT + plotH - plotH * g / 3;
      s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="var(--grid)"/>`;
    }
    s += `<line x1="0" x2="${W}" y1="${yAt(0)}" y2="${yAt(0)}" stroke="var(--border-2)"/>`;
    s += `<path d="${path(seriesArr[0].values)} L ${xAt(n - 1)} ${yAt(Math.max(0, min))} L ${xAt(0)} ${yAt(Math.max(0, min))} Z" fill="url(#${id}g)"/>`;
    seriesArr.forEach(sr => {
      s += `<path d="${path(sr.values)}" fill="none" stroke="${sr.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    });
    labels.forEach((l, i) => s += `<text x="${xAt(i)}" y="${H - 6}" text-anchor="middle" font-size="10.5" fill="var(--axis)">${l}</text>`);
    s += `<line class="cur" x1="0" x2="0" y1="${padT}" y2="${padT + plotH}" stroke="var(--border-2)" stroke-dasharray="3 3" opacity="0"/>`;
    seriesArr.forEach((sr, k) => s += `<circle class="dt${k}" r="4.5" fill="${sr.color}" stroke="#fff" stroke-width="2" opacity="0"/>`);
    s += '</svg>';

    queueMicrotask(() => wire(id, svg => {
      const cur = svg.querySelector('.cur');
      svg.addEventListener('mousemove', e => {
        const r = svg.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width * W;
        const i = Math.max(0, Math.min(n - 1, Math.round((px - 4) / ((W - 8) / Math.max(1, n - 1)))));
        const x = xAt(i);
        cur.setAttribute('x1', x); cur.setAttribute('x2', x); cur.setAttribute('opacity', 1);
        let html = `<div class="tt-t">${labels[i]}</div>`;
        seriesArr.forEach((sr, k) => {
          const d = svg.querySelector('.dt' + k);
          d.setAttribute('cx', x); d.setAttribute('cy', yAt(sr.values[i])); d.setAttribute('opacity', 1);
          html += row(sr.color, sr.name, format(sr.values[i]));
        });
        showTip(html, e.clientX, e.clientY);
      });
      svg.addEventListener('mouseleave', () => {
        cur.setAttribute('opacity', 0);
        seriesArr.forEach((_, k) => svg.querySelector('.dt' + k).setAttribute('opacity', 0));
        hideTip();
      });
    }));
    return s;
  }

  /* ---- donut with legend ---- */
  const DONUT_COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)'];
  function donut(pairs, { size = 168, format = v => v } = {}) {
    const total = pairs.reduce((a, p) => a + p[1], 0) || 1;
    const cx = size / 2, cy = size / 2, r = size / 2 - 12, sw = 22;
    let angle = -90;
    let arcs = '';
    pairs.slice(0, 5).forEach(([label, v], i) => {
      const frac = v / total;
      const sweep = frac * 360;
      const a0 = angle * Math.PI / 180, a1 = (angle + sweep - 1.5) * Math.PI / 180;
      const large = sweep > 180 ? 1 : 0;
      arcs += `<path d="M ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}"
        fill="none" stroke="${DONUT_COLORS[i]}" stroke-width="${sw}" stroke-linecap="butt">
        <title>${esc(label)}: ${format(v)} (${Math.round(frac * 100)}%)</title></path>`;
      angle += sweep;
    });
    const legend = pairs.slice(0, 5).map(([label, v], i) =>
      `<div class="tt-r" style="font-size:12.5px;padding:3px 0"><i style="background:${DONUT_COLORS[i]}"></i>${esc(short(label, 18))}<b>${format(v)}</b></div>`).join('');
    return `<div style="display:flex;align-items:center;gap:22px;flex-wrap:wrap">
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${arcs}
        <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="17" font-weight="800" fill="var(--text)">${format(total)}</text>
        <text x="${cx}" y="${cy + 15}" text-anchor="middle" font-size="10.5" fill="var(--text-3)">total</text>
      </svg>
      <div style="flex:1;min-width:150px">${legend}</div>
    </div>`;
  }

  /* ---- KPI sparkline ---- */
  function spark(values, { width = 200, height = 34, color = 'var(--s1)' } = {}) {
    if (!values.length) return '';
    const min = Math.min(...values), max = Math.max(...values);
    const span = max - min || 1, pad = 3;
    const pts = values.map((v, i) => [
      pad + i * (width - pad * 2) / Math.max(1, values.length - 1),
      height - pad - (v - min) / span * (height - pad * 2),
    ]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="3" fill="${color}"/>
    </svg>`;
  }

  function legend(items) {
    return `<div class="legend">${items.map(i => `<span class="lg"><i style="background:${i.color}"></i>${i.label}</span>`).join('')}</div>`;
  }

  function wire(id, fn) {
    const svg = document.getElementById(id);
    if (svg && !svg.dataset.wired) { svg.dataset.wired = '1'; fn(svg); }
  }
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const short = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;

  return { bars, hbars, lines, donut, spark, legend, DONUT_COLORS };
})();
