// Client-side playlist fetch via hidden YouTube IFrame Player API (no server needed)
// Exports: fetchPlaylistFeed(pid) -> Promise<{ ids: string[], title: string, source: 'player' }>
// Strategy:
// 1. Ensure iframe API loaded.
// 2. Create hidden player with listType=playlist.
// 3. Mute + play to trigger playlist population.
// 4. Poll getPlaylist() until non-empty or timeout.
// 5. Extract title from getVideoData() once first item loads.
// 6. Clean up player.
// Notes:
// - Some playlists may not fully populate immediately; we take first full batch.
// - Large or region-restricted videos may not appear.
// - Returns empty ids on failure; caller decides UI message.

const playlistCache = new Map(); // pid -> { ids, title, timestamp }

export async function fetchPlaylistFeed(pid, options = {}) {
  const {
    force = false,
    maxWaitMs = 14000,          // extend default a bit
    ttlMs = 5 * 60 * 1000,      // 5 minutes cache TTL
    stablePolls = 3,            // number of consecutive polls with unchanged length required
    pollIntervalMs = 200,       // poll interval
    reloadAtFraction = 0.5      // fraction of maxWaitMs when to force a reload if still empty
  } = options;
  if (!pid || typeof pid !== 'string') return { ids: [], title: pid || '', source: 'player' };
  const cached = playlistCache.get(pid);
  if (cached && !force) {
    if (Date.now() - cached.timestamp < ttlMs) {
      return { ids: cached.ids.slice(), title: cached.title, source: 'cache' };
    }
  }
  await ensureYouTubeIframeAPI();
  return await loadViaHiddenPlayer({ pid, maxWaitMs, stablePolls, pollIntervalMs, reloadAtFraction });
}

function ensureYouTubeIframeAPI() {
  return new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) return resolve();
    const existing = document.getElementById('yt-iframe-api');
    if (existing) {
      waitForPlayer(resolve, reject);
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.id = 'yt-iframe-api';
    document.head.appendChild(tag);
    waitForPlayer(resolve, reject);
  });
}

function waitForPlayer(resolve, reject) {
  const start = Date.now();
  const interval = setInterval(() => {
    if (window.YT && window.YT.Player) {
      clearInterval(interval);
      resolve();
    } else if (Date.now() - start > 8000) {
      clearInterval(interval);
      reject(new Error('yt_api_timeout'));
    }
  }, 120);
}

function loadViaHiddenPlayer(cfg) {
  const { pid, maxWaitMs, stablePolls, pollIntervalMs, reloadAtFraction } = cfg;
  return new Promise((resolve) => {
    const containerId = 'playlistProbePlayer';
    let holder = document.getElementById(containerId);
    if (!holder) {
      holder = document.createElement('div');
      holder.id = containerId;
      holder.style.cssText = 'position:absolute;width:1px;height:1px;left:-9999px;top:-9999px;overflow:hidden;';
      document.body.appendChild(holder);
    }
    let finished = false;
    let player;
    let attemptedReload = false;
    let lastLength = 0;
    let stableCount = 0;
    function cleanupHolder() {
      // Remove holder to avoid accumulation
      try {
        if (holder && holder.parentNode) holder.parentNode.removeChild(holder);
      } catch {}
    }
    function done(ids, title) {
      if (finished) return;
      finished = true;
      try { player && player.pauseVideo && player.pauseVideo(); } catch {}
      try { player && player.destroy && player.destroy(); } catch {}
      cleanupHolder();
      const uniq = Array.from(new Set(ids.filter(Boolean)));
      const finalTitle = title || pid;
      playlistCache.set(pid, { ids: uniq, title: finalTitle, timestamp: Date.now() });
      resolve({ ids: uniq, title: finalTitle, source: 'player' });
    }

    function forceReload() {
      if (attemptedReload) return;
      attemptedReload = true;
      try {
        if (player && player.loadPlaylist) {
          player.loadPlaylist({ list: pid, listType: 'playlist' });
        } else if (player && player.cuePlaylist) {
          player.cuePlaylist({ list: pid });
        }
      } catch {}
    }

    try {
      player = new YT.Player(containerId, {
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          listType: 'playlist',
          list: pid,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: () => {
            try { player.mute && player.mute(); } catch {}
            try { player.playVideo && player.playVideo(); } catch {}
            startPolling();
          },
          onStateChange: () => { /* rely on polling with stabilization */ },
          onError: () => done([], pid)
        }
      });
    } catch (e) {
      done([], pid);
    }

    const startTime = Date.now();
    function startPolling() {
      const pollInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed > maxWaitMs) {
          clearInterval(pollInterval);
          done([], pid);
          return;
        }
        // Mid-time reload if still empty
        if (!attemptedReload && elapsed > maxWaitMs * reloadAtFraction && lastLength === 0) {
          forceReload();
        }
        let ids = [];
        try { ids = player.getPlaylist ? player.getPlaylist() || [] : []; } catch {}
        const len = ids.length;
        if (len > 0) {
          if (len > lastLength) {
            lastLength = len;
            stableCount = 0; // length grew; reset stability counter
          } else {
            stableCount++;
          }
          // finalize after required stable polls or near end
          if (stableCount >= stablePolls || (maxWaitMs - elapsed) < 600) {
            let title = '';
            try {
              const vd = player.getVideoData ? player.getVideoData() : null;
              if (vd && vd.title) title = vd.title + ' (playlist)';
            } catch {}
            clearInterval(pollInterval);
            done(ids, title);
            return;
          }
        }
      }, pollIntervalMs);
    }
  });
}

// Optional helper to clear cache externally
export function clearPlaylistCache(pid) {
  if (pid) playlistCache.delete(pid); else playlistCache.clear();
}
