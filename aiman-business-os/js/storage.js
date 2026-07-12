/* ============================================================
   BUSINESS STUDIO OS — persistence layer
   The whole DB saves to this browser (localStorage) on every
   change and reloads on boot. Export/import lives in Settings.
   ============================================================ */

(function () {
  const KEY = 'bsos-db-v2';   // v2 = clean-start seed (demo data cleared Jul 2026)

  // Keep a pristine copy of the seed before hydrating
  window.SEED_DB = JSON.parse(JSON.stringify(DB));

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && saved.tasks && saved.clients && saved.projects) {
        Object.keys(saved).forEach(k => { DB[k] = saved[k]; });
        // migration: rebrand saved profiles from the old studio name
        if (DB.user && DB.user.business === 'Aiman Studio') {
          DB.user.business = 'Groundwork Labs';
          localStorage.setItem(KEY, JSON.stringify(DB));
        }
      }
    }
  } catch (e) { /* corrupted blob → fall back to seed */ }

  window.saveDB = function () {
    try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {}
  };

  window.resetDB = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  };

  window.exportDB = function () {
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'business-studio-os-backup.json';
    a.click();
  };

  window.importDB = function (text) {
    const d = JSON.parse(text);
    if (!d.tasks || !d.clients || !d.projects) throw new Error('Invalid backup file');
    Object.keys(d).forEach(k => { DB[k] = d[k]; });
    saveDB();
  };

  window.uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  // Live "today" for briefing + calendar (data is themed around July 2026)
  window.TODAY_DAY = new Date().getDate();
})();
