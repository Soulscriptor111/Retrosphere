# RetroSphere — Phase 1 (Foundation)

Drop these files into your existing Vite + Vue project (matching paths).
They assume Tailwind is already configured — this just extends your
`tailwind.config.js` with the RetroSphere palette/fonts.

## Files included

```
tailwind.config.js          ← merge into your existing config
index.html                  ← replace (or copy the <head> font links + theme-color)
src/style.css                ← replace your global stylesheet
src/main.js                  ← replace (adds service worker registration)
src/App.vue                  ← replace (main screen)
src/components/RadioCabinet.vue
src/components/TapeDeck.vue
src/components/VUMeter.vue
src/components/Controls.vue
src/components/FileUpload.vue
src/composables/useAudioEngine.js
src/composables/useLibrary.js
src/composables/useMetadata.js
public/sw.js                 ← offline app-shell caching
```

## Setup

You already have `vite`, `vue`, and `tailwindcss`. Nothing else is
*required* to see it working — playback, upload, storage, and the VU
meter all run on native Web Audio API / File API / IndexedDB, no
extra packages.

One optional install, for real ID3/FLAC tag reading (artist, album,
year, cover art) instead of guessing from the filename:

```
npm install music-metadata-browser
```

If you skip it, uploads still work — `useMetadata.js` falls back to
parsing the filename as `Artist - Title.mp3`.

Then:

```
npm run dev
```

## What's working in this phase

- Wooden cabinet UI with brass corners, glowing amber LEDs, spinning
  tape reels while a song plays
- Drag-and-drop or tap-to-browse upload for MP3 / FLAC / WAV
- Songs persist in IndexedDB (survive refresh/offline)
- Play / pause / skip / rewind / seek / volume knob
- Animated 16-bar VU meter driven by a live `AnalyserNode`
- Mobile-first responsive layout (single column, scales up)
- Basic offline service worker caching the app shell

## Notes / things to decide before Phase 2

- The tape reels only animate while `isPlaying` is true — check
  `src/style.css` `.reel-spinning` if you want a different speed.
- `useAudioEngine.js` creates the `AudioContext` lazily on first
  `play()` (browsers block autoplay-before-gesture otherwise).
- Cover art from ID3 tags is stored as an object URL — fine for now,
  but you'll want to persist it as a blob in IndexedDB too, or it's
  lost on reload. Left as a Phase 1→2 cleanup item.
- The service worker only caches same-origin static assets — audio
  blobs live in IndexedDB, not the cache, which is correct but worth
  knowing when you test "offline" in devtools.
