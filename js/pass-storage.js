/* Stockage local robuste — localStorage + IndexedDB + cookie miroir (petites clés) */
(function (global) {
  const COOKIE_PREFIX = "passck_";
  const HEARTBEAT_KEY = "pass-storage-heartbeat-v1";
  const DB_NAME = "pass-qcm-v1";
  const DB_STORE = "kv";
  const MIRROR_KEYS = [
    "pass-flash-play-v1",
    "pass-fiche-progress-v1",
    "pass-flash-srs-v3",
    "pass-flash-new-day-v1",
    "pass-flash-due-badge-v1",
  ];

  let dbPromise = null;
  let readyPromise = null;

  function cookiePath() {
    const p = location.pathname || "/";
    const markers = ["/matiere/", "/js/", "/data/"];
    let cut = p.length;
    for (let i = 0; i < markers.length; i++) {
      const idx = p.indexOf(markers[i]);
      if (idx > 0) cut = Math.min(cut, idx + 1);
    }
    if (cut < p.length) return p.slice(0, cut);
    const last = p.lastIndexOf("/");
    return last > 0 ? p.slice(0, last + 1) : "/";
  }

  function setCookie(name, value, maxAgeSec) {
    try {
      document.cookie =
        name +
        "=" +
        encodeURIComponent(value) +
        "; path=" +
        cookiePath() +
        "; max-age=" +
        (maxAgeSec | 0) +
        "; SameSite=Lax" +
        (location.protocol === "https:" ? "; Secure" : "");
    } catch (_) {}
  }

  function getCookie(name) {
    try {
      const parts = ("; " + document.cookie).split("; " + name + "=");
      if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
    } catch (_) {}
    return null;
  }

  function storageOk() {
    try {
      const probe = "__pass_storage_probe__";
      localStorage.setItem(probe, "1");
      localStorage.removeItem(probe);
      return true;
    } catch (_) {
      return false;
    }
  }

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve) {
      if (!global.indexedDB) {
        resolve(null);
        return;
      }
      try {
        const req = global.indexedDB.open(DB_NAME, 1);
        req.onerror = function () {
          resolve(null);
        };
        req.onupgradeneeded = function (ev) {
          const db = ev.target.result;
          if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE);
        };
        req.onsuccess = function () {
          resolve(req.result);
        };
      } catch (_) {
        resolve(null);
      }
    });
    return dbPromise;
  }

  function idbGet(key) {
    return openDb().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        try {
          const tx = db.transaction(DB_STORE, "readonly");
          const store = tx.objectStore(DB_STORE);
          const req = store.get(key);
          req.onsuccess = function () {
            resolve(req.result || null);
          };
          req.onerror = function () {
            resolve(null);
          };
        } catch (_) {
          resolve(null);
        }
      });
    });
  }

  function idbSet(key, raw) {
    return openDb().then(function (db) {
      if (!db) return;
      try {
        const tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).put(raw, key);
      } catch (_) {}
    });
  }

  function idbRemove(key) {
    return openDb().then(function (db) {
      if (!db) return;
      try {
        const tx = db.transaction(DB_STORE, "readwrite");
        tx.objectStore(DB_STORE).delete(key);
      } catch (_) {}
    });
  }

  function ping(extra) {
    try {
      localStorage.setItem(
        HEARTBEAT_KEY,
        JSON.stringify(
          Object.assign(
            {
              at: Date.now(),
              ok: storageOk(),
              path: location.pathname,
              standalone: isStandalone(),
            },
            extra || {}
          )
        )
      );
    } catch (_) {}
  }

  function setJSON(key, obj) {
    const raw = JSON.stringify(obj);
    let lsOk = false;
    try {
      localStorage.setItem(key, raw);
      lsOk = true;
    } catch (_) {}
    if (raw.length < 3500) {
      setCookie(COOKIE_PREFIX + key, raw, 60 * 60 * 24 * 30);
    }
    idbSet(key, raw);
    ping({ key: key, lsOk: lsOk, bytes: raw.length });
    return lsOk;
  }

  function getJSON(key) {
    try {
      const ls = localStorage.getItem(key);
      if (ls) return JSON.parse(ls);
    } catch (_) {}
    try {
      const ck = getCookie(COOKIE_PREFIX + key);
      if (ck) {
        const parsed = JSON.parse(ck);
        try {
          localStorage.setItem(key, ck);
        } catch (_) {}
        idbSet(key, ck);
        return parsed;
      }
    } catch (_) {}
    return null;
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (_) {}
    setCookie(COOKIE_PREFIX + key, "", 0);
    idbRemove(key);
  }

  function hydrateFromIdb() {
    if (readyPromise) return readyPromise;
    readyPromise = openDb().then(function (db) {
      if (!db) return;
      const jobs = MIRROR_KEYS.map(function (key) {
        return idbGet(key).then(function (raw) {
          if (!raw || typeof raw !== "string") return;
          let lsMissing = false;
          try {
            lsMissing = !localStorage.getItem(key);
          } catch (_) {
            lsMissing = true;
          }
          if (lsMissing) {
            try {
              localStorage.setItem(key, raw);
            } catch (_) {}
          }
        });
      });
      return Promise.all(jobs);
    });
    return readyPromise;
  }

  function heartbeat() {
    try {
      return JSON.parse(localStorage.getItem(HEARTBEAT_KEY) || "null");
    } catch (_) {
      return null;
    }
  }

  function isStandalone() {
    return (
      !!global.navigator.standalone ||
      (global.matchMedia && global.matchMedia("(display-mode: standalone)").matches)
    );
  }

  function diagnostic() {
    var srsN = 0;
    try {
      var srs = getJSON("pass-flash-srs-v3");
      if (srs) srsN = Object.keys(srs).length;
    } catch (_) {}
    return {
      ok: storageOk(),
      standalone: isStandalone(),
      heartbeat: heartbeat(),
      flashSession: getJSON("pass-flash-play-v1"),
      ficheChapters: Object.keys(getJSON("pass-fiche-progress-v1") || {}).length,
      srsN: srsN,
    };
  }

  ping();
  hydrateFromIdb();

  global.PASS_STORAGE = {
    storageOk: storageOk,
    setJSON: setJSON,
    getJSON: getJSON,
    remove: remove,
    ping: ping,
    heartbeat: heartbeat,
    isStandalone: isStandalone,
    ready: hydrateFromIdb,
    diagnostic: diagnostic,
  };
})(window);
