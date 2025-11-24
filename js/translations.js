// Simple i18n system
const dictionaries = {
  ru: {
    heading: 'Video Queue Player',
    subtitle: 'Вставьте ссылку на видео или плейлист. Смотрите сразу, сохраняйте одиночные видео в Saved, импортируйте плейлист отдельно.',
    watch_now: 'Смотреть',
    add_to_queue: 'В очередь', // legacy
    save_video: 'Сохранить',
    import_playlist: 'Импорт плейлиста',
    previous: '⟨ Предыдущее',
    next: 'Следующее ⟩',
    queue_title: 'Очередь',
    clear_queue: 'Очистить',
    queue_empty: 'Очередь пуста. Добавьте видео.',
    modal_title: 'Очистить всю очередь?',
    modal_text: 'Это удалит все видео из списка. Действие нельзя отменить.',
    modal_confirm: 'Очистить',
    modal_cancel: 'Отмена',
    open_queue: 'Очередь',
    close_queue: 'Закрыть',
    loading: 'Загрузка...',
    delete: 'Удалить',
    error_enter_url: 'Введите ссылку.',
    error_extract: 'Не удалось извлечь ID видео.',
    error_duplicate: 'Видео уже в очереди.',
    video_saved: 'Видео сохранено в Saved.',
    already_saved: 'Уже в Saved.'
    ,saved_playlist: 'Saved',
    active_playlist: 'Активный плейлист:',
    playlist_loading: 'Загрузка плейлиста...',
    playlist_fetch_error: 'Ошибка загрузки плейлиста.',
    playlist_empty: 'Плейлист пуст.',
    playlist_added_count: 'Добавлено видео: {n}',
    playlist_confirm_title: 'Импортировать плейлист?',
    playlist_confirm_text: 'Будет создан отдельный плейлист. Видео не попадут в Saved.',
    playlist_confirm_count: 'Видео в плейлисте: {n}',
    playlist_confirm_ok: 'Импортировать',
    playlist_confirm_cancel: 'Отмена',
    playlist_delete_confirm_title: 'Удалить плейлист?',
    playlist_delete_confirm_text: 'Плейлист будет удалён. Saved не изменится.',
    playlist_delete_confirm_ok: 'Удалить',
    playlist_delete_confirm_cancel: 'Отмена',
    import_playlist_play: 'Импорт и смотреть',
    fullscreen: 'На весь экран',
    cast: 'Cast',
    cast_no_devices: 'Нет устройств',
    cast_connecting: 'Подключение...',
    cast_connected: 'Подключено'
  },
  en: {
    heading: 'Video Queue Player',
    subtitle: 'Paste a YouTube video or playlist URL. Watch instantly, save single videos to Saved, or import & play whole playlists.',
    watch_now: 'Watch',
    add_to_queue: 'Queue', // legacy
    save_video: 'Save',
    import_playlist: 'Import playlist',
    previous: '⟨ Previous',
    next: 'Next ⟩',
    queue_title: 'Queue',
    clear_queue: 'Clear',
    queue_empty: 'Queue is empty. Add videos.',
    modal_title: 'Clear entire queue?',
    modal_text: 'This will remove all videos. This action cannot be undone.',
    modal_confirm: 'Clear',
    modal_cancel: 'Cancel',
    open_queue: 'Queue',
    close_queue: 'Close',
    loading: 'Loading...',
    delete: 'Delete',
    error_enter_url: 'Enter a link.',
    error_extract: 'Could not extract video ID.',
    error_duplicate: 'Video already in queue.',
    video_saved: 'Saved to Saved playlist.',
    already_saved: 'Already in Saved playlist.'
    ,saved_playlist: 'Saved',
    active_playlist: 'Active playlist:',
    playlist_loading: 'Loading playlist...',
    playlist_fetch_error: 'Playlist fetch error.',
    playlist_empty: 'Playlist is empty.',
    playlist_added_count: 'Videos added: {n}',
    playlist_confirm_title: 'Import playlist?',
    playlist_confirm_text: 'A separate playlist will be created. Videos stay out of Saved.',
    playlist_confirm_count: 'Videos in playlist: {n}',
    playlist_confirm_ok: 'Import',
    playlist_confirm_cancel: 'Cancel',
    playlist_delete_confirm_title: 'Delete playlist?',
    playlist_delete_confirm_text: 'This will remove the playlist. Saved videos remain.',
    playlist_delete_confirm_ok: 'Delete',
    playlist_delete_confirm_cancel: 'Cancel',
    import_playlist_play: 'Import & Play',
    fullscreen: 'Fullscreen',
    cast: 'Cast',
    cast_no_devices: 'No devices',
    cast_connecting: 'Connecting...',
    cast_connected: 'Connected'
  },
  es: {
    heading: 'Video Queue Player',
    subtitle: 'Pega un enlace de YouTube. Puedes ver o añadir a la cola.',
    watch_now: 'Ver',
    add_to_queue: 'A la cola', // legacy
    save_video: 'Guardar',
    previous: '⟨ Anterior',
    next: 'Siguiente ⟩',
    queue_title: 'Cola',
    clear_queue: 'Limpiar',
    queue_empty: 'La cola está vacía. Añade vídeos.',
    modal_title: '¿Limpiar toda la cola?',
    modal_text: 'Esto eliminará todos los vídeos. No se puede deshacer.',
    modal_confirm: 'Limpiar',
    modal_cancel: 'Cancelar',
    open_queue: 'Cola',
    close_queue: 'Cerrar',
    loading: 'Cargando...',
    delete: 'Eliminar',
    error_enter_url: 'Introduce un enlace.',
    error_extract: 'No se pudo extraer ID.',
    error_duplicate: 'Vídeo ya en la cola.',
    video_saved: 'Vídeo guardado en Guardado.',
    already_saved: 'Ya en Guardado.'
    ,saved_playlist: 'Guardado',
    active_playlist: 'Lista activa:',
    import_playlist: 'Importar lista',
    playlist_loading: 'Cargando lista...',
    playlist_fetch_error: 'Error al obtener lista.',
    playlist_empty: 'Lista vacía.',
    playlist_added_count: 'Videos añadidos: {n}',
    playlist_confirm_title: '¿Importar lista?',
    playlist_confirm_text: 'Se creará una lista separada. Videos no van a Guardado.',
    playlist_confirm_count: 'Videos en la lista: {n}',
    playlist_confirm_ok: 'Importar',
    playlist_confirm_cancel: 'Cancelar',
    playlist_delete_confirm_title: '¿Eliminar lista?',
    playlist_delete_confirm_text: 'La lista se eliminará. Guardado no cambia.',
    playlist_delete_confirm_ok: 'Eliminar',
    playlist_delete_confirm_cancel: 'Cancelar',
    import_playlist_play: 'Importar y reproducir',
    fullscreen: 'Pantalla completa',
    cast: 'Cast',
    cast_no_devices: 'Sin dispositivos',
    cast_connecting: 'Conectando...',
    cast_connected: 'Conectado'
  },
  de: {
    heading: 'Video Queue Player',
    subtitle: 'Füge einen YouTube-Link ein. Du kannst ansehen oder rechts zur Warteschlange hinzufügen.',
    watch_now: 'Ansehen',
    add_to_queue: 'Zur Warteschlange', // legacy
    save_video: 'Speichern',
    previous: '⟨ Zurück',
    next: 'Weiter ⟩',
    queue_title: 'Warteschlange',
    clear_queue: 'Leeren',
    queue_empty: 'Warteschlange leer. Füge Videos hinzu.',
    modal_title: 'Warteschlange komplett leeren?',
    modal_text: 'Alle Videos werden entfernt. Nicht rückgängig.',
    modal_confirm: 'Leeren',
    modal_cancel: 'Abbrechen',
    open_queue: 'Warteschlange',
    close_queue: 'Schließen',
    loading: 'Lädt...',
    delete: 'Löschen',
    error_enter_url: 'Link eingeben.',
    error_extract: 'Video-ID konnte nicht extrahiert werden.',
    error_duplicate: 'Video bereits in Warteschlange.',
    video_saved: 'Video in Gespeichert gespeichert.',
    already_saved: 'Bereits in Gespeichert.'
    ,saved_playlist: 'Gespeichert',
    active_playlist: 'Aktive Playlist:',
    import_playlist: 'Playlist importieren',
    playlist_loading: 'Playlist wird geladen...',
    playlist_fetch_error: 'Fehler beim Laden.',
    playlist_empty: 'Playlist leer.',
    playlist_added_count: 'Videos hinzugefügt: {n}',
    playlist_confirm_title: 'Playlist importieren?',
    playlist_confirm_text: 'Separate Playlist wird erstellt. Videos bleiben außerhalb Gespeichert.',
    playlist_confirm_count: 'Videos in Playlist: {n}',
    playlist_confirm_ok: 'Importieren',
    playlist_confirm_cancel: 'Abbrechen',
    playlist_delete_confirm_title: 'Playlist löschen?',
    playlist_delete_confirm_text: 'Playlist wird entfernt. Gespeichert bleibt.',
    playlist_delete_confirm_ok: 'Löschen',
    playlist_delete_confirm_cancel: 'Abbrechen',
    import_playlist_play: 'Importieren & Abspielen',
    fullscreen: 'Vollbild',
    cast: 'Cast',
    cast_no_devices: 'Keine Geräte',
    cast_connecting: 'Verbinden...',
    cast_connected: 'Verbunden'
  },
  fr: {
    heading: 'Video Queue Player',
    subtitle: 'Collez un lien YouTube. Vous pouvez regarder ou ajouter à la file à droite.',
    watch_now: 'Regarder',
    add_to_queue: 'En file', // legacy
    save_video: 'Sauvegarder',
    previous: '⟨ Précédent',
    next: 'Suivant ⟩',
    queue_title: 'File',
    clear_queue: 'Vider',
    queue_empty: 'La file est vide. Ajoutez des vidéos.',
    modal_title: 'Vider toute la file ?',
    modal_text: 'Cela supprimera toutes les vidéos. Action irréversible.',
    modal_confirm: 'Vider',
    modal_cancel: 'Annuler',
    open_queue: 'File',
    close_queue: 'Fermer',
    loading: 'Chargement...',
    delete: 'Supprimer',
    error_enter_url: 'Entrez un lien.',
    error_extract: 'Impossible d’extraire l’ID.',
    error_duplicate: 'Vidéo déjà dans la file.',
    video_saved: 'Vidéo ajoutée à Sauvegardé.',
    already_saved: 'Déjà dans Sauvegardé.'
    ,saved_playlist: 'Sauvegardé',
    active_playlist: 'Playlist active :',
    import_playlist: 'Importer playlist',
    playlist_loading: 'Chargement playlist...',
    playlist_fetch_error: 'Erreur de chargement.',
    playlist_empty: 'Playlist vide.',
    playlist_added_count: 'Vidéos ajoutées : {n}',
    playlist_confirm_title: 'Importer la playlist ?',
    playlist_confirm_text: 'Une playlist séparée sera créée. Les vidéos ne vont pas dans Sauvegardé.',
    playlist_confirm_count: 'Vidéos dans playlist : {n}',
    playlist_confirm_ok: 'Importer',
    playlist_confirm_cancel: 'Annuler',
    playlist_delete_confirm_title: 'Supprimer la playlist ?',
    playlist_delete_confirm_text: 'La playlist sera supprimée. Sauvegardé reste inchangé.',
    playlist_delete_confirm_ok: 'Supprimer',
    playlist_delete_confirm_cancel: 'Annuler',
    import_playlist_play: 'Importer & Lire',
    fullscreen: 'Plein écran',
    cast: 'Cast',
    cast_no_devices: 'Aucun appareil',
    cast_connecting: 'Connexion...',
    cast_connected: 'Connecté'
  }
};

