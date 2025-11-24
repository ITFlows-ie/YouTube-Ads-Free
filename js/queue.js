import { buildEmbed, fetchMeta, extractId, escapeHtml } from './utils.js';
import { playVideo, getSavedProgress } from './player.js';
import { t } from './translations.js';
import { playlistStore } from './playlists.js';

export const state = {
  queue: [], // {id, original, loading, meta}
  currentIndex: -1,
  refs: {},
  storageKey: 'ytQueueData'
};

export function initQueue(refs){
  state.refs = refs;
  loadQueue();
  // Fetch metadata for loaded items
  state.queue.forEach(item => {
    if(!item.meta){
      item.loading = true;
      fetchMeta(item.id).then(meta => {
        item.loading = false; item.meta = meta; updateQueueUI();
      });
    }
  });
  updateQueueUI();
  // Auto play current if valid
  if(state.currentIndex >=0 && state.currentIndex < state.queue.length){
    playIndex(state.currentIndex);
  }
}

export function addToQueue(raw){
  const id = extractId(raw);
  if(!id){ setError(t('error_extract')); return false; }
  if(state.queue.some(i => i.id === id)){ setError(t('error_duplicate')); return false; }
  state.queue.push({id, original: raw.trim(), loading: true, meta: null});
  if(state.currentIndex === -1) state.currentIndex = 0;
  updateQueueUI();
  fetchMeta(id).then(meta => {
    const item = state.queue.find(q => q.id === id);
    if(item){ item.loading = false; item.meta = meta; updateQueueUI(); }
  });
  saveQueue();
  return true;
}

export function playIndex(idx){
  if(idx < 0 || idx >= state.queue.length) return;
  state.currentIndex = idx;
  clearError();
  const id = state.queue[idx].id;
  const embedSrc = buildEmbed(id);
  state.refs.resultWrap.hidden = false;
  state.refs.iframeShell.classList.add('loading');
  renderIframe(embedSrc);
  updateQueueUI();
  saveQueue();
  // Notify cast subsystem about video change
  try { window.dispatchEvent(new CustomEvent('videoChange', { detail: { videoId: id } })); } catch {}
}

export function watchNow(raw){
  const id = extractId(raw);
  if(!id){ setError(t('error_extract')); state.refs.resultWrap.hidden = true; return; }
  clearError();
  state.refs.resultWrap.hidden = false;
  state.refs.iframeShell.classList.add('loading');
  renderIframe(buildEmbed(id));
  try { window.dispatchEvent(new CustomEvent('videoChange', { detail: { videoId: id } })); } catch {}
}

export function next(){
  if(state.queue.length === 0) return;
  playIndex((state.currentIndex + 1) % state.queue.length);
}
export function prev(){
  if(state.queue.length === 0) return;
  playIndex((state.currentIndex - 1 + state.queue.length) % state.queue.length);
}

export function removeIndex(idx){
  if(idx < 0 || idx >= state.queue.length) return;
  state.queue.splice(idx,1);
  if(state.queue.length === 0){
    state.currentIndex = -1;
    state.refs.navControls.hidden = true;
    state.refs.resultWrap.hidden = true; // optionally keep last playing, choose policy
  } else if(idx === state.currentIndex){
    state.currentIndex = Math.min(idx, state.queue.length -1);
    playIndex(state.currentIndex);
  } else if(idx < state.currentIndex){
    state.currentIndex -= 1;
  }
  updateQueueUI();
  saveQueue();
}

export function reorderQueue(fromIdx, toIdx){
  if(fromIdx === toIdx) return;
  if(fromIdx < 0 || toIdx < 0 || fromIdx >= state.queue.length || toIdx >= state.queue.length) return;
  const [item] = state.queue.splice(fromIdx,1);
  state.queue.splice(toIdx,0,item);
  if(state.currentIndex === fromIdx){
    state.currentIndex = toIdx;
  } else if(fromIdx < state.currentIndex && toIdx >= state.currentIndex){
    state.currentIndex -= 1;
  } else if(fromIdx > state.currentIndex && toIdx <= state.currentIndex){
    state.currentIndex += 1;
  }
  updateQueueUI();
  saveQueue();
}

