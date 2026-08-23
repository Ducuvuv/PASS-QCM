/* QCM player - extracted from qcm-player.html (no UX change). */
const CHAPTER_META = {
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
const LOTS_FILE_V = "1";
window.PASS_LOTS = window.PASS_LOTS || {};
const lots = window.PASS_LOTS;
const lotsIndex = window.PASS_LOTS_INDEX || {};
const lotLoadState = {}; // ch -> Promise

function chapterCount(ch) {
  if ((lots[ch] || []).length) return lots[ch].length;
  return Number(lotsIndex[ch] || 0);
}

function loadChapterLot(ch) {
  const key = String(ch).padStart(2, "0");
  if ((lots[key] || []).length) return Promise.resolve(key);
  if (lotLoadState[key]) return lotLoadState[key];
  lotLoadState[key] = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "./data/lots/ch" + key + ".js?v=" + LOTS_FILE_V;
    s.async = true;
    s.onload = () => {
      if (!(lots[key] || []).length) {
        reject(new Error("empty lot " + key));
        return;
      }
      resolve(key);
    };
    s.onerror = () => reject(new Error("failed lot " + key));
    document.head.appendChild(s);
  });
  return lotLoadState[key];
}

function loadChapterLots(chs) {
  const uniq = [...new Set((chs || []).map((c) => String(c).padStart(2, "0")))];
  return Promise.all(uniq.map(loadChapterLot));
}

const elSetup = document.getElementById("setup");
const elQuiz = document.getElementById("quiz");
const elResults = document.getElementById("results");
const elChapterList = document.getElementById("chapter-list");
const elPriorityList = document.getElementById("priority-list");
const elQcount = document.getElementById("qcount");
const elModeList = document.getElementById("mode-list");
const elPoolHint = document.getElementById("pool-hint");
const elProgress = document.getElementById("progress");
const elStem = document.getElementById("stem");
const elImgWrap = document.getElementById("q-img-wrap");
const elImg = document.getElementById("q-img");
const elChoices = document.getElementById("choices");
const elItemScore = document.getElementById("item-score");
const elTags = document.getElementById("tags");
const panel = document.getElementById("panel");
const btnValidate = document.getElementById("btn-validate");
const btnNext = document.getElementById("btn-next");

let sessionItems = [];
let index = 0;
let revealed = false;
let correctCount = 0;
let history = []; // { id, ok, chapter, tags }
let lastSettings = null;
let lastWrongItems = [];

function availableChapters() {
  return Object.keys(CHAPTER_META)
    .filter((ch) => chapterCount(ch) > 0)
    .sort((a, b) => Number(a) - Number(b));
}

function selectedChapters() {
  return [...elChapterList.querySelectorAll(".ch-chip[aria-pressed='true']")].map(
    (btn) => btn.getAttribute("data-ch")
  );
}

function selectedMode() {
  const btn = elModeList.querySelector(".mode-btn[aria-pressed='true']");
  return (btn && btn.getAttribute("data-mode")) || "shuffle";
}

function selectedPriorities() {
  return [...elPriorityList.querySelectorAll(".prio-btn[aria-pressed='true']")].map(
    (btn) => btn.getAttribute("data-prio")
  );
}

function itemPriority(item) {
  const raw = item && (item.priority || item.prio || "");
  const p = String(raw).trim().toUpperCase();
  if (p === "P1" || p === "P2" || p === "P3") return p;
  const tags = (item && item.tags) || [];
  for (const t of tags) {
    const u = String(t).trim().toUpperCase();
    if (u === "P1" || u === "P2" || u === "P3") return u;
  }
  return null;
}

function isPrioTag(t) {
  const u = String(t).trim().toUpperCase();
  return u === "P1" || u === "P2" || u === "P3";
}

function poolByTag(tag, chapters) {
  const chs = chapters && chapters.length ? chapters : availableChapters();
  const needle = String(tag).trim().toLowerCase();
  const pool = [];
  for (const ch of chs) {
    for (const item of lots[ch] || []) {
      const tags = (item.tags || []).map((t) => String(t).trim().toLowerCase());
      if (tags.includes(needle)) pool.push(item);
    }
  }
  return pool;
}

