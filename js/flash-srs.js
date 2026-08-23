/* Flash SRS Anki-lite — 1 module, facile à faire évoluer */
(function (global) {
  const KEY = "pass-flash-srs-v3";
  const KEY_V2 = "pass-flash-srs-v2";
  const KEY_V1 = "pass-flash-review-v1";
  const DEFAULT_EASE = 2.5;
  const MIN_EASE = 1.3;
  const SESSION_CAP = 40;
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
    const next = nextState(m[id], g);
    m[id] = next;
    save(m);
    return next;
  }

  function preview(id, g) {
    return nextState(get(id), g);
  }

  function formatDays(n) {
    n = Math.max(0, Number(n) || 0);
    if (n === 0) return "aujourd’hui";
    if (n === 1) return "1 j";
    return n + " j";
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
  }

  global.PASS_FLASH_SRS = {
    KEY: KEY,
    SESSION_CAP: SESSION_CAP,
    todayISO: todayISO,
    load: load,
    get: get,
    grade: grade,
    preview: preview,
    formatDays: formatDays,
    dueIds: dueIds,
    learningIds: learningIds,
    clear: clear,
  };
})(window);
