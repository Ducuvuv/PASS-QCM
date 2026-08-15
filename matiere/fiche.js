/* Chrono + focus + cloze + flashcards (local, no server) */
(function () {
  const body = document.body;
  const chronoEl = document.getElementById("chrono");
  const btnFocus = document.getElementById("btn-focus");
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

  if (btnFocus) {
    btnFocus.addEventListener("click", () => {
      body.classList.toggle("focus-on");
      const on = body.classList.contains("focus-on");
      btnFocus.textContent = on ? "Focus ON" : "Focus";
      btnFocus.setAttribute("aria-pressed", on ? "true" : "false");
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
})();