function poolFrom(chapters, priorities) {
  const allow = new Set(priorities && priorities.length ? priorities : ["P1", "P2", "P3"]);
  const pool = [];
  for (const ch of chapters) {
    for (const item of lots[ch] || []) {
      const p = itemPriority(item);
      if (p && allow.has(p)) pool.push(item);
    }
  }
  return pool;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function updatePoolHint() {
  const chs = selectedChapters();
  const prios = selectedPriorities();
  const missing = chs.filter((ch) => !(lots[ch] || []).length);
  if (chs.length && missing.length) {
    elPoolHint.innerHTML = '<span class="pool-stat">Chargement…</span>';
    document.getElementById("btn-start").disabled = true;
    loadChapterLots(chs)
      .then(() => updatePoolHint())
      .catch((e) => {
        console.error(e);
        elPoolHint.innerHTML = '<span class="pool-stat warn">Erreur chargement QCM</span>';
      });
    return;
  }
  const pool = poolFrom(chs, prios);
  const n = pool.length;
  const c1 = pool.filter((i) => itemPriority(i) === "P1").length;
  const c2 = pool.filter((i) => itemPriority(i) === "P2").length;
  const c3 = pool.filter((i) => itemPriority(i) === "P3").length;

  elPoolHint.innerHTML = "";
  if (!chs.length) {
    elPoolHint.innerHTML = '<span class="pool-stat warn">Aucun chapitre</span>';
  } else if (!prios.length) {
    elPoolHint.innerHTML = '<span class="pool-stat warn">Aucune priorité</span>';
  } else {
    elPoolHint.innerHTML =
      '<span class="pool-stat total">' + n + " Q</span>" +
      '<span class="pool-stat">P1 · ' + c1 + "</span>" +
      '<span class="pool-stat">P2 · ' + c2 + "</span>" +
      '<span class="pool-stat">P3 · ' + c3 + "</span>";
  }
  elQcount.max = Math.max(1, n || 1);
  if (Number(elQcount.value) > n && n > 0) elQcount.value = n;
  document.getElementById("btn-start").disabled = !chs.length || !prios.length || n === 0;
}

function buildChapterList() {
  elChapterList.innerHTML = "";
  const params = new URLSearchParams(location.search);
  const focusCh = (params.get("ch") || "").padStart(2, "0");
  const focusOk = focusCh && CHAPTER_META[focusCh];
  for (const ch of availableChapters()) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ch-chip";
    btn.setAttribute("data-ch", ch);
    const on = focusOk ? ch === focusCh : true;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    const n = chapterCount(ch);
    btn.innerHTML =
      '<span class="ch-id">' + ch + '</span>' +
      '<span class="ch-name">' + CHAPTER_META[ch] + " · " + n + "</span>";
    btn.addEventListener("click", () => {
      const pressed = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", pressed ? "false" : "true");
      updatePoolHint();
    });
    elChapterList.appendChild(btn);
  }
  elPriorityList.querySelectorAll(".prio-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const on = btn.getAttribute("aria-pressed") !== "true";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      updatePoolHint();
    });
  });
  elModeList.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      elModeList.querySelectorAll(".mode-btn").forEach((b) => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
    });
  });
  updatePoolHint();
}

function show(view) {
  elSetup.classList.toggle("hidden", view !== "setup");
  elQuiz.classList.toggle("hidden", view !== "quiz");
  elResults.classList.toggle("hidden", view !== "results");
}

function norm(arr) {
  return [...arr].map(String).sort().join(",");
}

function startSession(settings) {
  const begin = () => {
    const fixed =
      settings.fixedItems && settings.fixedItems.length
        ? settings.fixedItems
        : null;
    if (!fixed) lastSettings = settings;
    let picked;
    if (fixed) {
      picked = settings.mode === "order" ? [...fixed] : shuffle(fixed);
    } else {
      const pool = poolFrom(settings.chapters, settings.priorities);
      picked = settings.mode === "order" ? [...pool] : shuffle(pool);
    }
    const n = Math.min(settings.count || picked.length, picked.length);
    sessionItems = picked.slice(0, n);
    index = 0;
    revealed = false;
    correctCount = 0;
    history = [];
    show("quiz");
    renderQuestion();
  };
  if (settings.fixedItems && settings.fixedItems.length) {
    begin();
    return;
  }
  const btnStart = document.getElementById("btn-start");
  if (btnStart) btnStart.disabled = true;
  loadChapterLots(settings.chapters || [])
    .then(begin)
    .catch((e) => {
      console.error(e);
      alert("Impossible de charger les QCM de ce chapitre.");
      if (btnStart) btnStart.disabled = false;
      show("setup");
      updatePoolHint();
    });
}

