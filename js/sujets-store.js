/* Scores sujets complets — localStorage */
window.PASS_SujetsStore = (function () {
  var KEY = "pass_sujets_scores_v1";
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return {};
      var data = JSON.parse(raw);
      return data && typeof data === "object" ? data : {};
    } catch (e) {
      return {};
    }
  }
  function saveScore(sujetId, payload) {
    var id = String(sujetId || "").toUpperCase();
    if (!id) return null;
    var data = load();
    data[id] = {
      ok: payload.ok || 0,
      n: payload.n || 0,
      pct: payload.pct || 0,
      elapsedSec: payload.elapsedSec || 0,
      timedOut: !!payload.timedOut,
      title: payload.title || id,
      at: new Date().toISOString()
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return data[id];
  }
  function getScore(sujetId) {
    return load()[String(sujetId || "").toUpperCase()] || null;
  }
  return { load: load, saveScore: saveScore, getScore: getScore };
})();
