// cast.js - Google Cast sender initialization
// This adds basic Cast context configuration. For YouTube embeds we cannot
// send a direct media URL (ToS + no direct stream). The launcher will typically
// offer tab mirroring or do nothing if no devices.

import { t } from './translations.js';
import { getCurrentPlayer } from './player.js';

function setStatus(key){
  const el = document.getElementById('castStatus');
  if(el){ el.textContent = t(key); }
}

let lastVideoId = null;
let lastSentVideoId = null;
let sending = false;
let retryCount = 0;
const MAX_RETRIES = 3;
let lastProgressTimeSent = 0;

function initCast(){
  if(!window.cast || !window.cast.framework){ setStatus('cast_no_devices'); return; }
  const context = window.cast.framework.CastContext.getInstance();
  // Use YouTube receiver application to allow direct video casting
  context.setOptions({
    receiverApplicationId: '233637DE', // YouTube app ID
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED
  });
  updateCastState(context.getCastState());
  context.addEventListener(cast.framework.CastContextEventType.CAST_STATE_CHANGED, e => {
    updateCastState(e.castState);
    if(e.castState === cast.framework.CastState.CONNECTED){
      // Attempt to load current video if available
      if(lastVideoId){ sendYouTubeVideo(lastVideoId); }
    }
  });
  // Listen for video changes dispatched from queue.js
  window.addEventListener('videoChange', ev => {
    const vid = ev.detail?.videoId;
    if(vid){
      lastVideoId = vid;
      const castState = context.getCastState();
      if(castState === cast.framework.CastState.CONNECTED){
        sendYouTubeVideo(vid, getLocalTime());
      }
    }
  });
  window.addEventListener('videoReady', ev => {
    if(!ev.detail?.videoId) return;
    // If connected and video matches current lastVideoId but not yet sent, send with resume time
    if(ev.detail.videoId === lastVideoId && context.getCastState() === cast.framework.CastState.CONNECTED){
      sendYouTubeVideo(ev.detail.videoId, ev.detail.currentTime || 0);
    }
  });
  window.addEventListener('videoProgress', ev => {
    const vid = ev.detail?.videoId;
    if(!vid || vid !== lastVideoId) return;
    if(context.getCastState() !== cast.framework.CastState.CONNECTED) return;
    const now = Date.now();
    // Send a time update at most every 15s
    if(now - lastProgressTimeSent > 15000){
      lastProgressTimeSent = now;
      // Re-send flingVideo with updated currentTime (best-effort; some receivers may ignore)
      sendYouTubeVideo(vid, ev.detail.currentTime || 0, true);
    }
  });
}

function getLocalTime(){
  try {
    const p = getCurrentPlayer();
    if(p && typeof p.getCurrentTime === 'function'){
      const ct = p.getCurrentTime();
      return isFinite(ct) ? Math.floor(ct) : 0;
    }
  } catch{}
  return 0;
}

function sendYouTubeVideo(videoId, currentTime = 0, isProgress = false){
  if(!videoId) return;
  // Avoid duplicate initial sends (progress updates allowed)
  if(!isProgress && videoId === lastSentVideoId){ return; }
  try {
    const context = cast.framework.CastContext.getInstance();
    const session = context.getCurrentSession();
    if(!session){ return; }
    // YouTube MDx namespace message
    const namespace = 'urn:x-cast:com.google.youtube.mdx';
    const message = { type: 'flingVideo', data: { videoId, currentTime: currentTime || 0 } };
    sending = true;
    session.sendMessage(namespace, message, () => {
      sending = false;
      retryCount = 0;
      if(!isProgress){ lastSentVideoId = videoId; }
    }, err => {
      sending = false;
      console.warn('Cast send error', err);
      setStatus('cast_send_error');
      if(retryCount < MAX_RETRIES && !isProgress){
        retryCount++;
        setStatus('cast_retrying');
        setTimeout(() => {
          sendYouTubeVideo(videoId, currentTime);
        }, 800 * retryCount);
      }
    });
  } catch(e){ console.warn('Cast send exception', e); setStatus('cast_send_error'); }
}

function updateCastState(state){
  switch(state){
    case cast.framework.CastState.NO_DEVICES_AVAILABLE:
      setStatus('cast_no_devices'); break;
    case cast.framework.CastState.NOT_CONNECTED:
      setStatus('cast'); break;
    case cast.framework.CastState.CONNECTING:
      setStatus('cast_connecting'); break;
    case cast.framework.CastState.CONNECTED:
      setStatus('cast_connected'); break;
    default:
      setStatus('cast');
  }
}

window.__onGCastApiAvailable = function(isAvailable){
  if(isAvailable){
    initCast();
  } else {
    setStatus('cast_no_devices');
  }
};

// If script already loaded (rare timing) attempt init
if(window.cast?.framework){ initCast(); }
