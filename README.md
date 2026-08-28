# RetroSphere

A nostalgic 1970s-inspired music listening ritual — an FM tuner, a tape deck,
and a record crate, all rendered as warm, tactile analog hardware. Every
interaction (knobs, sliders, cassette reels, VU meters) is a visual/CSS
simulation — no real audio is played.

## Stack

- Vue 3 (`<script setup>`, Composition API)
- Pinia for the player store
- Tailwind CSS (utility classes only; the few continuous/looping effects —
  reel spin, marquee scroll, LED pulse, static crackle, tray "clunk", eject
  spring — live as `@keyframes` inside each component's `<style scoped>` block)
- Vite

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

To build for production:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  components/
    RadioCabinet.vue    – wooden cabinet shell, responsive layout (desktop
                           grid / tablet tabs / mobile swipe carousel)
    TunerDial.vue        – draggable FM dial, 88.0–108.0, static crackle
    PresetButtons.vue    – JAZZ / ROCK / CLASSICAL / POP / AMBIENT stations
    TapeDeck.vue          – spinning reels, load "clunk", eject, marquee, progress
    NowPlayingStrip.vue  – ticket-strip ticker with perforated edges
    ControlPanel.vue     – rotary volume knob, play/skip/rewind, Bass/Treble EQ
    VUMeter.vue           – 5-bar LED meter, sleeps at rest
    LibraryGrid.vue      – responsive record-crate grid, batches lazy-load
    AlbumCard.vue         – single vinyl-style cover card
  stores/
    playerStore.js       – Pinia store: single source of truth for playback,
                            tuner, and control-panel state
  data/
    albums.js            – 12 mock albums + the 5 station presets
  App.vue
  main.js
  main.css               – Tailwind directives only
```

## Notes

- All 12 albums, artists, and tracks are invented for this demo.
- Everything is CSS-drawn (gradients, shadows, radial vignette) — no image
  assets — except the three Google Fonts (Playfair Display, JetBrains Mono,
  Inter) loaded in `index.html`.
- Keyboard support: Tab to any control; Arrow keys adjust the tuner, volume
  knob, and EQ sliders; Enter/Space activates buttons and ejects the tape.
