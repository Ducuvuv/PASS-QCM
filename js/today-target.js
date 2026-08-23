/* Cible du jour — 1 source pour Accueil / Planning / Continuer */
(function (global) {
  const KEY = "pass_today_v1";
  const CONTINUE_KEY = "pass_continue_v1";

  function todayISO() {
    const d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function worstLevel(S, row) {
    const lastReady = (row.lastN || 0) >= S.MIN_Q;
    const cumulReady = (row.n || 0) >= S.MIN_Q;
    const last = lastReady ? row.lastLevel || "none" : "none";
    const cumul = cumulReady ? row.level || "none" : "none";
    if (last === "red" || cumul === "red") return "red";
    if (last === "blue" || cumul === "blue") return "blue";
    return "none";
  }

  function rankLevel(level) {
    if (level === "red") return 0;
    if (level === "blue") return 1;
    return 9;
  }

  function readContinueHint() {
    try {
      return JSON.parse(localStorage.getItem(CONTINUE_KEY) || "null");
    } catch (_) {
      return null;
    }
  }

  function pickTarget() {
    const S = global.PASS_SUIVI;
    if (!S) return null;

    const data = S.getAnatomie() || {};
    const weak = [];
    for (const ch of S.CHAPTER_ORDER) {
      const row = data[ch] || {};
      const level = worstLevel(S, row);
      if (level === "red" || level === "blue") {
        weak.push({
          ch,
          level,
          rank: rankLevel(level),
          at: row.lastQcmAt || row.updatedAt || "",
        });
      }
    }
    weak.sort(
      (a, b) =>
        a.rank - b.rank ||
        String(b.at).localeCompare(String(a.at)) ||
        a.ch.localeCompare(b.ch)
    );
    if (weak[0]) {
      return { ch: weak[0].ch, reason: "review", level: weak[0].level };
    }

    const hint = readContinueHint();
    if (hint && hint.ch && S.CHAPTERS[hint.ch]) {
      return { ch: hint.ch, reason: "last", level: null };
    }

    let best = null;
    for (const ch of S.CHAPTER_ORDER) {
      const row = data[ch] || {};
      if (!(row.n > 0)) continue;
      const at = row.lastQcmAt || row.updatedAt || "";
      if (!best || String(at) > String(best.at)) best = { ch, at };
    }
    if (best) return { ch: best.ch, reason: "last", level: null };

    // bootstrap : premier chapitre du programme
    const first = S.CHAPTER_ORDER[0];
    return { ch: first, reason: "start", level: null };
  }

  function saveToday(target) {
    if (!target || !target.ch) return;
    const payload = {
      ch: String(target.ch).padStart(2, "0"),
      reason: target.reason || "today",
      level: target.level || null,
      day: todayISO(),
      at: new Date().toISOString(),
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(payload));
    } catch (_) {}
    return payload;
  }

  function readToday() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!raw || !raw.ch) return null;
      if (raw.day && raw.day !== todayISO()) return null;
      return raw;
    } catch (_) {
      return null;
    }
  }

  function getTodayTarget(forceRefresh) {
    if (!forceRefresh) {
      const cached = readToday();
      if (cached) return cached;
    }
    const picked = pickTarget();
    if (!picked) return null;
    return saveToday(picked);
  }

  function hrefsFor(ch) {
    const pad = String(ch).padStart(2, "0");
    return {
      qcm: "./qcm-player.html?ch=" + pad,
      flash: "./flashcards.html?ch=" + pad + "&mode=due",
      fiche: "./matiere/anatomie/ch" + pad + ".html",
    };
  }

  global.PASS_TODAY = {
    KEY,
    pickTarget,
    getTodayTarget,
    saveToday,
    readToday,
    hrefsFor,
    todayISO,
  };
})(window);
