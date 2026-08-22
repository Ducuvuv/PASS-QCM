/* Scores des sujets complets — localStorage, pas de serveur */
(function (global) {
  var KEY = "pass_sujets_scores_v1";

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return {};
      var data = JSON.parse(raw);
      return data && typeof data === "object" ? data : {};
    } catch (_) {
      return {};
    }
  }

  function saveAll(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function saveScore(sujetId, payload) {
    var id = String(sujetId || "").toUpperCase();
    if (!id) return load();
    var data = load();
    data[id] = {
      ok: payload.ok || 0,
      n: payload.n || 0,
      pct: payload.pct || 0,
      elapsedSec: payload.elapsedSec || 0,
      timedOut: !!payload.timedOut,
      title: payload.title || id,
      at: new Date().toISOString(),
    };
    saveAll(data);
    return data[id];
  }

  function getScore(sujetId) {
    var id = String(sujetId || "").toUpperCase();
    return load()[id] || null;
  }

  global.PASS_SujetsStore = {
    load: load,
    saveScore: saveScore,
    getScore: getScore,
  };
})(window);
