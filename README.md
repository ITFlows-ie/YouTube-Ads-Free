# Video Queue Player

A lightweight, client‑side video iframe player with a persistent queue, custom playlists, and instant playback. Designed for simplicity: no backend, no tracking, no ad logic—just a clean interface to collect and play video IDs.

## Core Features
- Instant playback via iframe swap
- Saved list for individual videos
- Imported playlists kept separate
- Playlist activation loads its items into the play queue
- Queue reordering & deletion per item
- Responsive sidebar (overlay on small screens)
- Persistent state (`localStorage`)
- Basic accessibility (ARIA labels, focusable modals)

## Structure (Simplified)
```
index.html
css/
  base.css
  layout.css
  components.css
  responsive.css
js/
  utils.js
  queue.js
  playlists.js
  translations.js
  main.js
```

## Workflow
1. Paste a video or playlist URL/ID in the input.
2. Use "Watch" for immediate playback (or import if it is a playlist).
3. Use "Save" to add an individual video to the Saved list.
4. Select playlists from the sidebar dropdown to activate them.
5. Navigate with Previous / Next when multiple items are loaded.

## Playlists
- Imported playlists are stored separately from Saved.
- Deletion requires confirmation; Saved list remains unchanged.
- Activation clears current queue and loads playlist videos in order.

## Persistence
All playlist and queue data is stored locally in the browser; clearing site data resets the app.

## Accessibility & UX
- Focus moved to modals on open
- Esc closes confirmation dialogs
- Visual feedback for current item and empty states

## Roadmap Ideas
- Keyboard shortcuts
- Dark theme toggle
- Export/import playlist & queue JSON
- Shareable encoded state in URL
- Optional auto‑advance on video end

## Contributing
1. Fork the repository
2. Create a branch: `git checkout -b feature/my-change`
3. Commit: `git commit -m "feat: my change"`
4. Push: `git push origin feature/my-change`
5. Open a Pull Request

Keep changes focused and avoid heavy frameworks unless truly needed.

## License
Add a LICENSE file (e.g. MIT) suitable for your goals.

---
Issues and feature requests are welcome.