let currentLang = localStorage.getItem('appLang') || 'en';
if(!dictionaries[currentLang]) currentLang = 'en';

export function t(key){
  return dictionaries[currentLang][key] || key;
}
export function setLang(lang){
  if(dictionaries[lang]){
    currentLang = lang;
    localStorage.setItem('appLang', lang);
    document.documentElement.lang = lang;
    applyTranslations();
  }
}
export function getLang(){ return currentLang; }

export function applyTranslations(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if(!key) return;
    el.textContent = t(key);
  });
  // Buttons that have inner HTML with icons need special handling
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if(prevBtn) prevBtn.textContent = t('previous');
  if(nextBtn) nextBtn.textContent = t('next');
  // Queue toggle button
  const openQueueBtn = document.getElementById('openQueueBtn');
  const qc = document.getElementById('queueCount');
  if(openQueueBtn && qc){
    if(openQueueBtn.getAttribute('aria-label') === 'Закрыть очередь' || openQueueBtn.textContent.includes(t('close_queue'))){
      openQueueBtn.innerHTML = `${t('close_queue')} <span id="queueCount" class="queue-count">${qc.textContent}</span>`;
    } else {
      openQueueBtn.innerHTML = `${t('open_queue')} <span id="queueCount" class="queue-count">${qc.textContent}</span>`;
    }
  }
  // Update aria-labels simple case
  const map = {
    queueBtn: 'save_video',
    prevBtn: 'previous',
    nextBtn: 'next'
  };
  Object.entries(map).forEach(([id,key]) => {
    const el = document.getElementById(id);
    if(el) el.setAttribute('aria-label', t(key));
  });
}

// Expose dictionary for queue.js error strings
export const dict = dictionaries;
