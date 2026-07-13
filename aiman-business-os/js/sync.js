/* ============================================================
   BUSINESS STUDIO OS — cross-device sync client
   Your whole workspace saves to Supabase under one secret "sync
   code". Every device that enters the same code stays in step.
   On load: pull the cloud copy if it's newer. On every save:
   push (debounced). Last write wins — perfect for one person on
   two devices.

   Talks straight to two locked-down Supabase functions
   (bsos_sync_pull / bsos_sync_push). The publishable key below is
   safe in the browser by design; your data is guarded by the
   sync code, which never leaves your devices except to match it.
   ============================================================ */

window.Sync = (() => {
  const SB_URL  = 'https://ymuwuhvqqftgpxwhzoub.supabase.co';
  const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdXd1aHZxcWZ0Z3B4d2h6b3ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NjUyMzgsImV4cCI6MjA5OTI0MTIzOH0.sOkWQpulWj_ZSqMNSV7YP55T70UFSm2mP5e5xapQyQo';
  const rpc = name => SB_URL + '/rest/v1/rpc/' + name;
  const HEADERS = { apikey: SB_ANON, Authorization: 'Bearer ' + SB_ANON, 'Content-Type': 'application/json' };

  const KEY_NAME = 'bsos-leads-key';   // shared with the enquiry feed — one code for everything
  const MIN_LEN = 12;
  const key = () => { try { return localStorage.getItem(KEY_NAME) || ''; } catch (e) { return ''; } };

  let pushTimer = null;
  let state = 'off'; // off | syncing | synced | error

  function setState(s, detail) {
    state = s;
    const el = document.querySelector('#sync-status');
    if (!el) return;
    const map = {
      off:     ['var(--text-3)', 'Local only — connect sync in Settings'],
      syncing: ['var(--accent)', 'Syncing…'],
      synced:  ['var(--good)',   detail || 'Synced across your devices'],
      error:   ['var(--warn)',   'Sync offline — data safe on this device'],
    };
    const [color, text] = map[s] || map.off;
    el.innerHTML = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${color};margin-right:6px;vertical-align:1px"></span>${text}`;
  }

  /* wrap the local persistence layer so every save also pushes */
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
      const r = await fetch(rpc('bsos_sync_push'), {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify({ p_key: key(), p_updated: DB._meta?.updatedAt || Date.now(), p_data: DB }),
      });
      if (!r.ok) throw new Error('push ' + r.status);
      const row = (await r.json())?.[0];
      if (row && row.stale) { applyCloud(row.updated_at, row.data); return; } // cloud was newer
      setState('synced');
    } catch (e) { setState('error'); }
  }

  function applyCloud(updatedAt, data) {
    if (!data) return;
    Object.keys(data).forEach(k => { DB[k] = data[k]; });
    DB._meta = { updatedAt: updatedAt || Date.now() };
    _save();
    setState('synced', 'Synced from your other device');
    window.App?.refresh?.();
    window.UI?.toast?.('Synced from your other device 📲');
  }

  async function pullNow() {
    if (!key()) { setState('off'); return; }
    try {
      setState('syncing');
      const r = await fetch(rpc('bsos_sync_pull'), {
        method: 'POST', headers: HEADERS, body: JSON.stringify({ p_key: key() }),
      });
      if (!r.ok) throw new Error('pull ' + r.status);
      const row = (await r.json())?.[0] || null;
      const localT = DB._meta?.updatedAt || 0;
      const cloudT = row?.updated_at || 0;
      if (row && row.data && cloudT > localT) applyCloud(cloudT, row.data);
      else if (localT > cloudT) await pushNow();      // this device is ahead → seed the cloud
      else setState(localT ? 'synced' : 'off');
    } catch (e) { setState('error'); }
  }

  /* ---- self-serve connect / disconnect (Settings → Cross-device sync) ---- */
  function connect(code) {
    code = (code || '').trim();
    if (code.length < MIN_LEN) { window.UI?.toast?.(`Sync code needs at least ${MIN_LEN} characters`); return false; }
    try { localStorage.setItem(KEY_NAME, code); } catch (e) {}
    pullNow();
    return true;
  }
  function disconnect() {
    try { localStorage.removeItem(KEY_NAME); } catch (e) {}
    setState('off');
  }
  function generateCode() {
    let body = '';
    if (window.crypto?.getRandomValues) {
      body = Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
        .map(b => (b % 36).toString(36)).join('');
    } else {
      body = (Math.random().toString(36) + Math.random().toString(36)).replace(/[^a-z0-9]/g, '');
    }
    return 'gw-' + body.slice(0, 20);
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

  return {
    pullNow, pushNow, connect, disconnect, generateCode,
    isOn: () => !!key(), code: key, minLen: MIN_LEN, state: () => state,
  };
})();
