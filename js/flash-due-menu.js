/* Badge menu — file du jour (style Anki, pas tout le deck) */
(function (global) {
  const BADGE_CACHE_KEY = "pass-flash-due-badge-v1";

  function todayKey() {
    var d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function writeBadgeCache(n) {
    try {
      localStorage.setItem(BADGE_CACHE_KEY, JSON.stringify({ date: todayKey(), n: Math.max(0, Number(n) || 0) }));
    } catch (_) {}
  }

  function readBadgeCache() {
    try {
      var raw = JSON.parse(localStorage.getItem(BADGE_CACHE_KEY));
      if (raw && raw.date === todayKey()) return Math.max(0, Number(raw.n) || 0);
    } catch (_) {}
    return 0;
  }

  function allIds() {
    var meta = global.PASS_FLASH_META;
    return meta && meta.ids ? meta.ids : [];
  }

  function todayStats() {
    var SRS = global.PASS_FLASH_SRS;
    if (!SRS || typeof SRS.todayStats !== "function") return { total: 0 };
    return SRS.todayStats(allIds());
  }

  function dueTodayCount() {
    return todayStats().total || 0;
  }

  function dueTodayDetail() {
    var SRS = global.PASS_FLASH_SRS;
    var stats = todayStats();
    if (!stats.total) return "Rien en retard";
    if (SRS && typeof SRS.formatTodayStats === "function") return SRS.formatTodayStats(stats);
    return stats.total + " aujourd'hui";
  }

  function formatBadge(n) {
    if (n <= 0) return "";
    return n > 99 ? "99+" : String(n);
  }

  function findPlusTab(nav) {
    if (!nav) return null;
    var links = nav.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href") || "";
      if (href.indexOf("plus.html") >= 0) return links[i];
    }
    return null;
  }

  function paintTabbar(n) {
    var plusLink = findPlusTab(document.querySelector("nav.tabbar"));
    if (!plusLink) return;
    var badge = plusLink.querySelector(".tab-badge");
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

  function applyTabbar() {
    var n = dueTodayCount();
    writeBadgeCache(n);
    paintTabbar(n);
  }

  function applyTabbarCached() {
    paintTabbar(readBadgeCache());
  }

  function applyPlusPage() {
    var stats = todayStats();
    var n = stats.total || 0;
    var row = document.getElementById("plus-flash-row");
    var banner = document.getElementById("plus-flash-banner");
    var sub = document.getElementById("plus-flash-sub");
    var detail = document.getElementById("plus-flash-detail");
    if (row) {
      row.href = n ? "./flashcards.html?mode=due" : "./flashcards.html";
      if (sub) sub.textContent = dueTodayDetail();
      row.classList.toggle("rubric-row--hot", n > 0);
      var ico = row.querySelector(".row-ico");
      if (ico) ico.classList.toggle("warn", n > 0);
    }
    if (detail && stats.newAvail > stats.newToday) {
      detail.textContent =
        stats.newAvail + " nouvelles restantes au deck · max " +
        (global.PASS_FLASH_SRS ? global.PASS_FLASH_SRS.NEW_DAILY_LIMIT : 20) + "/jour";
      detail.hidden = false;
    } else if (detail) {
      detail.hidden = true;
    }
    if (banner) {
      banner.hidden = n <= 0;
      if (n > 0) {
        var num = banner.querySelector("[data-flash-due-n]");
        if (num) num.textContent = String(n);
        var cap = banner.querySelector("[data-flash-due-cap]");
        if (cap) {
          cap.textContent = dueTodayDetail();
          cap.hidden = false;
        }
      }
    }
  }

  function applyHome() {
    var stats = todayStats();
    var n = stats.total || 0;
    var flashSub = document.getElementById("home-flash-sub");
    var flashRow = document.getElementById("home-flash-row");
    var reviewStat = document.getElementById("home-review");
    if (flashSub) flashSub.textContent = dueTodayDetail();
    if (flashRow) {
      flashRow.href = n ? "./flashcards.html?mode=due" : "./flashcards.html";
      flashRow.classList.toggle("rubric-row--hot", n > 0);
      var badge = flashRow.querySelector(".row-badge");
      if (badge) badge.classList.toggle("warn", n > 0);
      var panel = flashRow.closest(".rubric-panel");
      if (panel && n > 0 && flashRow !== panel.firstElementChild) {
        panel.insertBefore(flashRow, panel.firstElementChild);
      }
    }
    if (reviewStat && n > 0) reviewStat.textContent = String(n);
    var statsEl = document.getElementById("home-stats");
    if (statsEl && n > 0) statsEl.hidden = false;
  }

  function applyAll() {
    applyTabbar();
    applyPlusPage();
    applyHome();
  }

  global.PASS_FLASH_DUE_MENU = {
    todayStats: todayStats,
    dueTodayCount: dueTodayCount,
    dueTodayDetail: dueTodayDetail,
    apply: applyAll,
    applyTabbar: applyTabbar,
    applyTabbarCached: applyTabbarCached,
    applyPlusPage: applyPlusPage,
    applyHome: applyHome,
  };
})(window);
