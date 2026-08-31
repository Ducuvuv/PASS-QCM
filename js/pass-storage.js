/* Stockage local — cache mémoire + localStorage + IndexedDB (survit fermeture onglet) */
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

  const mem = Object.create(null);
  const memAt = Object.create(null);
  let dbPromise = null;
  let readyPromise = null;
  let pendingFlushes = [];

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

  function idbGetEntry(key) {
    return openDb().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        try {
          const tx = db.transaction(DB_STORE, "readonly");
          const req = tx.objectStore(DB_STORE).get(key);
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

  function idbPutEntry(key, raw, at) {
    const job = openDb().then(function (db) {
      if (!db) return;
      return new Promise(function (resolve) {
        try {
          const tx = db.transaction(DB_STORE, "readwrite");
          tx.objectStore(DB_STORE).put({ raw: raw, at: at || Date.now() }, key);
          tx.oncomplete = function () {
            resolve();
          };
          tx.onerror = function () {
            resolve();
          };
        } catch (_) {
          resolve();
        }
      });
    });
    pendingFlushes.push(job);
    job.finally(function () {
      pendingFlushes = pendingFlushes.filter(function (p) {
        return p !== job;
      });
    });
    return job;
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

  function readLsRaw(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function writeLsRaw(key, raw) {
    try {
      localStorage.setItem(key, raw);
      return true;
    } catch (_) {
      return false;
    }
  }

  function parseRaw(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function adopt(key, raw, at) {
    if (!raw) return;
    const parsed = parseRaw(raw);
    if (parsed === null) return;
    const prevAt = memAt[key] || 0;
    if (at && at < prevAt) return;
    mem[key] = parsed;
    memAt[key] = at || Date.now();
    writeLsRaw(key, raw);
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
    const at = Date.now();
    mem[key] = obj;
    memAt[key] = at;
    const lsOk = writeLsRaw(key, raw);
    if (raw.length < 3500) {
      setCookie(COOKIE_PREFIX + key, raw, 60 * 60 * 24 * 30);
    }
    idbPutEntry(key, raw, at);
    ping({ key: key, lsOk: lsOk, bytes: raw.length });
    return lsOk;
  }

  function getJSON(key) {
    if (mem[key] !== undefined) return mem[key];
    const ls = readLsRaw(key);
    if (ls) {
      const parsed = parseRaw(ls);
      if (parsed !== null) {
        mem[key] = parsed;
        memAt[key] = memAt[key] || 0;
        return parsed;
      }
    }
    try {
      const ck = getCookie(COOKIE_PREFIX + key);
      if (ck) {
        const parsed = parseRaw(ck);
        if (parsed !== null) {
          mem[key] = parsed;
          memAt[key] = Date.now();
          writeLsRaw(key, ck);
          idbPutEntry(key, ck, memAt[key]);
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  }

  function remove(key) {
    delete mem[key];
    delete memAt[key];
    try {
      localStorage.removeItem(key);
    } catch (_) {}
    setCookie(COOKIE_PREFIX + key, "", 0);
    idbRemove(key);
  }

  function hydrateKey(key) {
    const lsRaw = readLsRaw(key);
    const lsAt = lsRaw ? memAt[key] || 0 : 0;
    return idbGetEntry(key).then(function (entry) {
      if (!entry) {
        if (lsRaw) adopt(key, lsRaw, Date.now());
        return;
      }
      const idbRaw = typeof entry === "string" ? entry : entry.raw;
      const idbAt = typeof entry === "string" ? 0 : Number(entry.at) || 0;
      if (lsRaw && lsAt >= idbAt) {
        adopt(key, lsRaw, lsAt || Date.now());
        if (idbAt < lsAt) idbPutEntry(key, lsRaw, lsAt);
        return;
      }
      if (idbRaw) adopt(key, idbRaw, idbAt || Date.now());
    });
  }

  function hydrateFromIdb() {
    if (readyPromise) return readyPromise;
    readyPromise = Promise.all(MIRROR_KEYS.map(hydrateKey)).then(function () {
      ping({ hydrated: true });
    });
    return readyPromise;
  }

  function flush() {
    return Promise.all(pendingFlushes.slice());
  }

  function requestPersist() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        return navigator.storage.persist();
      }
    } catch (_) {}
    return Promise.resolve(false);
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

  function bindLifecycleFlush() {
    function onHide() {
      flush();
    }
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") onHide();
    });
  }

  ping();
  bindLifecycleFlush();
  hydrateFromIdb();
  requestPersist();

  global.PASS_STORAGE = {
    storageOk: storageOk,
    setJSON: setJSON,
    getJSON: getJSON,
    remove: remove,
    ping: ping,
    heartbeat: heartbeat,
    isStandalone: isStandalone,
    ready: hydrateFromIdb,
    flush: flush,
    requestPersist: requestPersist,
    diagnostic: diagnostic,
  };
})(window);