function renderQuestion() {
  const item = sessionItems[index];
  if (!item) {
    finishSession();
    return;
  }
  revealed = false;
  panel.classList.remove("revealed");
  elItemScore.classList.remove("show");
  elItemScore.textContent = "";
  btnValidate.disabled = false;
  btnNext.disabled = true;
  elProgress.textContent = `${index + 1} / ${sessionItems.length} · ch.${item.chapter} · ${itemPriority(item) || "?"} · ${item.id}`;
  elStem.textContent = item.stem;
  if (item.image) {
    elImg.src = item.image;
    elImgWrap.classList.remove("hidden");
  } else {
    elImg.removeAttribute("src");
    elImgWrap.classList.add("hidden");
  }
  elTags.textContent = (item.tags || []).map((t) => `#${t}`).join("  ");

  elChoices.innerHTML = "";
  for (const letter of ["A", "B", "C", "D", "E"]) {
    const label = document.createElement("label");
    label.className = "choice";
    label.dataset.letter = letter;
    label.innerHTML = `
      <input type="checkbox" name="choice" value="${letter}" />
      <span><strong>${letter}.</strong> ${item.choices[letter]}
        <span class="why"></span>
      </span>
    `;
    elChoices.appendChild(label);
  }
}

function validate() {
  const item = sessionItems[index];
  if (!item || revealed) return;

  const selected = [...elChoices.querySelectorAll('input[type="checkbox"]:checked')].map(
    (i) => i.value
  );
  const ok = norm(selected) === norm(item.answer);

  revealed = true;
  panel.classList.add("revealed");
  btnNext.disabled = false;
  btnValidate.disabled = true;
  if (ok) correctCount += 1;
  history.push({
    id: item.id,
    ok,
    chapter: item.chapter,
    tags: item.tags || [],
  });

  for (const letter of ["A", "B", "C", "D", "E"]) {
    const row = elChoices.querySelector(`[data-letter="${letter}"]`);
    const exp = item.explanations[letter];
    const why = row.querySelector(".why");
    const isCorrect = !!exp.correct;
    row.classList.add(isCorrect ? "reveal-ok" : "reveal-bad");
    row.querySelector("input").disabled = true;
    why.innerHTML = `<span class="mark ${isCorrect ? "ok" : "bad"}">${
      isCorrect ? "Vrai" : "Faux"
    }</span> — ${exp.why}`;
  }

  elItemScore.classList.add("show");
  elItemScore.innerHTML = ok
    ? `<strong>OK</strong> — réponse <strong>${item.answer.join(", ")}</strong>.`
    : `<strong>À revoir</strong> — tu as coché <strong>${
        selected.length ? selected.join(", ") : "(rien)"
      }</strong> · corrigé <strong>${item.answer.join(", ")}</strong>.`;
}

