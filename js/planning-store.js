/* Planning + activité fiche (localStorage, 1 appareil) */
(function (global) {
  const KEY = "pass_planning_v1";

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

  const CHAPTER_ORDER = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { placements: [], activity: { anatomie: {} } };
      const data = JSON.parse(raw);
      if (!Array.isArray(data.placements)) data.placements = [];
      if (!data.activity) data.activity = { anatomie: {} };
      if (!data.activity.anatomie) data.activity.anatomie = {};
      return data;
    } catch (_) {
      return { placements: [], activity: { anatomie: {} } };
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function uid() {
    return "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function recordFicheOpen(chapter) {
    const ch = String(chapter || "").padStart(2, "0");
    if (!CHAPTERS[ch]) return;
    const data = load();
    const prev = data.activity.anatomie[ch] || {};
    data.activity.anatomie[ch] = {
      ...prev,
      lastFicheAt: new Date().toISOString(),
    };
    save(data);
  }

  function placeChapter(chapter, dateISO) {
    const ch = String(chapter || "").padStart(2, "0");
    if (!CHAPTERS[ch]) return null;
    const date = dateISO || todayISO();
    const data = load();
    const item = { id: uid(), chapter: ch, date: date };
    data.placements.push(item);
    const prev = data.activity.anatomie[ch] || {};
    data.activity.anatomie[ch] = {
      ...prev,
      lastPlanningAt: date,
    };
    save(data);
    return item;
  }

  function movePlacement(id, dateISO) {
    const data = load();
    const item = data.placements.find((p) => p.id === id);
    if (!item) return null;
    item.date = dateISO;
    const prev = data.activity.anatomie[item.chapter] || {};
    data.activity.anatomie[item.chapter] = {
      ...prev,
      lastPlanningAt: dateISO,
    };
    save(data);
    return item;
  }

  function removePlacement(id) {
    const data = load();
    data.placements = data.placements.filter((p) => p.id !== id);
    save(data);
  }

  function placementsOn(dateISO) {
    return load().placements.filter((p) => p.date === dateISO);
  }

  function getActivity(chapter) {
    const ch = String(chapter || "").padStart(2, "0");
    const act = load().activity.anatomie[ch] || {};
    let lastQcmAt = null;
    if (global.PASS_SUIVI) {
      const row = (global.PASS_SUIVI.getAnatomie() || {})[ch];
      if (row) lastQcmAt = row.lastQcmAt || row.updatedAt || null;
    }
    return {
      lastFicheAt: act.lastFicheAt || null,
      lastPlanningAt: act.lastPlanningAt || null,
      lastQcmAt,
    };
  }

  function getAllActivity() {
    const out = {};
    for (const ch of CHAPTER_ORDER) out[ch] = getActivity(ch);
    return out;
  }

  global.PASS_PLANNING = {
    KEY,
    CHAPTERS,
    CHAPTER_ORDER,
    load,
    save,
    todayISO,
    recordFicheOpen,
    placeChapter,
    movePlacement,
    removePlacement,
    placementsOn,
    getActivity,
    getAllActivity,
  };
})(window);
