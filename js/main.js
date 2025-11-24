import { addToQueue, watchNow, next, prev, initQueue, updateQueueUI, state, clearAllQueue, reorderQueue, playIndex } from './queue.js';
import { setLang, getLang, applyTranslations, t } from './translations.js';
import { extractId, extractPlaylistId } from './utils.js';
import { fetchPlaylistFeed } from './playlist_fetch.js';
import { playlistStore } from './playlists.js';

window.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('ytUrl');
  const errorMsg = document.getElementById('errorMsg');
  const resultWrap = document.getElementById('result');
  const iframeShell = document.getElementById('iframeShell');
  const queueList = document.getElementById('queueList');
  const queueEmpty = document.getElementById('queueEmpty');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const navControls = document.getElementById('navControls');
  // Removed external clearBtn; replaced by internal inputClearBtn
  const inputClearBtn = document.getElementById('inputClearBtn');
  const inputWrapper = document.querySelector('.input-wrapper');
  const watchBtn = document.getElementById('watchBtn');
  const queueBtn = document.getElementById('queueBtn');
  // Queue clear controls removed
  const openQueueBtn = document.getElementById('openQueueBtn');
  const queueOverlay = document.getElementById('queueOverlay');
  const queuePanel = document.querySelector('.queue-panel');
  const langSelect = document.getElementById('langSelect');
  // Playlist modal elements
  const playlistModalBackdrop = document.getElementById('playlistModalBackdrop');
  const playlistCloseBtn = document.getElementById('playlistCloseBtn');
  const playlistModalCount = document.getElementById('playlistModalCount');
  const playlistConfirmOk = document.getElementById('playlistConfirmOk');
  const playlistConfirmCancel = document.getElementById('playlistConfirmCancel');
  let pendingPlaylistData = null; // {pid, ids, title}
  let pendingDeletePid = null;    // playlist id pending deletion confirmation
  // Sidebar playlist custom select rendering
  const playlistSelect = document.getElementById('playlistSelect');
  const playlistSelectTrigger = document.getElementById('playlistSelectTrigger');
  const playlistOptions = document.getElementById('playlistOptions');
  const playlistCurrent = document.getElementById('playlistCurrent');

  function updatePlaylistCurrent(){
    if(!playlistCurrent) return;
    const apid = playlistStore.queueView.activePlaylistId;
    const pl = apid === 'saved' ? { title: t('saved_playlist'), videos: playlistStore.saved.videos } : playlistStore.playlists.find(p => p.pid === apid);
    const count = pl ? (pl.videos?.length || 0) : 0;
    playlistCurrent.textContent = `${pl?.title || apid} (${count})`;
  }

  function renderPlaylistSelect(){
    if(!playlistOptions) return;
    playlistOptions.innerHTML = '';
    const frag = document.createDocumentFragment();
    // Saved option
    const savedActive = playlistStore.queueView.activePlaylistId === 'saved';
    const savedLi = document.createElement('li');
    savedLi.className = 'ps-option' + (savedActive ? ' active' : '') + (playlistStore.saved.videos.length ? '' : ' empty');
    savedLi.setAttribute('role','option');
    savedLi.dataset.pid = 'saved';
    const savedThumb = playlistStore.saved.videos[0]?.id ? `background-image:url('https://img.youtube.com/vi/${playlistStore.saved.videos[0].id}/mqdefault.jpg')` : '';
    savedLi.innerHTML = `<div class="thumb" style="${savedThumb}"></div><div class="title">${t('saved_playlist')}</div><div class="count">${playlistStore.saved.videos.length}</div>`;
    savedLi.addEventListener('click', () => activateAndLoad('saved'));
    frag.appendChild(savedLi);
    // Imported playlists
    playlistStore.playlists.forEach(pl => {
      const active = playlistStore.queueView.activePlaylistId === pl.pid;
      const li = document.createElement('li');
      li.className = 'ps-option' + (active ? ' active' : '') + (pl.videos.length ? '' : ' empty');
      li.setAttribute('role','option');
      li.dataset.pid = pl.pid;
      const thumb = pl.videos[0]?.id ? `background-image:url('https://img.youtube.com/vi/${pl.videos[0].id}/mqdefault.jpg')` : '';
      li.innerHTML = `<div class="thumb" style="${thumb}"></div><div class="title">${pl.title}</div><div class="count">${pl.videos.length}</div><div class="actions"></div>`;
      const actions = li.querySelector('.actions');
      const delBtn = document.createElement('button');
      delBtn.type='button'; delBtn.textContent='✕'; delBtn.className='delete'; delBtn.title='Delete playlist';
      delBtn.addEventListener('click', e => { e.stopPropagation(); openPlaylistDeleteModal(pl.pid); });
      actions.appendChild(delBtn);
      li.addEventListener('click', () => activateAndLoad(pl.pid));
      frag.appendChild(li);
    });
    playlistOptions.appendChild(frag);
    updatePlaylistCurrent();
  }

  function activateAndLoad(pid){
    playlistStore.activatePlaylist(pid);
    clearAllQueue();
    playlistStore.queueView.items.forEach(v => addToQueue(v.id));
    updateQueueUI();
    if(state.queue.length) playIndex(0);
    renderPlaylistSelect();
    updatePlaylistCurrent();
    closePlaylistDropdown();
  }

  function closePlaylistDropdown(){
    if(!playlistOptions || !playlistSelectTrigger) return;
    playlistOptions.hidden = true;
    playlistSelectTrigger.setAttribute('aria-expanded','false');
  }
  function togglePlaylistDropdown(){
    if(!playlistOptions || !playlistSelectTrigger) return;
    const open = playlistOptions.hidden === false;
    if(open){
      closePlaylistDropdown();
    } else {
      playlistOptions.hidden = false;
      playlistSelectTrigger.setAttribute('aria-expanded','true');
      renderPlaylistSelect();
      const first = playlistOptions.querySelector('.ps-option');
      first && first.focus();
    }
  }
  if(playlistSelectTrigger){
    playlistSelectTrigger.addEventListener('click', togglePlaylistDropdown);
  }
  document.addEventListener('click', e => {
    if(!playlistSelect) return;
    if(!playlistSelect.contains(e.target)) closePlaylistDropdown();
  });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closePlaylistDropdown(); });

  function setError(msg){ if(errorMsg) errorMsg.textContent = msg; }
  function clearError(){ setError(''); }

  // Playlist modal helpers (restored)
  function openPlaylistModal(){
    if(playlistModalBackdrop){
      playlistModalBackdrop.hidden = false;
      playlistConfirmOk && playlistConfirmOk.focus();
    }
  }
  function closePlaylistModal(){
    if(playlistModalBackdrop){ playlistModalBackdrop.hidden = true; }
    pendingPlaylistData = null;
  }
  if(playlistConfirmCancel){
    playlistConfirmCancel.addEventListener('click', () => {
      closePlaylistModal();
    });
  }
  if(playlistCloseBtn){
    playlistCloseBtn.addEventListener('click', () => {
      closePlaylistModal();
    });
  }
  if(playlistModalBackdrop){
    playlistModalBackdrop.addEventListener('click', e => { if(e.target === playlistModalBackdrop) closePlaylistModal(); });
  }
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && playlistModalBackdrop && !playlistModalBackdrop.hidden){
      closePlaylistModal();
    }
  });
  if(playlistConfirmOk){
    playlistConfirmOk.addEventListener('click', () => {
      if(!pendingPlaylistData) { closePlaylistModal(); return; }
      const { pid, ids, title } = pendingPlaylistData;
      const existing = playlistStore.playlists.find(p => p.pid === pid);
      let pl = existing;
      if(!existing){
        pl = playlistStore.createImportedPlaylist(pid, title || pid, ids);
      } else if(title && existing.title === existing.pid) {
        // Update previously imported playlist that used pid as title
        existing.title = title;
        playlistStore.persist();
      }
      if(pl){
        activateAndLoad(pid);
        setError(t('playlist_added_count').replace('{n}', String(ids.length)));
      } else {
        setError(t('playlist_fetch_error'));
      }
      closePlaylistModal();
      urlInput.value = '';
      updateInputClear();
      updateWatchDisable();
      urlInput.focus();
    });
  }

  // Playlist delete confirmation modal elements
  const playlistDeleteModalBackdrop = document.getElementById('playlistDeleteModalBackdrop');
  const playlistDeleteCloseBtn = document.getElementById('playlistDeleteCloseBtn');
  const playlistDeleteConfirmOk = document.getElementById('playlistDeleteConfirmOk');
  const playlistDeleteConfirmCancel = document.getElementById('playlistDeleteConfirmCancel');

  function openPlaylistDeleteModal(pid){
    pendingDeletePid = pid;
    if(playlistDeleteModalBackdrop){
      playlistDeleteModalBackdrop.hidden = false;
      playlistDeleteConfirmOk && playlistDeleteConfirmOk.focus();
    }
  }
  function closePlaylistDeleteModal(){
    if(playlistDeleteModalBackdrop){ playlistDeleteModalBackdrop.hidden = true; }
    pendingDeletePid = null;
  }
  if(playlistDeleteConfirmCancel){
    playlistDeleteConfirmCancel.addEventListener('click', () => closePlaylistDeleteModal());
  }
  if(playlistDeleteCloseBtn){
    playlistDeleteCloseBtn.addEventListener('click', () => closePlaylistDeleteModal());
  }
  if(playlistDeleteModalBackdrop){
    playlistDeleteModalBackdrop.addEventListener('click', e => { if(e.target === playlistDeleteModalBackdrop) closePlaylistDeleteModal(); });
  }
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && playlistDeleteModalBackdrop && !playlistDeleteModalBackdrop.hidden) closePlaylistDeleteModal(); });
  if(playlistDeleteConfirmOk){
    playlistDeleteConfirmOk.addEventListener('click', () => {
      if(!pendingDeletePid){ closePlaylistDeleteModal(); return; }
      playlistStore.removeImportedPlaylist(pendingDeletePid);
      renderPlaylistSelect();
      updatePlaylistCurrent();
      if(playlistStore.queueView.activePlaylistId === 'saved'){
        activateAndLoad('saved');
      }
      closePlaylistDeleteModal();
    });
  }

  if(watchBtn) watchBtn.addEventListener('click', () => {
    const raw = urlInput.value.trim();
    if(!raw){ setError(t('error_enter_url')); return; }
    const pid = extractPlaylistId(raw);
    if(pid){
      setError(t('playlist_loading'));
      fetchPlaylistFeed(pid)
        .then(data => {
          if(!data.ids.length){ setError(t('playlist_empty')); return; }
          pendingPlaylistData = { pid, ids: data.ids, title: (data.title || pid) };
          if(playlistModalCount){ playlistModalCount.textContent = t('playlist_confirm_count').replace('{n}', String(data.ids.length)); }
          openPlaylistModal();
          clearError();
        })
        .catch(()=> setError(t('playlist_fetch_error')));
      return;
    }
    const id = extractId(raw);
    if(!id){ setError(t('error_extract')); return; }
    const existingIdx = state.queue.findIndex(v => v.id === id);
    if(existingIdx === -1){
      const ok = addToQueue(raw);
      if(ok){
        reorderQueue(state.queue.length - 1, 0);
        playIndex(0);
      }
    } else {
      if(existingIdx !== 0){
        reorderQueue(existingIdx, 0);
      }
      playIndex(0);
    }
    urlInput.value = '';
    clearError();
    updateInputClear();
    urlInput.focus();
  });
  if(queueBtn) queueBtn.addEventListener('click', async () => {
    const raw = urlInput.value.trim();
    if(!raw){ setError(t('error_enter_url')); return; }
    const pid = extractPlaylistId(raw);
    if(pid){
      setError(t('playlist_loading'));
      try {
        const data = await fetchPlaylistFeed(pid);
        if(!data.ids.length){ setError(t('playlist_empty')); return; }
        pendingPlaylistData = { pid, ids: data.ids, title: (data.title || pid) };
        if(playlistModalCount){ playlistModalCount.textContent = t('playlist_confirm_count').replace('{n}', String(data.ids.length)); }
        openPlaylistModal();
        clearError();
        return;
      } catch(e){ setError(t('playlist_fetch_error')); return; }
    }
    // Save single video to Saved playlist
    const vid = extractId(raw);
    if(!vid){ setError(t('error_extract')); return; }
    const already = playlistStore.saved.videos.some(v => v.id === vid);
    if(already){ setError(t('already_saved')); return; }
    playlistStore.addToSaved({ id: vid, original: raw });
    // If currently viewing Saved playlist, refresh queue to reflect new video
    if(playlistStore.queueView.activePlaylistId === 'saved'){
      // Preserve current video if playing
      const currentId = state.queue[state.currentIndex]?.id;
      activateAndLoad('saved');
      if(currentId){
        const idx = state.queue.findIndex(v => v.id === currentId);
        if(idx >= 0) playIndex(idx);
      }
    }
    setError(t('video_saved'));
    urlInput.value = '';
    updateInputClear();
    urlInput.focus();
  });
    function updateWatchDisable(){
      const raw = urlInput.value.trim();
      const isPl = !!extractPlaylistId(raw);
      if(watchBtn){
        if(isPl){
          watchBtn.textContent = t('import_playlist_play');
          watchBtn.dataset.i18n = 'import_playlist_play';
          watchBtn.disabled = false;
          watchBtn.classList.remove('disabled');
        } else {
          watchBtn.textContent = t('watch_now');
          watchBtn.dataset.i18n = 'watch_now';
        }
        watchBtn.setAttribute('aria-label', watchBtn.textContent);
      }
      if(queueBtn){
        if(isPl){
          queueBtn.textContent = t('import_playlist');
          queueBtn.dataset.i18n = 'import_playlist';
        } else {
          queueBtn.textContent = t('save_video');
          queueBtn.dataset.i18n = 'save_video';
        }
        queueBtn.setAttribute('aria-label', queueBtn.textContent);
      }
    }
    urlInput.addEventListener('input', updateWatchDisable);
  if(prevBtn) prevBtn.addEventListener('click', prev);
  if(nextBtn) nextBtn.addEventListener('click', next);
  function updateInputClear(){
    if(!inputWrapper) return;
    inputWrapper.classList.toggle('empty', !urlInput.value);
  }
  urlInput.addEventListener('input', updateInputClear);
  if(inputClearBtn) inputClearBtn.addEventListener('click', () => {
    urlInput.value = '';
    updateInputClear();
    clearError();
    urlInput.focus();
  });
  updateInputClear();

  // Queue clear modal logic removed

  function openQueue(){
    if(!queuePanel) return;
    queuePanel.classList.add('open');
    if(queueOverlay) queueOverlay.hidden = false;
    if(openQueueBtn){
      openQueueBtn.setAttribute('aria-label', t('close_queue'));
      const qc = document.getElementById('queueCount');
      if(qc){
        openQueueBtn.innerHTML = `${t('close_queue')} <span id="queueCount" class="queue-count">${qc.textContent}</span>`;
      } else {
        openQueueBtn.textContent = t('close_queue');
      }
    }
  }
  function closeQueue(){
    if(!queuePanel) return;
    queuePanel.classList.remove('open');
    if(queueOverlay) queueOverlay.hidden = true;
    if(openQueueBtn){
      openQueueBtn.setAttribute('aria-label', t('open_queue'));
      const qc = document.getElementById('queueCount');
      if(qc){
        openQueueBtn.innerHTML = `${t('open_queue')} <span id="queueCount" class="queue-count">${qc.textContent}</span>`;
      } else {
        openQueueBtn.textContent = t('open_queue');
      }
    }
  }
  function toggleQueue(){
    if(queuePanel && queuePanel.classList.contains('open')) closeQueue(); else openQueue();
  }
  if(openQueueBtn) openQueueBtn.addEventListener('click', toggleQueue);
  if(queueOverlay) queueOverlay.addEventListener('click', closeQueue);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeQueue(); });
  // Close queue automatically when switching to large viewport
  const mq = window.matchMedia('(min-width: 901px)');
  mq.addEventListener('change', ev => { if(ev.matches) closeQueue(); });

  // Avoid forcing focus on mobile which may trigger zoom
  if(window.matchMedia('(pointer: fine)').matches) {
    urlInput.focus();
  }
  initQueue({ errorMsg, resultWrap, iframeShell, queueList, queueEmpty, navControls });
  renderPlaylistSelect();
  updatePlaylistCurrent();
  updateWatchDisable();

  // Force English and disable dynamic language switching
  if(langSelect){ langSelect.value = 'en'; }
  setLang('en');
  // Remove applyTranslations reactivity after initial set to keep static English UI
});
