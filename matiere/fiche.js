/* Chrono + mode lecture + cloze + flashcards (local, no server) */
(function () {
  const body = document.body;
  const chronoEl = document.getElementById("chrono");
  const btnLecture =
    document.getElementById("btn-lecture") || document.getElementById("btn-focus");
  const btnChrono = document.getElementById("btn-chrono");

  let seconds = 0;
  let ticking = false;
  let timerId = null;

  function fmt(s) {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  function tick() {
    seconds += 1;
    if (chronoEl) chronoEl.textContent = fmt(seconds);
  }

  if (btnChrono && chronoEl) {
    btnChrono.addEventListener("click", () => {
      if (ticking) {
        clearInterval(timerId);
        ticking = false;
        btnChrono.textContent = "Start";
      } else {
        ticking = true;
        btnChrono.textContent = "Pause";
        timerId = setInterval(tick, 1000);
      }
    });
  }

  // Cloze: data-answers is JSON array of accepted strings (lowercase compare)
  document.querySelectorAll("[data-cloze]").forEach((block) => {
    const btnCheck = block.querySelector("[data-check]");
    const btnReveal = block.querySelector("[data-reveal]");
    const feedback = block.querySelector(".cloze-feedback");
    const inputs = [...block.querySelectorAll("input.blank")];
    let answers = [];
    try {
      answers = JSON.parse(block.getAttribute("data-cloze") || "[]");
    } catch (_) {
      answers = [];
    }

    function norm(s) {
      return String(s || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
    }

    if (btnCheck) {
      btnCheck.addEventListener("click", () => {
        let ok = true;
        inputs.forEach((inp, i) => {
          const accepted = answers[i];
          const list = Array.isArray(accepted) ? accepted : [accepted];
          const good = list.some((a) => norm(inp.value) === norm(a));
          inp.style.borderBottomColor = good ? "#166534" : "#991b1b";
          if (!good) ok = false;
        });
        if (feedback) {
          feedback.classList.add("show");
          feedback.classList.toggle("ok", ok);
          feedback.classList.toggle("bad", !ok);
          feedback.textContent = ok
            ? "OK — bonnes réponses."
            : "Pas tout à fait — réessaie ou révèle.";
        }
      });
    }

    if (btnReveal) {
      btnReveal.addEventListener("click", () => {
        inputs.forEach((inp, i) => {
          const accepted = answers[i];
          const list = Array.isArray(accepted) ? accepted : [accepted];
          inp.value = list[0] || "";
          inp.style.borderBottomColor = "#0f3d3e";
        });
        if (feedback) {
          feedback.classList.add("show", "ok");
          feedback.classList.remove("bad");
          feedback.textContent = "Réponses révélées.";
        }
      });
    }
  });

  document.querySelectorAll(".flash-card").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("flipped"));
  });

  // Schémas : zoom lightbox
  (function schemaZoom() {
    let box = document.querySelector(".schema-lightbox");
    if (!box) {
      box = document.createElement("div");
      box.className = "schema-lightbox";
      box.innerHTML = '<img alt="" />';
      document.body.appendChild(box);
    }
    const img = box.querySelector("img");

    document.querySelectorAll(".schema").forEach((fig) => {
      const pic = fig.querySelector("img");
      if (!pic) return;

      let stage = fig.querySelector(".schema-stage");
      if (!stage) {
        stage = document.createElement("div");
        stage.className = "schema-stage";
        pic.replaceWith(stage);
        stage.appendChild(pic);
      }

      if (!fig.querySelector(".schema-bar")) {
        const bar = document.createElement("div");
        bar.className = "schema-bar";
        bar.innerHTML =
          '<span class="hint">Appuie sur le schéma pour agrandir</span>' +
          '<button type="button" class="btn-mini secondary" data-zoom>Agrandir</button>';
        fig.appendChild(bar);
      }

      function openZoom() {
        img.src = pic.currentSrc || pic.src;
        img.alt = pic.alt || "";
        box.classList.add("open");
      }

      const zoomBtn = fig.querySelector("[data-zoom]");
      if (zoomBtn) {
        zoomBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          openZoom();
        });
      }
      pic.addEventListener("click", openZoom);
      pic.style.cursor = "zoom-in";
    });

    box.addEventListener("click", () => box.classList.remove("open"));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") box.classList.remove("open");
    });
  })();

  // Texte à trous par étiquettes : tap (mobile) + drag (desktop)
  (function labelQuizzes() {
    function norm(s) {
      return String(s || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/['’`]/g, "")
        .replace(/\s+/g, " ");
    }

    document.querySelectorAll(".label-quiz").forEach((quiz) => {
      let answers = [];
      try {
        answers = JSON.parse(quiz.getAttribute("data-labels") || "[]");
      } catch (_) {
        answers = [];
      }
      const bank = quiz.querySelector(".label-bank");
      const slots = [...quiz.querySelectorAll(".slot, .label-slot")];
      const feedback = quiz.querySelector(".cloze-feedback");
      const btnCheck = quiz.querySelector("[data-check]");
      const btnReveal = quiz.querySelector("[data-reveal]");
      const btnReset = quiz.querySelector("[data-reset]");
      let selected = null;

      if (!quiz.querySelector(".label-quiz-hint") && bank) {
        const hint = document.createElement("p");
        hint.className = "label-quiz-hint";
        hint.textContent = "Tape une pastille, puis un trou (ou glisse).";
        quiz.insertBefore(hint, quiz.firstChild);
      }

      function slotDrop(slot) {
        return slot.matches(".drop") ? slot : slot.querySelector(".drop");
      }

      function setPicking(on) {
        quiz.classList.toggle("is-picking", !!on);
      }

      function clearSlot(slot) {
        const drop = slotDrop(slot);
        const chipId = drop && drop.dataset.chip;
        if (chipId && bank) {
          const chip = bank.querySelector('[data-id="' + chipId + '"]');
          if (chip) chip.classList.remove("placed");
        }
        if (drop) {
          drop.textContent = "";
          delete drop.dataset.chip;
          delete drop.dataset.value;
        }
        slot.classList.remove("filled", "ok", "bad");
      }

      function placeInSlot(slot, chip) {
        if (!slot || !chip) return;
        const drop = slotDrop(slot);
        if (!drop) return;
        if (drop.dataset.chip) clearSlot(slot);
        slots.forEach((s) => {
          const d = slotDrop(s);
          if (d && d.dataset.chip === chip.dataset.id) clearSlot(s);
        });
        drop.textContent = chip.textContent;
        drop.dataset.chip = chip.dataset.id;
        drop.dataset.value = chip.dataset.value || chip.textContent;
        chip.classList.add("placed");
        chip.classList.remove("selected");
        slot.classList.add("filled");
        slot.classList.remove("ok", "bad");
        selected = null;
        setPicking(false);
      }

      if (bank) {
        [...bank.querySelectorAll(".label-chip")].forEach((chip, i) => {
          if (!chip.dataset.id) chip.dataset.id = "c" + i;
          if (!chip.dataset.value) chip.dataset.value = chip.textContent.trim();
          chip.draggable = true;
          chip.addEventListener("click", () => {
            if (chip.classList.contains("placed")) return;
            if (selected === chip) {
              chip.classList.remove("selected");
              selected = null;
              setPicking(false);
              return;
            }
            bank.querySelectorAll(".label-chip").forEach((c) => c.classList.remove("selected"));
            chip.classList.add("selected");
            selected = chip;
            setPicking(true);
          });
          chip.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", chip.dataset.id);
            selected = chip;
            setPicking(true);
          });
          chip.addEventListener("dragend", () => setPicking(!!selected));
        });
      }

      slots.forEach((slot) => {
        slot.addEventListener("click", () => {
          const drop = slotDrop(slot);
          if (selected) placeInSlot(slot, selected);
          else if (drop && drop.dataset.chip) clearSlot(slot);
        });
        slot.addEventListener("dragover", (e) => e.preventDefault());
        slot.addEventListener("drop", (e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData("text/plain");
          const chip = bank && bank.querySelector('[data-id="' + id + '"]');
          if (chip) placeInSlot(slot, chip);
        });
      });

      if (btnCheck) {
        btnCheck.addEventListener("click", () => {
          let ok = true;
          slots.forEach((slot, i) => {
            const drop = slotDrop(slot);
            const val = drop && drop.dataset.value;
            const accepted = answers[i];
            const list = Array.isArray(accepted) ? accepted : [accepted];
            const good = list.some((a) => norm(val) === norm(a));
            slot.classList.toggle("ok", good);
            slot.classList.toggle("bad", !good);
            if (!good) ok = false;
          });
          if (feedback) {
            feedback.classList.add("show");
            feedback.classList.toggle("ok", ok);
            feedback.classList.toggle("bad", !ok);
            feedback.textContent = ok
              ? "OK — mots bien placés."
              : "Pas tout à fait — réessaie ou révèle.";
          }
        });
      }

      if (btnReveal) {
        btnReveal.addEventListener("click", () => {
          slots.forEach((slot, i) => {
            clearSlot(slot);
            const accepted = answers[i];
            const list = Array.isArray(accepted) ? accepted : [accepted];
            const want = list[0];
            const chip =
              bank &&
              [...bank.querySelectorAll(".label-chip")].find(
                (c) => !c.classList.contains("placed") && list.some((a) => norm(c.dataset.value) === norm(a))
              );
            if (chip) placeInSlot(slot, chip);
            else {
              const drop = slotDrop(slot);
              if (drop) {
                drop.textContent = want;
                drop.dataset.value = want;
                slot.classList.add("filled", "ok");
              }
            }
            slot.classList.add("ok");
            slot.classList.remove("bad");
          });
          if (feedback) {
            feedback.classList.add("show", "ok");
            feedback.classList.remove("bad");
            feedback.textContent = "Mots révélés.";
          }
        });
      }

      if (btnReset) {
        btnReset.addEventListener("click", () => {
          slots.forEach(clearSlot);
          if (bank) bank.querySelectorAll(".label-chip").forEach((c) => c.classList.remove("placed", "selected"));
          selected = null;
          setPicking(false);
          if (feedback) {
            feedback.classList.remove("show", "ok", "bad");
            feedback.textContent = "";
          }
        });
      }
    });
  })();

  // Mode Lecture : texte complet (trous + légendes révélés)
  if (btnLecture) {
    btnLecture.addEventListener("click", () => {
      const on = !body.classList.contains("lecture-on");
      body.classList.toggle("lecture-on", on);
      btnLecture.textContent = on ? "Lecture ON" : "Lecture";
      btnLecture.setAttribute("aria-pressed", on ? "true" : "false");
      document.querySelectorAll(".label-quiz").forEach((quiz) => {
        const btn = quiz.querySelector(on ? "[data-reveal]" : "[data-reset]");
        if (btn) btn.click();
      });
    });
  }

  // Suivi activité : ouverture de fiche (chXX.html)
  (function trackFicheOpen() {
    const m = (location.pathname || "").match(/ch(\d{2})\.html/i);
    if (!m) return;
    const ch = m[1];
    function go() {
      if (window.PASS_PLANNING && window.PASS_PLANNING.recordFicheOpen) {
        window.PASS_PLANNING.recordFicheOpen(ch);
      }
    }
    if (window.PASS_PLANNING) go();
    else {
      const s = document.createElement("script");
      s.src = "../../js/planning-store.js?v=1";
      s.onload = go;
      document.head.appendChild(s);
    }
  })();
})();
