// cast.js - Google Cast sender initialization
// This adds basic Cast context configuration. For YouTube embeds we cannot
// send a direct media URL (ToS + no direct stream). The launcher will typically
// offer tab mirroring or do nothing if no devices.

import { t } from './translations.js';

function setStatus(key){
  const el = document.getElementById('castStatus');
  if(el){ el.textContent = t(key); }
}

function initCast(){
  if(!window.cast || !window.cast.framework){ setStatus('cast_no_devices'); return; }
  const context = window.cast.framework.CastContext.getInstance();
  context.setOptions({
    receiverApplicationId: chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED
  });
  // Initial state
  updateCastState(context.getCastState());
  context.addEventListener(cast.framework.CastContextEventType.CAST_STATE_CHANGED, e => {
    updateCastState(e.castState);
  });
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
