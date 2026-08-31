/* Sauvegarde locale fiche — trous + chrono (survit au refresh) */
(function (global) {
  const KEY = "pass-fiche-progress-v1";

  function chapterFromPath() {
    const m = (location.pathname || "").match(/ch(\d{2})\.html/i);
    return m ? m[1] : null;
  }

  function loadChapter(ch) {
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || "{}");
      return all[ch] || {};
    } catch (_) {
      return {};
    }
  }

  function saveChapter(ch, partial) {
    if (!ch) return;
    try {
      const all = JSON.parse(localStorage.getItem(KEY) || "{}");
      all[ch] = Object.assign({}, all[ch], partial, { updatedAt: Date.now() });
      localStorage.setItem(KEY, JSON.stringify(all));
    } catch (_) {}
  }

  function scheduleSave(ch, fn) {
    if (!ch) return;
    const t = "__passFicheSave_" + ch;
    clearTimeout(global[t]);
    global[t] = setTimeout(fn, 280);
  }

  global.PASS_FICHE_PROGRESS = {
    KEY: KEY,
    chapterFromPath: chapterFromPath,
    loadChapter: loadChapter,
    saveChapter: saveChapter,
    scheduleSave: scheduleSave,
  };
})(window);