function finishSession() {
  const total = history.length || sessionItems.length;
  const score = correctCount;
  const pct = total ? Math.round((score / total) * 100) : 0;

  document.getElementById("final-score").textContent = `${score} / ${total}`;
  document.getElementById("final-label").textContent = `${pct} %`;
  document.getElementById("results-sub").textContent =
    lastSettings && lastSettings.chapters.length
      ? `${lastSettings.chapters.map((c) => c).join(" · ")} · ${(lastSettings.priorities || []).join(", ") || "—"}`
      : "";

  const feedback = document.getElementById("feedback-text");
  if (pct >= 85) {
    feedback.textContent = "Très bon lot — garde des révisions courtes.";
  } else if (pct >= 65) {
    feedback.textContent = "Solide. Relis les ratés, puis relance ciblé.";
  } else if (pct >= 40) {
    feedback.textContent = "Fragile. Cours sur les thèmes faibles, puis 10–15 Q.";
  } else {
    feedback.textContent = "Priorise le cours, puis recommence avec moins de Q.";
  }

  const wrong = history.filter((h) => !h.ok);
  const tagCount = {};
  const chCount = {};
  for (const h of wrong) {
    chCount[h.chapter] = (chCount[h.chapter] || 0) + 1;
    for (const t of h.tags) tagCount[t] = (tagCount[t] || 0) + 1;
  }
  const topTags = Object.entries(tagCount)
    .filter(([t]) => !isPrioTag(t))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const weakCh = Object.entries(chCount).sort((a, b) => b[1] - a[1]);

  const byId = new Map(sessionItems.map((it) => [it.id, it]));
  lastWrongItems = wrong.map((h) => byId.get(h.id)).filter(Boolean);
  const btnWrong = document.getElementById("btn-retry-wrong");
  if (btnWrong) {
    btnWrong.disabled = lastWrongItems.length === 0;
    btnWrong.textContent = lastWrongItems.length
      ? "Ratés (" + lastWrongItems.length + ")"
      : "Ratés";
  }
  const nextEl = document.getElementById("next-links");
  if (nextEl) {
    nextEl.innerHTML = "";
    const primaryCh =
      (weakCh[0] && weakCh[0][0]) ||
      (lastSettings && lastSettings.chapters && lastSettings.chapters[0]) ||
      null;
    if (primaryCh) {
      const padFlash = String(primaryCh).padStart(2, "0");
      const aSrs = document.createElement("a");
      aSrs.className = "primary-next";
      aSrs.href = "./flashcards.html?ch=" + padFlash + "&mode=due";
      aSrs.textContent = "Flash à faire · ch." + padFlash;
      nextEl.appendChild(aSrs);
    }
    const aSuivi = document.createElement("a");
    aSuivi.href = "./suivi.html";
    aSuivi.textContent = "Suivi";
    nextEl.appendChild(aSuivi);
    const aHome = document.createElement("a");
    aHome.href = "./index.html";
    aHome.textContent = "Accueil";
    nextEl.appendChild(aHome);
    const topCh = weakCh.slice(0, 2).map(([c]) => c);
    for (const ch of topCh) {
      const pad = String(ch).padStart(2, "0");
      const aQcm = document.createElement("a");
      aQcm.href = "./qcm-player.html?ch=" + pad;
      aQcm.textContent = "QCM " + pad;
      nextEl.appendChild(aQcm);
      if (String(ch).padStart(2, "0") !== String(primaryCh || "").padStart(2, "0")) {
        const aFlash = document.createElement("a");
        aFlash.href = "./flashcards.html?ch=" + pad + "&mode=due";
        aFlash.textContent = "Flash " + pad;
        nextEl.appendChild(aFlash);
      }
      const aFiche = document.createElement("a");
      aFiche.href = "./matiere/anatomie/ch" + pad + ".html";
      aFiche.textContent = "Fiche " + pad;
      nextEl.appendChild(aFiche);
    }
  }

  const advice = [];
  if (wrong.length === 0) {
    advice.push("Parfait : enchaîne sur un autre chapitre ou augmente le nombre de questions.");
    advice.push("Teste un mix multi-chapitres pour vérifier le transfert entre cours.");
  } else {
    advice.push(
      `Relis le corrigé des ${wrong.length} question${wrong.length > 1 ? "s" : ""} manquée${wrong.length > 1 ? "s" : ""} (surtout les distracteurs « presque vrais »).`
    );
    if (weakCh.length) {
      advice.push(
        `Chapitre(s) à revoir en priorité : ${weakCh
          .slice(0, 3)
          .map(([c, n]) => `${c} ${CHAPTER_META[c]} (${n} erreur${n > 1 ? "s" : ""})`)
          .join(", ")}.`
      );
    }
    if (topTags.length) {
      advice.push("Concentre-toi sur les tags ci-dessous — ce sont les notions les plus ratées de la session.");
    }
    if (pct < 65) {
      advice.push("Fais une session courte (8–12 Q) sur un seul chapitre faible avant de remélanger.");
    } else {
      advice.push("Refais une session aléatoire du même pool dans 24–48 h pour consolider.");
    }
    advice.push("En QCM à choix multiples, vérifie chaque proposition A–E : une seule erreur fait rater la question.");
  }

  const ul = document.getElementById("advice-list");
  ul.innerHTML = "";
  for (const a of advice) {
    const li = document.createElement("li");
    li.textContent = a;
    ul.appendChild(li);
  }

  const weakEl = document.getElementById("weak-tags");
  weakEl.innerHTML = "";
  for (const [c, n] of weakCh.slice(0, 3)) {
    const pad = String(c).padStart(2, "0");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip ch";
    btn.textContent = "ch." + pad + " ×" + n;
    btn.title = "QCM sur ce chapitre";
    btn.addEventListener("click", () => {
      location.href = "./qcm-player.html?ch=" + pad;
    });
    weakEl.appendChild(btn);
  }
  for (const [t, n] of topTags) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = "#" + t + " ×" + n;
    btn.title = "Session sur ce tag";
    btn.addEventListener("click", () => {
      const chs = lastSettings && lastSettings.chapters.length
        ? lastSettings.chapters
        : availableChapters();
      const pool = poolByTag(t, chs);
      if (!pool.length) return;
      const count = Math.min(15, pool.length);
      startSession({
        chapters: chs,
        priorities: lastSettings ? lastSettings.priorities : ["P1", "P2", "P3"],
        count,
        mode: "shuffle",
        fixedItems: pool,
      });
    });
    weakEl.appendChild(btn);
  }

  document.getElementById("recap").textContent =
    total > 0
      ? `${score} bonne${score > 1 ? "s" : ""} · ${wrong.length} à revoir · ${total} question${total > 1 ? "s" : ""}.`
      : "Aucune question répondue.";

  if (window.PASS_SUIVI && history.length) {
    window.PASS_SUIVI.recordSession(history);
  }

  try {
    const contCh =
      (weakCh[0] && weakCh[0][0]) ||
      (lastSettings && lastSettings.chapters && lastSettings.chapters[0]) ||
      null;
    if (contCh) {
      localStorage.setItem(
        "pass_continue_v1",
        JSON.stringify({
          ch: String(contCh).padStart(2, "0"),
          at: new Date().toISOString(),
          reason: weakCh.length ? "weak" : "last",
        })
      );
    }
  } catch (_) {}

  show("results");
}

