/* Suivi local — scores QCM par chapitre (pas de serveur) */
(function (global) {
  const KEY = "pass_suivi_v2";
  const KEY_LEGACY = "pass_suivi_v1";
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

  function emptyRow() {
    return {
      n: 0,
      ok: 0,
      pct: 0,
      score20: null,
      level: "none",
      lastN: 0,
      lastOk: 0,
      lastPct: 0,
      lastScore20: null,
      lastLevel: "none",
      updatedAt: null,
      lastQcmAt: null,
    };
  }

  function migrateLegacy(legacy) {
    const anatomie = {};
    const src = (legacy && legacy.anatomie) || {};
    for (const [ch, row] of Object.entries(src)) {
      anatomie[ch] = {
        ...emptyRow(),
        n: row.n || 0,
        ok: row.ok || 0,
        pct: row.pct || 0,
        score20: row.score20 ?? null,
        level: row.level || "none",
        // ancienne pastille unique → traitée comme cumul ; dernière vide jusqu’à une session ≥10 Q
        lastN: 0,
        lastOk: 0,
        lastPct: 0,
        lastScore20: null,
        lastLevel: "none",
        updatedAt: row.updatedAt || null,
      };
    }
    return { anatomie };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (!data.anatomie) data.anatomie = {};
        return data;
      }
      const legacyRaw = localStorage.getItem(KEY_LEGACY);
      if (legacyRaw) {
        const migrated = migrateLegacy(JSON.parse(legacyRaw));
        save(migrated);
        return migrated;
      }
      return { anatomie: {} };
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

  function pack(ok, n) {
    const pct = n ? Math.round((ok / n) * 100) : 0;
    return {
      n,
      ok,
      pct,
      score20: score20(ok, n),
      level: levelFromPct(pct, n),
    };
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
      const prev = { ...emptyRow(), ...(data.anatomie[ch] || {}) };
      const cumul = pack((prev.ok || 0) + add.ok, (prev.n || 0) + add.n);

      let lastN = prev.lastN || 0;
      let lastOk = prev.lastOk || 0;
      let lastPct = prev.lastPct || 0;
      let lastScore20 = prev.lastScore20 ?? null;
      let lastLevel = prev.lastLevel || "none";

      // Dernière session : mise à jour seulement si ≥ 10 Q sur ce chapitre dans la session
      if (add.n >= MIN_Q) {
        const last = pack(add.ok, add.n);
        lastN = last.n;
        lastOk = last.ok;
        lastPct = last.pct;
        lastScore20 = last.score20;
        lastLevel = last.level;
      }

      data.anatomie[ch] = {
        ...cumul,
        lastN,
        lastOk,
        lastPct,
        lastScore20,
        lastLevel,
        updatedAt: now,
        lastQcmAt: now,
      };
    }
    save(data);
    return data;
  }

  function getAnatomie() {
    return load().anatomie || {};
  }

  function resetAnatomie() {
    const data = { anatomie: {} };
    save(data);
    localStorage.removeItem(KEY_LEGACY);
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
