/* Session flash en cours — localStorage (survit fermeture onglet / lien) */
(function (global) {
  const KEY = "pass-flash-play-v1";

  function read() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!raw || !raw.ids || !raw.ids.length) return null;
      return raw;
    } catch (_) {
      return null;
    }
  }

  function write(payload) {
    if (!payload || !payload.ids || !payload.ids.length) return;
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          ids: payload.ids,
          index: Math.max(0, Number(payload.index) || 0),
          stats: payload.stats || { again: 0, good: 0, easy: 0 },
          at: Date.now(),
        })
      );
    } catch (_) {}
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (_) {}
  }

  global.PASS_FLASH_SESSION = {
    KEY: KEY,
    read: read,
    write: write,
    clear: clear,
  };
})(window);
