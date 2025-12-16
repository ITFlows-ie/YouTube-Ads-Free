// player.js - YouTube IFrame API integration with progress persistence
// Stores progress in localStorage key 'ytProgress' as { videoId: seconds }

let apiReady = false;
let apiPromise = null;
let currentPlayer = null;
let progressTimer = null;
const STORAGE_KEY = 'ytProgress';
const HISTORY_KEY = 'ytHistory';
const SAVE_INTERVAL = 5000; // ms
const RESUME_THRESHOLD = 8; // seconds minimum to resume

function loadAPI() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise(resolve => {
    if (window.YT && window.YT.Player) { apiReady = true; return resolve(); }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => { apiReady = true; resolve(); };
  });
  return apiPromise;
}

function readProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (e) { return {}; }
}
function writeProgress(map) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)); } catch (e) { }
}
function readHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || {}; } catch (e) { return {}; }
}
function writeHistory(map) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(map)); } catch (e) { }
}
export function getSavedProgress(id) {
  const map = readProgress();
  const val = map[id];
  if (typeof val !== 'number') return 0;
  return val;
}
export function getHistoryEntry(id) {
  const map = readHistory();
  const val = map[id];
  return val || null;
}
export function getHistorySnapshot() {
  return readHistory();
}
function saveVideoProgress(id, seconds) {
  const map = readProgress();
  map[id] = Math.floor(seconds);
  writeProgress(map);
}
function saveHistory(id, seconds, duration) {
  const map = readHistory();
  map[id] = {
    p: Math.floor(seconds),
    d: duration && isFinite(duration) ? Math.floor(duration) : null,
    l: Date.now(),
  };
  writeHistory(map);
}
export function clearVideoProgress(id) {
  const map = readProgress();
  delete map[id];
  writeProgress(map);
  const hist = readHistory();
  delete hist[id];
  writeHistory(hist);
}

export async function playVideo(videoId, container) {
  await loadAPI();
  // Cleanup existing
  if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
  if (currentPlayer) { try { currentPlayer.destroy(); } catch (e) { } currentPlayer = null; }

  // Prepare container
  container.innerHTML = ''; // remove old iframe or contents
  const div = document.createElement('div');
  div.id = 'ytPlayerAPIContainer';
  container.appendChild(div);

  const resumeAt = getSavedProgress(videoId);

  currentPlayer = new window.YT.Player(div.id, {
    videoId,
    playerVars: {
      autoplay: 1,
      rel: 0,
      modestbranding: 1,
      playsinline: 1
    },
    events: {
      onReady: evt => {
        // Resume if progress exists and greater than threshold but not near end
        const dur = evt.target.getDuration();
        if (resumeAt >= RESUME_THRESHOLD && dur && resumeAt < dur - 10) {
          try { evt.target.seekTo(resumeAt, true); } catch (e) { }
        }
      },
      onStateChange: evt => {
        const state = evt.data;
       
        // Ended: reset progress
        if (state === window.YT.PlayerState.ENDED) {
          clearVideoProgress(videoId);
          try { window.dispatchEvent(new CustomEvent('videoEnded', { detail: { videoId } })); } catch (e) { }
        }
      }
    }
  });

  // Periodic progress save
  progressTimer = setInterval(() => {
    if (!currentPlayer || typeof currentPlayer.getCurrentTime !== 'function') return;
    const t = currentPlayer.getCurrentTime();
    const dur = typeof currentPlayer.getDuration === 'function' ? currentPlayer.getDuration() : null;
    if (isFinite(t) && t > 0) {
      saveVideoProgress(videoId, t);
      saveHistory(videoId, t, dur);
    }
  }, SAVE_INTERVAL);

  return currentPlayer;
}

export function getCurrentPlayer() { return currentPlayer; }
