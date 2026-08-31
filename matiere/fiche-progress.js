/* Sauvegarde locale fiche — trous + chrono (immédiat, pas de debounce) */
(function (global) {
  const KEY = "pass-fiche-progress-v1";

  function chapterFromPath() {
    const m = (location.pathname || "").match(/ch(\d{2})\.html/i);
    return m ? m[1] : null;
  }

  function loadAll() {
    const S = global.PASS_STORAGE;
    if (S) {
      const all = S.getJSON(KEY);
      return all && typeof all === "object" ? all : {};
    }
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function loadChapter(ch) {
    return loadAll()[ch] || {};
  }

  function saveChapter(ch, partial) {
    if (!ch) return;
    const all = loadAll();
    all[ch] = Object.assign({}, all[ch], partial, { updatedAt: Date.now() });
    const S = global.PASS_STORAGE;
    if (S) S.setJSON(KEY, all);
    else {
      try {
        localStorage.setItem(KEY, JSON.stringify(all));
      } catch (_) {}
    }
  }

  global.PASS_FICHE_PROGRESS = {
    KEY: KEY,
    chapterFromPath: chapterFromPath,
    loadChapter: loadChapter,
    saveChapter: saveChapter,
  };
})(window);
