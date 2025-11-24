// Playlist data model and persistence
// saved: canonical store for individually added videos
// playlists: imported playlists kept separate
// queueView: active playlist selection and derived items for quick access

const STORAGE_KEY = 'ytPlaylistData';

function loadInitial(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    const data = JSON.parse(raw);
    if(!data || typeof data !== 'object') return null;
    if(!Array.isArray(data.saved)) data.saved = [];
    if(!Array.isArray(data.playlists)) data.playlists = [];
    if(!data.activePlaylistId) data.activePlaylistId = 'saved';
    return data;
  } catch(e){ return null; }
}

const initial = loadInitial();

export const playlistStore = {
  saved: { videos: (initial?.saved || []).filter(v => v && v.id) },
  playlists: (initial?.playlists || []).filter(p => p && p.pid && Array.isArray(p.videos)),
  queueView: { activePlaylistId: initial?.activePlaylistId || 'saved', items: [] },
  persist(){
    try {
      const data = {
        saved: this.saved.videos.map(v => ({id: v.id, original: v.original})),
        playlists: this.playlists.map(p => ({ pid: p.pid, title: p.title, videos: p.videos.map(v => ({id: v.id})) })),
        activePlaylistId: this.queueView.activePlaylistId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch(e){ /* ignore */ }
  },
  rebuildQueueView(){
    const apid = this.queueView.activePlaylistId;
    if(apid === 'saved'){
      this.queueView.items = this.saved.videos.map(v => ({id: v.id, original: v.original}));
    } else {
      const pl = this.playlists.find(p => p.pid === apid);
      this.queueView.items = pl ? pl.videos.map(v => ({id: v.id})) : [];
    }
  },
  activatePlaylist(pid){
    if(pid === 'saved' || this.playlists.some(p => p.pid === pid)){
      this.queueView.activePlaylistId = pid;
      this.rebuildQueueView();
      this.persist();
    }
  },
  addToSaved(video){
    if(!video || !video.id) return;
    if(this.saved.videos.some(v => v.id === video.id)) return;
    this.saved.videos.push({ id: video.id, original: video.original || video.id });
    if(this.queueView.activePlaylistId === 'saved'){ this.rebuildQueueView(); }
    this.persist();
  },
  addToSavedAtStart(video){
    if(!video || !video.id) return;
    const existingIdx = this.saved.videos.findIndex(v => v.id === video.id);
    if(existingIdx !== -1){
      const [item] = this.saved.videos.splice(existingIdx,1);
      this.saved.videos.unshift(item);
    } else {
      this.saved.videos.unshift({ id: video.id, original: video.original || video.id });
    }
    if(this.queueView.activePlaylistId === 'saved'){ this.rebuildQueueView(); }
    this.persist();
  },
  createImportedPlaylist(pid, title, ids){
    if(!pid || !ids || !ids.length) return null;
    if(this.playlists.some(p => p.pid === pid)) return null;
    const videos = ids.map(id => ({id}));
    const pl = { pid, title: title || pid, videos };
    this.playlists.push(pl);
    this.persist();
    return pl;
  },
  removeImportedPlaylist(pid){
    const idx = this.playlists.findIndex(p => p.pid === pid);
    if(idx === -1) return;
    this.playlists.splice(idx,1);
    if(this.queueView.activePlaylistId === pid){
      this.queueView.activePlaylistId = 'saved';
      this.rebuildQueueView();
    }
    this.persist();
  }
};

// Initialize queueView items on load
playlistStore.rebuildQueueView();