document.getElementById("btn-all").addEventListener("click", () => {
  elChapterList.querySelectorAll(".ch-chip").forEach((b) => b.setAttribute("aria-pressed", "true"));
  updatePoolHint();
});
document.getElementById("btn-none").addEventListener("click", () => {
  elChapterList.querySelectorAll(".ch-chip").forEach((b) => b.setAttribute("aria-pressed", "false"));
  updatePoolHint();
});
document.getElementById("btn-start").addEventListener("click", () => {
  const chapters = selectedChapters();
  const priorities = selectedPriorities();
  const poolN = poolFrom(chapters, priorities).length;
  const count = Math.min(Math.max(1, Number(elQcount.value) || 1), poolN);
  elQcount.value = count;
  startSession({ chapters, priorities, count, mode: selectedMode() });
});
btnValidate.addEventListener("click", validate);
btnNext.addEventListener("click", () => {
  index += 1;
  if (index >= sessionItems.length) finishSession();
  else renderQuestion();
});
document.getElementById("btn-abort").addEventListener("click", () => {
  if (history.length) finishSession();
  else show("setup");
});
document.getElementById("btn-retry").addEventListener("click", () => {
  if (lastSettings) startSession(lastSettings);
});
document.getElementById("btn-retry-wrong").addEventListener("click", () => {
  if (!lastWrongItems.length) return;
  startSession({
    chapters: lastSettings ? lastSettings.chapters : [],
    priorities: lastSettings ? lastSettings.priorities : ["P1", "P2", "P3"],
    count: lastWrongItems.length,
    mode: lastSettings ? lastSettings.mode : "shuffle",
    fixedItems: lastWrongItems,
  });
});
document.getElementById("btn-home").addEventListener("click", () => show("setup"));

buildChapterList();
show("setup");
