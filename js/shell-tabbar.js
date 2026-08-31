/* Tab bar shell — icônes + labels, 1 seul endroit à maintenir */
(function () {
  const BADGE_CACHE_KEY = "pass-flash-due-badge-v1";

  const TABS = [
    {
      id: "home",
      href: "./index.html",
      label: "Accueil",
      icon: '<path d="M3.5 11 12 3.5 20.5 11"/><path d="M6 10.5V19.5h4.5v-5.5h3V19.5H18V10.5"/>',
    },
    {
      id: "matiere",
      href: "./matiere.html",
      label: "Mati\u00e8re",
      icon: '<path d="M5 4h6.5a1 1 0 0 1 1 1v14L8.5 17 4 19V5a1 1 0 0 1 1-1z"/><path d="M12.5 4H19a1 1 0 0 1 1 1v14l-4.5-2-3 1.2"/>',
    },
    {
      id: "qcm",
      href: "./entrainement.html",
      label: "QCM",
      icon: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 1.5"/>',
    },
    {
      id: "suivi",
      href: "./suivi.html",
      label: "Suivi",
      icon: '<path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M20 19H3"/>',
    },
    {
      id: "plus",
      href: "./plus.html",
      label: "Plus",
      icon: '<circle cx="6.5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="17.5" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
    },
  ];

  function todayKey() {
    const d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function cachedDueCount() {
    try {
      const raw = JSON.parse(localStorage.getItem(BADGE_CACHE_KEY));
      if (raw && raw.date === todayKey()) return Math.max(0, Number(raw.n) || 0);
    } catch (_) {}
    return 0;
  }

  function formatBadge(n) {
    if (n <= 0) return "";
    return n > 99 ? "99+" : String(n);
  }

  function paintPlusBadge(n) {
    const nav = document.querySelector("nav.tabbar");
    if (!nav) return;
    let plusLink = null;
    nav.querySelectorAll("a").forEach(function (a) {
      if ((a.getAttribute("href") || "").indexOf("plus.html") >= 0) plusLink = a;
    });
    if (!plusLink) return;
    let badge = plusLink.querySelector(".tab-badge");
    if (n <= 0) {
      if (badge) badge.remove();
      plusLink.classList.remove("has-badge");
      return;
    }
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "tab-badge";
      plusLink.appendChild(badge);
    }
    badge.textContent = formatBadge(n);
    badge.setAttribute("aria-label", n + " flashcards pour aujourd'hui");
    plusLink.classList.add("has-badge");
  }

  function currentId() {
    const forced = document.body.getAttribute("data-tab");
    if (forced) return forced;
    const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (path === "" || path === "index.html") return "home";
    if (path.indexOf("matiere") === 0) return "matiere";
    if (path.indexOf("entrainement") === 0 || path.indexOf("qcm") === 0) return "qcm";
    if (path.indexOf("suivi") === 0) return "suivi";
    if (
      path.indexOf("plus") === 0 ||
      path.indexOf("planning") === 0 ||
      path.indexOf("flash") === 0 ||
      path.indexOf("conseil") === 0 ||
      path.indexOf("competition") === 0
    ) {
      return "plus";
    }
    return "";
  }

  function scriptBase() {
    const cur = document.currentScript;
    if (cur && cur.src) {
      const u = new URL(cur.src, location.href);
      return u.href.replace(/\/js\/shell-tabbar\.js.*$/, "/");
    }
    return new URL("./", location.href).href;
  }

  function loadScript(base, file) {
    return new Promise(function (resolve) {
      if (file.indexOf("meta.js") >= 0 && window.PASS_FLASH_META) return resolve();
      if (file.indexOf("flash-srs") >= 0 && window.PASS_FLASH_SRS) return resolve();
      if (file.indexOf("flash-due-menu") >= 0 && window.PASS_FLASH_DUE_MENU) return resolve();
      const s = document.createElement("script");
      s.src = base + file;
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        resolve();
      };
      document.head.appendChild(s);
    });
  }

  function mount() {
    let nav = document.querySelector("nav.tabbar");
    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "tabbar";
      nav.setAttribute("aria-label", "Navigation");
      document.body.appendChild(nav);
    }
    document.body.classList.add("has-tabbar");
    const cur = currentId();
    nav.innerHTML =
      '<div class="tabbar-inner">' +
      TABS.map(function (t) {
        const on = t.id === cur;
        return (
          '<a href="' +
          t.href +
          '"' +
          (on ? ' aria-current="page"' : "") +
          ">" +
          '<svg class="tab-ico" viewBox="0 0 24 24" aria-hidden="true">' +
          t.icon +
          "</svg>" +
          "<span>" +
          t.label +
          "</span>" +
          "</a>"
        );
      }).join("") +
      "</div>";
  }

  function boot() {
    mount();
    if (window.PASS_FLASH_DUE_MENU && typeof PASS_FLASH_DUE_MENU.applyTabbarCached === "function") {
      PASS_FLASH_DUE_MENU.applyTabbarCached();
    } else {
      paintPlusBadge(cachedDueCount());
    }

    const base = scriptBase();
    Promise.resolve()
      .then(function () {
        return loadScript(base, "js/pass-storage.js?v=3");
      })
      .then(function () {
        return window.PASS_STORAGE && PASS_STORAGE.ready ? PASS_STORAGE.ready() : null;
      })
      .then(function () {
        return loadScript(base, "data/flash/meta.js?v=1");
      })
      .then(function () {
        return loadScript(base, "js/flash-srs.js?v=7");
      })
      .then(function () {
        return loadScript(base, "js/flash-due-menu.js?v=3");
      })
      .then(function () {
        if (window.PASS_FLASH_DUE_MENU) PASS_FLASH_DUE_MENU.apply();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