async function renderIframe(src){
  const shell = state.refs.iframeShell;
  shell.classList.add('loading');
  // Extract videoId from embed src (after last '/')
  let videoId = null;
  try {
    const parts = src.split('/');
    videoId = parts[parts.length - 1].split('?')[0];
  } catch(e){ /* ignore */ }
  if(!videoId){
    // fallback to previous iframe method if parsing failed
    shell.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.width = '560';
    iframe.height = '315';
    iframe.src = src;
    iframe.title = 'YouTube video player';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    iframe.addEventListener('load', () => shell.classList.remove('loading'));
    shell.appendChild(iframe);
    return;
  }
  try {
    await playVideo(videoId, shell);
    // Remove loading class once API player is ready (approximate)
    setTimeout(()=> shell.classList.remove('loading'), 600);
  } catch(e){
    shell.classList.remove('loading');
  }
}

function setError(msg){ state.refs.errorMsg.textContent = msg; }
function clearError(){ setError(''); }

export function updateQueueUI(){
  const { queueList, navControls, queueEmpty } = state.refs;
  queueList.innerHTML = '';
  if(state.queue.length === 0){
    queueEmpty.style.display = 'block';
    navControls.hidden = true;
    const qc = document.getElementById('queueCount');
    if(qc){ qc.textContent = '0'; }
    return;
  }
  queueEmpty.style.display = 'none';
  state.queue.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'queue-item' + (idx === state.currentIndex ? ' active' : '') + (item.loading ? ' loading' : '');
    li.dataset.index = idx;
    li.draggable = true;
    let title = item.meta?.title || (item.loading ? t('loading') : item.id);
    let thumb = item.meta?.thumb || `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`;
    li.innerHTML = `<span class="handle" aria-hidden="true">↕</span>
      <div class="thumb-wrap">${item.loading ? '' : `<img src="${thumb}" alt="Thumbnail">`}</div>
      <div class="meta"><div class="title">${escapeHtml(title)}</div><div class="orig">${escapeHtml(item.original)}</div></div>
      <span class="qid">#${idx+1}</span>
      <button type="button" class="del-btn" aria-label="${t('delete')}">✕</button>`;
    li.addEventListener('click', e => {
      if(e.target.closest('.del-btn')) return; // ignore click to delete button
      playIndex(idx);
    });
    li.querySelector('.del-btn').addEventListener('click', e => {
      e.stopPropagation();
      if(playlistStore.queueView.activePlaylistId === 'saved'){
        const removed = state.queue[idx];
        const wasActive = idx === state.currentIndex;
        const originalIndex = idx;
        const vid = removed?.id;
        if(!vid) return;
        // Perform removal
        playlistStore.removeFromSaved(vid);
        const currentId = state.queue[state.currentIndex]?.id;
        state.queue = playlistStore.saved.videos.map(v => ({id: v.id, original: v.original, loading: false, meta: null}));
        if(state.queue.length === 0){
          state.currentIndex = -1;
        } else if(currentId && state.queue.some(q => q.id === currentId)){
          state.currentIndex = state.queue.findIndex(q => q.id === currentId);
        } else {
          state.currentIndex = Math.min(state.currentIndex, state.queue.length - 1);
        }
        state.queue.forEach(item => {
          if(!item.meta){
            item.loading = true;
            fetchMeta(item.id).then(meta => { item.loading = false; item.meta = meta; updateQueueUI(); });
          }
        });
        updateQueueUI();
        saveQueue();
        // Show undo snackbar
        showUndoSnackbar(t('video_deleted'), () => {
          // Restore video in saved list
          const insertAt = Math.min(originalIndex, playlistStore.saved.videos.length);
          playlistStore.saved.videos.splice(insertAt,0,{ id: removed.id, original: removed.original });
          playlistStore.persist();
          // Rebuild queue from saved
          const prevPlayingId = wasActive ? removed.id : (state.queue[state.currentIndex]?.id);
          state.queue = playlistStore.saved.videos.map(v => ({id: v.id, original: v.original, loading: false, meta: null}));
          if(prevPlayingId){
            const newIdx = state.queue.findIndex(q => q.id === prevPlayingId);
            state.currentIndex = newIdx !== -1 ? newIdx : 0;
          } else if(state.queue.length){
            state.currentIndex = 0;
          }
          updateQueueUI();
          saveQueue();
        });
      } else {
        removeIndex(idx);
      }
    });
    // Drag events
    li.addEventListener('dragstart', e => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(idx));
      li.classList.add('dragging');
    });
    li.addEventListener('dragend', () => li.classList.remove('dragging'));
    li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('drag-over'); });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', e => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData('text/plain'));
      const to = idx;
      li.classList.remove('drag-over');
      reorderQueue(from, to);
    });
    queueList.appendChild(li);
  });
  // Show controls (including Cast/Fullscreen) as soon as at least one video exists
  navControls.hidden = state.queue.length === 0;
  const qc = document.getElementById('queueCount');
  if(qc){
    const prev = qc.textContent.trim();
    const next = String(state.queue.length);
    qc.textContent = next;
    if(prev !== next){
      qc.classList.remove('update');
      void qc.offsetWidth; // force reflow for animation restart
      qc.classList.add('update');
    }
  }
}

