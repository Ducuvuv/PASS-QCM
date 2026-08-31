/* Session flash en cours — localStorage + cookie miroir */
(function (global) {
  const KEY = "pass-flash-play-v1";
  const STORE = function () {
    return global.PASS_STORAGE;
  };

  function read() {
    const S = STORE();
    let raw = null;
    if (S) raw = S.getJSON(KEY);
    else {
      try {
        raw = JSON.parse(localStorage.getItem(KEY) || "null");
      } catch (_) {}
    }
    if (!raw || !raw.ids || !raw.ids.length) return null;
    return raw;
  }

  function write(payload) {
    if (!payload || !payload.ids || !payload.ids.length) return;
    const data = {
      ids: payload.ids,
      index: Math.max(0, Number(payload.index) || 0),
      stats: payload.stats || { again: 0, good: 0, easy: 0 },
      at: Date.now(),
    };
    const S = STORE();
    if (S) S.setJSON(KEY, data);
    else {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (_) {}
    }
  }

  function clear() {
    const S = STORE();
    if (S) S.remove(KEY);
    else {
      try {
        localStorage.removeItem(KEY);
      } catch (_) {}
    }
  }

  global.PASS_FLASH_SESSION = {
    KEY: KEY,
    read: read,
    write: write,
    clear: clear,
  };
})(window);
