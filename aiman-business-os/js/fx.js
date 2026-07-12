/* ============================================================
   BUSINESS STUDIO OS — FX layer (liquid glass · motion · sound)
   iOS-style feel: ambient drifting colour behind frosted cards,
   springy ripples on touch, numbers that count up, and tiny
   synthesized glass sounds (no audio files, WebAudio only).
   Everything respects prefers-reduced-motion and a mute toggle.
   ============================================================ */

const FX = (() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- sound: tiny glass synth ---------------- */
  let ctx = null;
  let soundOn = (localStorage.getItem('bsos-sound') ?? 'on') === 'on';

  function ac() {
    if (!ctx) try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* one voice: freq sweep + fast decay through a lowpass = glassy blip */
  function voice(a, { f0 = 1200, f1 = f0, type = 'sine', dur = 0.08, gain = 0.05, delay = 0 }) {
    const t = a.currentTime + delay;
    const o = a.createOscillator();
    const g = a.createGain();
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 4500;
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  const SOUNDS = {
    tick:   a => voice(a, { f0: 2100, f1: 1500, dur: 0.045, gain: 0.035 }),
    tap:    a => voice(a, { f0: 950, f1: 700, type: 'triangle', dur: 0.06, gain: 0.045 }),
    pop:    a => { voice(a, { f0: 620, f1: 880, type: 'triangle', dur: 0.09, gain: 0.05 }); voice(a, { f0: 1240, f1: 1760, dur: 0.1, gain: 0.025, delay: 0.04 }); },
    chime:  a => { [880, 1108.7, 1318.5].forEach((f, i) => voice(a, { f0: f, f1: f, dur: 0.22, gain: 0.035, delay: i * 0.07 })); },
    whoosh: a => { const t = a.currentTime, n = a.createBufferSource(), len = a.sampleRate * 0.16,
        buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(1800, t + 0.14);
      const g = a.createGain(); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      n.buffer = buf; n.connect(bp); bp.connect(g); g.connect(a.destination); n.start(t); },
  };

  function play(name) {
    if (!soundOn) return;
    const a = ac();
    if (a && SOUNDS[name]) try { SOUNDS[name](a); } catch (e) {}
  }

  function setSound(on) {
    soundOn = on;
    localStorage.setItem('bsos-sound', on ? 'on' : 'off');
    const btn = document.querySelector('#sound-btn');
    if (btn) { btn.innerHTML = icon(on ? 'volume' : 'volumeOff'); btn.title = on ? 'Sounds on' : 'Sounds off'; }
    if (on) play('pop');
  }

  /* ---------------- ripple: liquid press feedback ---------------- */
  function ripple(e) {
    if (reduced) return;
    const el = e.target.closest('.btn, .icon-btn, .stat-tile, .nav-item, .avatar-btn, .check, a.row.clickable, .ql-row, .list-row');
    if (!el) return;
    const r = el.getBoundingClientRect();
    const s = document.createElement('span');
    s.className = 'fx-ripple';
    const size = Math.max(r.width, r.height) * 2;
    s.style.width = s.style.height = size + 'px';
    s.style.left = (e.clientX - r.left - size / 2) + 'px';
    s.style.top = (e.clientY - r.top - size / 2) + 'px';
    el.appendChild(s);
    setTimeout(() => s.remove(), 650);
  }

  /* ---------------- count-up: stat numbers roll in ---------------- */
  function countUp(el) {
    if (reduced) return;
    const raw = el.textContent.trim();
    const m = raw.match(/^(\$?)([\d,]+)(%?)$/);
    if (!m) return;
    const target = +m[2].replace(/,/g, '');
    if (!isFinite(target) || target === 0) return;
    const t0 = performance.now(), dur = 750;
    const fmt = n => m[1] + Math.round(n).toLocaleString('en-AU') + m[3];
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * ease);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function enhance(root) {
    root.querySelectorAll('.stat-value:not([data-fx])').forEach(el => {
      el.dataset.fx = '1';
      countUp(el);
    });
  }

  /* ---------------- ambient liquid background ---------------- */
  function ambient() {
    if (document.querySelector('.fx-ambient')) return;
    const amb = document.createElement('div');
    amb.className = 'fx-ambient';
    amb.setAttribute('aria-hidden', 'true');
    amb.innerHTML = '<i class="orb o1"></i><i class="orb o2"></i><i class="orb o3"></i><i class="orb o4"></i>';
    document.body.prepend(amb);
  }

  /* ---------------- boot ---------------- */
  window.addEventListener('load', () => {
    ambient();
    const btn = document.querySelector('#sound-btn');
    if (btn) { btn.innerHTML = icon(soundOn ? 'volume' : 'volumeOff'); btn.title = soundOn ? 'Sounds on' : 'Sounds off'; }

    /* soften UI.toast with a pop */
    if (window.UI && UI.toast) {
      const orig = UI.toast;
      UI.toast = msg => { play('pop'); orig(msg); };
    }

    /* re-run enhancers whenever the view re-renders */
    const view = document.querySelector('#view');
    if (view) {
      enhance(view);
      new MutationObserver(() => enhance(view)).observe(view, { childList: true, subtree: false });
    }
  });

  document.addEventListener('pointerdown', e => {
    ripple(e);
    const el = e.target.closest('.btn, .icon-btn, .nav-item, .avatar-btn, a, .seg button, .tab');
    if (!el) return;
    if (el.closest('#sound-btn')) return;         // toggle plays its own
    play(el.classList.contains('check') ? 'chime' : el.matches('.btn.primary') ? 'tap' : 'tick');
  }, true);

  document.addEventListener('click', e => {
    if (e.target.closest('#sound-btn')) setSound(!soundOn);
    if (e.target.closest('[data-check], [data-goal]')) play('chime');
  }, true);

  window.addEventListener('hashchange', () => play('whoosh'));

  return { play, setSound };
})();