function saveQueue(){
  try {
    const data = {
      currentIndex: state.currentIndex,
      queue: state.queue.map(i => ({id: i.id, original: i.original}))
    };
    localStorage.setItem(state.storageKey, JSON.stringify(data));
  } catch(e){ /* ignore */ }
}

function loadQueue(){
  try {
    const raw = localStorage.getItem(state.storageKey);
    if(!raw) return;
    const data = JSON.parse(raw);
    if(!data || !Array.isArray(data.queue)) return;
    state.queue = data.queue.filter(it => it.id).map(it => ({id: it.id, original: it.original, loading: false, meta: null}));
    state.currentIndex = typeof data.currentIndex === 'number' ? data.currentIndex : -1;
  } catch(e){ /* ignore parse errors */ }
}

export function clearAllQueue(){
  state.queue = [];
  state.currentIndex = -1;
  updateQueueUI();
  try { localStorage.removeItem(state.storageKey); } catch(e){}
  if(state.refs.resultWrap){ state.refs.resultWrap.hidden = true; }
}

// Snackbar (Undo for Saved deletions)
let snackbarTimer = null;
function showUndoSnackbar(message, undoCb, timeoutMs = 6000){
  const el = document.getElementById('snackbar');
  if(!el) return;
  if(snackbarTimer){ clearTimeout(snackbarTimer); snackbarTimer = null; }
  el.innerHTML = '';
  const msgSpan = document.createElement('span');
  msgSpan.className = 'msg';
  msgSpan.textContent = message;
  const undoBtn = document.createElement('button');
  undoBtn.type = 'button';
  undoBtn.className = 'undo-btn';
  undoBtn.textContent = t('undo');
  undoBtn.addEventListener('click', () => {
    if(snackbarTimer){ clearTimeout(snackbarTimer); snackbarTimer = null; }
    hideSnackbar();
    try { undoCb && undoCb(); } catch {}
  });
  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.style.animationDuration = timeoutMs + 'ms';
  el.appendChild(msgSpan);
  el.appendChild(undoBtn);
  el.appendChild(bar);
  el.classList.add('show');
  snackbarTimer = setTimeout(()=>{ hideSnackbar(); }, timeoutMs);
}
function hideSnackbar(){
  const el = document.getElementById('snackbar');
  if(el){ el.classList.remove('show'); }
}
