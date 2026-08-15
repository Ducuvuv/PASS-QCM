/* Suivi local — scores QCM par chapitre (pas de serveur) */
(function (global) {
  const KEY = "pass_suivi_v1";
  const MIN_Q = 10;

  const CHAPTERS = {
    "01": "Introduction",
    "02": "Système nerveux",
    "03": "Cardio-circulatoire",
    "04": "Appareil respiratoire",
    "05": "Organes des sens",
    "06": "Rachis",
    "07": "Parois du tronc",
    "08": "Appareil digestif",
    "09": "Génito-urinaire",
    "10": "Membre supérieur",
    "11": "Membre inférieur",
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { anatomie: {} };
      const data = JSON.parse(raw);
      if (!data.anatomie) data.anatomie = {};
      return data;
    } catch (_) {
      return { anatomie: {} };
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function levelFromPct(pct, n) {
    if (n < MIN_Q) return "none";
    if (pct < 50) return "red";
    if (pct <= 75) return "blue";
    return "green";
  }

  function score20(ok, n) {
    if (!n) return null;
    return Math.round((ok / n) * 20 * 10) / 10;
  }

  /** history: [{ chapter, ok }] from a finished QCM session */
  function recordSession(history) {
    if (!history || !history.length) return load();
    const data = load();
    const byCh = {};
    for (const h of history) {
      const ch = String(h.chapter || "").padStart(2, "0");
      if (!CHAPTERS[ch]) continue;
      if (!byCh[ch]) byCh[ch] = { n: 0, ok: 0 };
      byCh[ch].n += 1;
      if (h.ok) byCh[ch].ok += 1;
    }
    const now = new Date().toISOString();
    for (const [ch, add] of Object.entries(byCh)) {
      const prev = data.anatomie[ch] || { n: 0, ok: 0 };
      const n = (prev.n || 0) + add.n;
      const ok = (prev.ok || 0) + add.ok;
      const pct = n ? Math.round((ok / n) * 100) : 0;
      data.anatomie[ch] = {
        n,
        ok,
        pct,
        score20: score20(ok, n),
        level: levelFromPct(pct, n),
        updatedAt: now,
      };
    }
    save(data);
    return data;
  }

  function getAnatomie() {
    return load().anatomie || {};
  }

  function resetAnatomie() {
    const data = load();
    data.anatomie = {};
    save(data);
    return data;
  }

  global.PASS_SUIVI = {
    KEY,
    MIN_Q,
    CHAPTERS,
    load,
    recordSession,
    getAnatomie,
    resetAnatomie,
    levelFromPct,
    score20,
  };
})(window);
