# YouTube Ads Free Player

A minimal, responsive, client‑side web app for watching YouTube videos in an uncluttered interface and building a personal play queue. The app embeds videos directly (no backend, no tracking) and provides quality of life features like a sortable queue, metadata previews, multi‑language UI, and persistent state in `localStorage`.

> Disclaimer: This project does not hack, strip, or technically block YouTube ads; it simply uses the standard YouTube embed player. Some ads may still appear depending on region/account. Always follow YouTube Terms of Service.

## Key Features
- Ad‑minimal embedded playback (standard iframe player, clean surrounding UI)
- Play Queue: Add videos, reorder via drag & drop, delete items
- Metadata Fetch: Title + thumbnail via YouTube oEmbed with fallback to `img.youtube.com`
- Persistent State: Queue & current index saved to `localStorage`
- Multi‑Language Interface: English (default), Russian, Spanish, German, French (instant switching, remembered in `localStorage`)
- Quick Add Workflow: Input auto‑clears after adding to queue for rapid batch entry
- Navigation Controls: Previous / Next buttons when queue has 2+ videos
- Responsive Layout: Off‑canvas queue panel on mobile with overlay
- Accessibility Enhancements: ARIA labels, focus management for modal, reduced motion considerations
- Animated Queue Counter Badge: Immediate feedback on queue size changes
- Confirmation Modal: Safe bulk clear with Esc / backdrop dismissal

## Technology Stack
- Pure HTML/CSS/JavaScript (ES Modules)
- No build step, no framework
- No external dependencies except the YouTube embed/oEmbed endpoints

## Project Structure (Simplified)
```
index.html
css/
  base.css        # Variables, resets
  layout.css      # Structural layout + responsive panel behavior
  components.css  # UI components (buttons, modal, queue items, language switcher)
  responsive.css  # Breakpoint adjustments & reduced motion
js/
  utils.js        # ID extraction, embed URL builder, metadata fetch, HTML escape
  queue.js        # Queue state mgmt, rendering, persistence, drag & drop
  main.js         # App bootstrap, events, modal & sidebar logic, language init
  translations.js # Dictionaries + translation helpers (t, setLang, applyTranslations)
img/
  logo100.png
  favicon.svg
```

## How It Works
1. User pastes any supported YouTube URL (watch, youtu.be, embed, shorts, or direct ID).
2. `utils.extractId()` normalizes and extracts the video ID.
3. Adding to queue creates a placeholder item; metadata is loaded asynchronously.
4. Queue rendering updates count badge and applies active class to the current video.
5. Playback is just an iframe swap; loading state shows a subtle skeleton.
6. All state (IDs + current index + selected language) persists in `localStorage`.

## Usage
1. Open the site.
2. Paste a YouTube link into the input field.
3. Click "Watch" for immediate playback OR "Queue" to add it to the list.
4. Reorder queued videos by dragging their row handle (↕).
5. Use Previous / Next when multiple videos are queued.
6. Switch language via the top‑right select; preference is remembered.
7. Clear entire queue using the Clear button (confirmation modal will appear).

## Supported URL Formats
- `https://www.youtube.com/watch?v=VIDEOID`
- `https://youtu.be/VIDEOID`
- `https://www.youtube.com/embed/VIDEOID`
- `https://www.youtube.com/shorts/VIDEOID`
- Raw ID: `VIDEOID`

## Accessibility Notes
- Modal traps focus logically (close & confirm are reachable, Esc closes)
- ARIA labels translated per active language
- Animated badge uses scale pulse; can be refined for `prefers-reduced-motion`

## Internationalization (i18n)
- Central dictionaries in `translations.js`
- Elements marked with `data-i18n` are auto‑updated by `applyTranslations()`
- Dynamic strings (errors, loading, delete, queue toggle) resolved via `t(key)`

## Deployment to GitHub Pages
You can host this repository directly on GitHub Pages (no build step required).

### Option A: Deploy from `main` root
1. Push all files to GitHub (ensure `index.html` is in the repository root).
2. In GitHub UI: `Settings` → `Pages`.
3. Under "Build and deployment" choose:
   - Source: `Deploy from a branch`
   - Branch: `main` / folder: `/root`
4. Save. GitHub will publish at `https://<your-username>.github.io/YouTube-Ads-Free/`.
5. Wait ~1–2 minutes for first build.

### Option B: Use a `gh-pages` Branch
1. Create and push branch `gh-pages` with the same contents.
2. In `Settings` → `Pages`: select branch `gh-pages` / folder `/root`.
3. Save.

### Optional: Custom Domain
Add a `CNAME` file in the root or configure a domain in Pages settings.

### Cache Busting
Because assets are static, updates propagate quickly, but browsers may cache aggressively. If you change critical assets (e.g. CSS), you can add a query string version: `css/components.css?v=1`.

## Future Ideas / Roadmap
- Hotkeys (Enter watch, Ctrl+Enter queue, Arrow keys prev/next)
- Playlist bulk import
- Export/import queue (JSON)
- Shareable URL with encoded list of IDs
- Auto‑advance on video end (requires YouTube IFrame API)
- Light/Dark theme switch
- PWA: `manifest.json` + Service Worker offline shell
- Search / filter inside the queue
- Stats (total watch time, most added)

## Contributing
1. Fork the repo.
2. Create a feature branch: `git checkout -b feature/my-improvement`
3. Commit changes: `git commit -m "Add improvement"`
4. Push: `git push origin feature/my-improvement`
5. Open a Pull Request.

Please keep features lightweight and avoid introducing heavy frameworks unless justified.

## Security & Privacy
- No cookies set by the app itself (YouTube iframe may set its own cookies).
- No analytics or tracking scripts.
- Inputs sanitized via controlled usage; IDs are escaped before HTML insertion.

## Limitations
- Actual ad removal is not guaranteed (depends on YouTube policies).
- No server‑side functionality (cannot store queues across devices).
- If oEmbed fails, fallback thumbnails may be lower resolution.

## License
Add a license file (e.g. MIT) to clarify usage. Example MIT header:
```
MIT License
Copyright (c) 2025 <Your Name>
```
(Choose the license that fits your goals.)

## Trademark Notice
"YouTube" is a trademark of Google LLC. This project is unofficial and not endorsed by Google.

---
Feel free to open issues for feature requests or bug reports.
