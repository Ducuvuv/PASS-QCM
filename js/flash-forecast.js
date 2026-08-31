/* Prévision SRS flash — buckets par jour (localStorage pass-flash-srs-v3) */
(function (global) {
  const HORIZON = 7;
  const DAY_LABELS = ["Auj.", "Dem.", "J+2", "J+3", "J+4", "J+5", "J+6", "J+7"];

  function daysUntil(todayISO, dueISO) {
    const t = new Date(String(todayISO).slice(0, 10) + "T12:00:00");
    const d = new Date(String(dueISO).slice(0, 10) + "T12:00:00");
    return Math.round((d - t) / 86400000);
  }

  /** Compte les cartes par jour (cartes déjà vues ; auj. = file du jour). */
  function computeBuckets(cardIds, srsMap, todayISO) {
    const counts = new Array(HORIZON + 1).fill(0);
    const ids = cardIds || [];
    const m = srsMap || {};
    const t = todayISO || (global.PASS_FLASH_SRS && global.PASS_FLASH_SRS.todayISO()) || "";
    const SRS = global.PASS_FLASH_SRS;

    for (const id of ids) {
      const row = m[id];
      if (!row || !row.due) continue;
      let day = daysUntil(t, row.due);
      if (day < 0) day = 0;
      if (day > HORIZON) day = HORIZON;
      counts[day] += 1;
    }

    if (SRS && typeof SRS.todayStats === "function") {
      counts[0] = SRS.todayStats(ids).total;
    }

    const buckets = [];
    for (let i = 0; i <= HORIZON; i++) {
      buckets.push({
        day: i,
        label: i === HORIZON ? "J+7+" : DAY_LABELS[i] || "J+" + i,
        count: counts[i],
      });
    }
    return buckets;
  }

  function summary(buckets) {
    const today = buckets[0] ? buckets[0].count : 0;
    let week = 0;
    for (let i = 0; i < buckets.length; i++) week += buckets[i].count;
    return { today: today, week: week };
  }

  function render(container, buckets, opts) {
    if (!container) return;
    opts = opts || {};
    const emptyMsg = opts.emptyMessage || "Choisis un chapitre";
    const total = buckets.reduce((s, b) => s + b.count, 0);

    if (!total) {
      container.innerHTML =
        '<div class="fc-forecast fc-forecast--empty" aria-hidden="false">' +
        '<p class="fc-forecast-empty">' + emptyMsg + "</p></div>";
      return;
    }

    const max = Math.max.apply(null, buckets.map((b) => b.count).concat([1]));
    const sum = summary(buckets);
    let bars = "";
    for (const b of buckets) {
      if (b.count === 0 && b.day > 4) continue;
      const pct = Math.round((b.count / max) * 100);
      const hot = b.day === 0 && b.count > 0;
      bars +=
        '<div class="fc-forecast-row' + (hot ? " fc-forecast-row--today" : "") + '">' +
        '<span class="fc-forecast-label">' + b.label + "</span>" +
        '<span class="fc-forecast-track" aria-hidden="true">' +
        '<span class="fc-forecast-fill" style="width:' + pct + '%"></span>' +
        "</span>" +
        '<span class="fc-forecast-n">' + b.count + "</span>" +
        "</div>";
    }

    container.innerHTML =
      '<div class="fc-forecast" role="group" aria-label="Prévision des révisions">' +
      '<div class="fc-forecast-head">' +
      '<span class="fc-forecast-title">Prévision</span>' +
      '<span class="fc-forecast-sum">' +
      sum.today + " auj. · " + sum.week + " sur 8 j" +
      "</span></div>" +
      '<div class="fc-forecast-bars">' + bars + "</div>" +
      "</div>";
  }

  function refresh(container, cardIds, opts) {
    const SRS = global.PASS_FLASH_SRS;
    if (!SRS) {
      render(container, [], { emptyMessage: "SRS indisponible" });
      return;
    }
    const buckets = computeBuckets(cardIds, SRS.load(), SRS.todayISO());
    render(container, buckets, opts);
  }

  global.PASS_FLASH_FORECAST = {
    HORIZON: HORIZON,
    computeBuckets: computeBuckets,
    summary: summary,
    render: render,
    refresh: refresh,
  };
})(window);
