/* ============================================================
   BUSINESS STUDIO OS — cross-device sync client
   Uses the same access key as the enquiry feed. On load: pull
   the cloud copy if it's newer. On every save: push (debounced).
   Last write wins — perfect for one person on two devices.
   ============================================================ */

window.Sync = (() => {
  const SYNC_URL = 'https://aiman-business-os.netlify.app/.netlify/functions/sync';
  const key = () => { try { return localStorage.getItem('bsos-leads-key') || ''; } catch (e) { return ''; } };

  let pushTimer = null;
  let state = 'off'; // off | syncing | synced | error

  function setState(s, detail) {
    state = s;
    const el = document.querySelector('#sync-status');
    if (!el) return;
    const map = {
      off:     ['var(--text-3)', 'Local only — open Enquiries to connect sync'],
      syncing: ['var(--accent)', 'Syncing…'],
      synced:  ['var(--good)',   detail || 'Synced across your devices'],
      error:   ['var(--warn)',   'Sync offline — data safe on this device'],
    };
    const [color, text] = map[s] || map.off;
    el.innerHTML = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};margin-right:6px;vertical-align:1px"></span>${text}`;
  }

  /* wrap the local persistence layer */
  const _save = window.saveDB;
  window.saveDB = function () {
    DB._meta = { updatedAt: Date.now() };
    _save();
    schedulePush();
  };

  const _reset = window.resetDB;
  window.resetDB = function () {
    try { localStorage.setItem('bsos-skip-pull', '1'); } catch (e) {}
    _reset();
  };

  function schedulePush() {
    if (!key()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 1200);
  }

  async function pushNow() {
    if (!key()) return;
    try {
      setState('syncing');
      const r = await fetch(SYNC_URL + '?key=' + encodeURIComponent(key()), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatedAt: DB._meta?.updatedAt || Date.now(), data: DB }),
      });
      const res = await r.json();
      if (res && res.reason === 'stale' && res.cloud) { applyCloud(res.cloud); return; }
      if (!r.ok) throw new Error('push ' + r.status);
      setState('synced');
    } catch (e) { setState('error'); }
  }

  function applyCloud(cloud) {
    Object.keys(cloud.data).forEach(k => { DB[k] = cloud.data[k]; });
    _save();
    setState('synced', 'Synced from your other device');
    window.App?.refresh?.();
    window.UI?.toast?.('Synced from your other device');
  }

  async function pullNow() {
    if (!key()) { setState('off'); return; }
    try {
      setState('syncing');
      const r = await fetch(SYNC_URL + '?key=' + encodeURIComponent(key()));
      if (r.status === 401) { setState('off'); return; }
      if (!r.ok) throw new Error('pull ' + r.status);
      const cloud = await r.json();
      const localT = DB._meta?.updatedAt || 0;
      const cloudT = cloud?.updatedAt || 0;
      if (cloud && cloud.data && cloudT > localT) applyCloud(cloud);
      else if (localT > cloudT) await pushNow();
      else setState(localT ? 'synced' : 'off');
    } catch (e) { setState('error'); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!key()) { setState('off'); return; }
    let skip = false;
    try {
      skip = localStorage.getItem('bsos-skip-pull') === '1';
      if (skip) localStorage.removeItem('bsos-skip-pull');
    } catch (e) {}
    if (skip) {
      // fresh reset: make this device the source of truth
      DB._meta = { updatedAt: Date.now() };
      _save();
      pushNow();
    } else {
      pullNow();
    }
  });

  return { pullNow, pushNow, state: () => state };
})();
