/* Flash SRS Anki-lite — 1 module, facile à faire évoluer */
(function (global) {
  const KEY = "pass-flash-srs-v3";
  const KEY_V2 = "pass-flash-srs-v2";
  const KEY_V1 = "pass-flash-review-v1";
  const DEFAULT_EASE = 2.5;
  const MIN_EASE = 1.3;
  const SESSION_CAP = 40;
  const NEW_DAILY_LIMIT = 20;
  const NEW_DAY_KEY = "pass-flash-new-day-v1";
  const V2_BOX_DAYS = [0, 1, 3, 7, 14];

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

  function addDaysISO(iso, days) {
    const d = new Date(String(iso).slice(0, 10) + "T12:00:00");
    d.setDate(d.getDate() + Math.max(0, days | 0));
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function blank() {
    return {
      due: todayISO(),
      interval: 0,
      ease: DEFAULT_EASE,
      reps: 0,
      lapses: 0,
    };
  }

  function migrateV2(raw) {
    const out = {};
    for (const [id, row] of Object.entries(raw || {})) {
      const box = Math.max(0, Number(row && row.box) || 0);
      const interval = V2_BOX_DAYS[Math.min(box, V2_BOX_DAYS.length - 1)] || 0;
      out[id] = {
        due: String((row && row.due) || todayISO()).slice(0, 10),
        interval: interval,
        ease: DEFAULT_EASE,
        reps: box,
        lapses: box === 0 ? 1 : 0,
      };
    }
    return out;
  }

  function migrateV1(raw) {
    const out = {};
    const t = todayISO();
    for (const [id, val] of Object.entries(raw || {})) {
      if (val === "review") out[id] = blank();
    }
    return out;
  }

  function load() {
    try {
      const v3 = localStorage.getItem(KEY);
      if (v3) return JSON.parse(v3) || {};
    } catch (_) {}
    try {
      const v2 = localStorage.getItem(KEY_V2);
      if (v2) {
        const migrated = migrateV2(JSON.parse(v2) || {});
        save(migrated);
        return migrated;
      }
    } catch (_) {}
    try {
      const v1 = localStorage.getItem(KEY_V1);
      if (v1) {
        const migrated = migrateV1(JSON.parse(v1) || {});
        save(migrated);
        return migrated;
      }
    } catch (_) {}
    return {};
  }

  function save(map) {
    try {
      localStorage.setItem(KEY, JSON.stringify(map || {}));
    } catch (_) {}
  }

  function get(id) {
    const m = load();
    return m[id] ? Object.assign({}, m[id]) : null;
  }

  /** next state without writing — grade: again | good | easy */
  function nextState(prev, grade) {
    const cur = prev ? Object.assign({}, prev) : blank();
    let ease = Number(cur.ease);
    if (!(ease > 0)) ease = DEFAULT_EASE;
    let interval = Math.max(0, Number(cur.interval) || 0);
    let reps = Math.max(0, Number(cur.reps) || 0);
    let lapses = Math.max(0, Number(cur.lapses) || 0);
    const t = todayISO();

    if (grade === "again") {
      lapses += 1;
      reps = 0;
      interval = 0;
      ease = Math.max(MIN_EASE, ease - 0.2);
    } else if (grade === "easy") {
      if (reps === 0) interval = 4;
      else if (reps === 1) interval = Math.max(4, Math.round(interval * ease * 1.3) || 4);
      else interval = Math.max(4, Math.round(interval * ease * 1.3));
      ease = ease + 0.15;
      reps += 1;
    } else {
      // good
      if (reps === 0) interval = 1;
      else if (reps === 1) interval = 3;
      else interval = Math.max(1, Math.round(interval * ease));
      reps += 1;
    }

    return {
      due: addDaysISO(t, interval),
      interval: interval,
      ease: Math.round(ease * 100) / 100,
      reps: reps,
      lapses: lapses,
    };
  }

  function grade(id, g) {
    if (!id) return null;
    if (g !== "again" && g !== "good" && g !== "easy") g = "good";
    const m = load();
    const wasNew = !m[id];
    const next = nextState(m[id], g);
    m[id] = next;
    save(m);
    if (wasNew) bumpNewDayCount();
    return next;
  }

  function preview(id, g) {
    return nextState(get(id), g);
  }

  function formatDays(n) {
    n = Math.max(0, Number(n) || 0);
    if (n === 0) return "aujourd’hui";
    if (n === 1) return "demain";
    return "dans " + n + " jours";
  }

  function loadNewDayCount() {
    try {
      const raw = JSON.parse(localStorage.getItem(NEW_DAY_KEY));
      if (raw && raw.date === todayISO()) return Math.max(0, Number(raw.count) || 0);
    } catch (_) {}
    return 0;
  }

  function bumpNewDayCount() {
    const t = todayISO();
    let count = 0;
    try {
      const raw = JSON.parse(localStorage.getItem(NEW_DAY_KEY));
      if (raw && raw.date === t) count = Math.max(0, Number(raw.count) || 0);
    } catch (_) {}
    count += 1;
    try {
      localStorage.setItem(NEW_DAY_KEY, JSON.stringify({ date: t, count: count }));
    } catch (_) {}
  }

  function newSlotsLeft(newAvail) {
    const left = NEW_DAILY_LIMIT - loadNewDayCount();
    return Math.max(0, Math.min(left, Math.max(0, Number(newAvail) || 0)));
  }

  /** Nouvelles du jour : tour de rôle entre chapitres (PASS = multi-UE). */
  function pickNewRoundRobin(candidates, slots) {
    if (!slots || !candidates || !candidates.length) return [];
    const byCh = {};
    for (const id of candidates) {
      const ch = chapterFromId(id) || "00";
      if (!byCh[ch]) byCh[ch] = [];
      byCh[ch].push(id);
    }
    const keys = Object.keys(byCh).sort();
    const out = [];
    while (out.length < slots) {
      let added = false;
      for (const k of keys) {
        if (out.length >= slots) break;
        if (byCh[k].length) {
          out.push(byCh[k].shift());
          added = true;
        }
      }
      if (!added) break;
    }
    return out;
  }

  /** Découpe la file du jour (logique Anki : révisions + ratées + nouvelles plafonnées). */
  function splitToday(cardIds) {
    const m = load();
    const t = todayISO();
    let reviews = 0;
    let learning = 0;
    let newAvail = 0;
    for (const id of cardIds || []) {
      const row = m[id];
      if (!row) {
        newAvail += 1;
        continue;
      }
      if (String(row.due || "") > t) continue;
      if ((Number(row.interval) || 0) === 0) learning += 1;
      else reviews += 1;
    }
    const newToday = newSlotsLeft(newAvail);
    return {
      reviews: reviews,
      learning: learning,
      newAvail: newAvail,
      newToday: newToday,
      newUsedToday: loadNewDayCount(),
      total: reviews + learning + newToday,
    };
  }

  /** File réelle du jour — pas toutes les cartes jamais vues d'un coup. */
  function queueIds(cardIds) {
    const m = load();
    const t = todayISO();
    const out = new Set();
    const newCandidates = [];
    for (const id of cardIds || []) {
      const row = m[id];
      if (!row) {
        newCandidates.push(id);
        continue;
      }
      if (String(row.due || "") <= t) out.add(id);
    }
    const slots = newSlotsLeft(newCandidates.length);
    for (const id of pickNewRoundRobin(newCandidates, slots)) out.add(id);
    return out;
  }

  function todayStats(cardIds) {
    return splitToday(cardIds);
  }

  function formatTodayStats(stats) {
    if (!stats || !stats.total) return "Rien en retard";
    const parts = [];
    if (stats.reviews) parts.push(stats.reviews + " révisions");
    if (stats.learning) parts.push(stats.learning + " ratées");
    if (stats.newToday) parts.push(stats.newToday + " nouvelles");
    return parts.join(" · ");
  }

  /** dues = jamais vue OU due ≤ today */
  function dueIds(cardIds) {
    const m = load();
    const t = todayISO();
    const out = new Set();
    for (const id of cardIds || []) {
      const row = m[id];
      if (!row) {
        out.add(id);
        continue;
      }
      if (String(row.due || "") <= t) out.add(id);
    }
    return out;
  }

  /** à revoir = cartes déjà vues, interval 0 (échec récent) */
  function learningIds(cardIds) {
    const m = load();
    const out = new Set();
    const filter = cardIds ? new Set(cardIds) : null;
    for (const [id, row] of Object.entries(m)) {
      if (filter && !filter.has(id)) continue;
      if ((Number(row.interval) || 0) === 0) out.add(id);
    }
    return out;
  }

  function clear() {
    save({});
    try {
      localStorage.removeItem(NEW_DAY_KEY);
    } catch (_) {}
  }

  function chapterFromId(id) {
    const m = String(id || "").match(/-(\d{2})-/);
    return m ? m[1] : null;
  }

  /** Compteurs flash par chapitre (cartes déjà vues seulement). */
  function chapterStats() {
    const m = load();
    const t = todayISO();
    const by = {};
    let dueTotal = 0;
    let learningTotal = 0;
    for (const [id, row] of Object.entries(m)) {
      const ch = chapterFromId(id);
      if (!ch) continue;
      if (!by[ch]) by[ch] = { due: 0, learning: 0 };
      const due = String(row.due || "") <= t;
      const learning = (Number(row.interval) || 0) === 0;
      if (due) {
        by[ch].due += 1;
        dueTotal += 1;
      }
      if (learning) {
        by[ch].learning += 1;
        learningTotal += 1;
      }
    }
    return { byChapter: by, dueTotal: dueTotal, learningTotal: learningTotal };
  }

  global.PASS_FLASH_SRS = {
    KEY: KEY,
    SESSION_CAP: SESSION_CAP,
    NEW_DAILY_LIMIT: NEW_DAILY_LIMIT,
    todayISO: todayISO,
    load: load,
    get: get,
    grade: grade,
    preview: preview,
    formatDays: formatDays,
    formatTodayStats: formatTodayStats,
    dueIds: dueIds,
    queueIds: queueIds,
    todayStats: todayStats,
    splitToday: splitToday,
    learningIds: learningIds,
    chapterFromId: chapterFromId,
    chapterStats: chapterStats,
    clear: clear,
  };
})(window);
