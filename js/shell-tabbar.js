/* Tab bar shell — icônes + labels, 1 seul endroit à maintenir */
(function () {
  const TABS = [
    {
      id: "home",
      href: "./index.html",
      label: "Accueil",
      icon: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"/>',
    },
    {
      id: "matiere",
      href: "./matiere.html",
      label: "Matière",
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
