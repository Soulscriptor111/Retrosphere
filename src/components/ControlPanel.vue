<script setup>
import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/playerStore.js'

const store = usePlayerStore()

// ── Volume knob geometry ──────────────────────────────────────
const CENTER = 56
const TICK_RADIUS = 52
const MIN_ANGLE = -135
const MAX_ANGLE = 135

const knobEl = ref(null)
const isDraggingKnob = ref(false)

const knobAngle = computed(() => MIN_ANGLE + (store.volume / 100) * (MAX_ANGLE - MIN_ANGLE))

const arcTicks = computed(() =>
  [0, 25, 50, 75, 100].map((v) => {
    const angle = MIN_ANGLE + (v / 100) * (MAX_ANGLE - MIN_ANGLE)
    const rad = (angle * Math.PI) / 180
    return {
      value: v,
      x: CENTER + TICK_RADIUS * Math.sin(rad),
      y: CENTER - TICK_RADIUS * Math.cos(rad),
    }
  })
)

function angleFromPointer(clientX, clientY) {
  if (!knobEl.value) return knobAngle.value
  const rect = knobEl.value.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = clientX - cx
  const dy = clientY - cy
  let angle = (Math.atan2(dx, -dy) * 180) / Math.PI
  return Math.min(MAX_ANGLE, Math.max(MIN_ANGLE, angle))
}

function onKnobPointerDown(e) {
  isDraggingKnob.value = true
  knobEl.value?.setPointerCapture?.(e.pointerId)
  const angle = angleFromPointer(e.clientX, e.clientY)
  store.setVolume(((angle - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE)) * 100)
}

function onKnobPointerMove(e) {
  if (!isDraggingKnob.value) return
  const angle = angleFromPointer(e.clientX, e.clientY)
  store.setVolume(((angle - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE)) * 100)
}

function onKnobPointerUp(e) {
  isDraggingKnob.value = false
  knobEl.value?.releasePointerCapture?.(e.pointerId)
}

function onKnobKeydown(e) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    e.preventDefault()
    store.setVolume(store.volume + 5)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    e.preventDefault()
    store.setVolume(store.volume - 5)
  } else if (e.key === 'Home') {
    e.preventDefault()
    store.setVolume(0)
  } else if (e.key === 'End') {
    e.preventDefault()
    store.setVolume(100)
  }
}

// ── Vertical EQ sliders (Bass / Treble) ───────────────────────
const bassTrackEl = ref(null)
const trebleTrackEl = ref(null)

function makeVerticalSlider(trackEl, getValue, setValue) {
  const dragging = ref(false)

  function valueFromPointer(clientY) {
    if (!trackEl.value) return getValue()
    const rect = trackEl.value.getBoundingClientRect()
    const ratio = 1 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
    return ratio * 100
  }

  function onPointerDown(e) {
    dragging.value = true
    trackEl.value?.setPointerCapture?.(e.pointerId)
    setValue(valueFromPointer(e.clientY))
  }
  function onPointerMove(e) {
    if (!dragging.value) return
    setValue(valueFromPointer(e.clientY))
  }
  function onPointerUp(e) {
    dragging.value = false
    trackEl.value?.releasePointerCapture?.(e.pointerId)
  }
  function onKeydown(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault()
      setValue(getValue() + 5)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setValue(getValue() - 5)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setValue(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setValue(100)
    }
  }

  return { onPointerDown, onPointerMove, onPointerUp, onKeydown }
}

const bassSlider = makeVerticalSlider(
  bassTrackEl,
  () => store.bass,
  (v) => store.setBass(v)
)
const trebleSlider = makeVerticalSlider(
  trebleTrackEl,
  () => store.treble,
  (v) => store.setTreble(v)
)
</script>

<template>
  <div class="flex w-full flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
    <!-- Volume knob -->
    <div class="flex flex-col items-center gap-1">
      <div
        ref="knobEl"
        class="relative h-[7rem] w-[7rem] touch-none select-none"
        role="slider"
        tabindex="0"
        aria-label="Volume"
        :aria-valuemin="0"
        :aria-valuemax="100"
        :aria-valuenow="Math.round(store.volume)"
        :aria-valuetext="`${Math.round(store.volume)} percent`"
        @pointerdown="onKnobPointerDown"
        @pointermove="onKnobPointerMove"
        @pointerup="onKnobPointerUp"
        @pointercancel="onKnobPointerUp"
        @keydown="onKnobKeydown"
      >
        <div
          v-for="tick in arcTicks"
          :key="tick.value"
          class="pointer-events-none absolute font-mono text-[0.6rem] text-brass/60"
          :style="{ left: tick.x + 'px', top: tick.y + 'px', transform: 'translate(-50%, -50%)' }"
        >
          {{ tick.value }}
        </div>

        <div
          class="absolute inset-4 cursor-grab rounded-full bg-gradient-to-b from-wood-light to-wood-dark shadow-knob active:cursor-grabbing"
          :class="isDraggingKnob ? 'ring-2 ring-amber-glow' : ''"
        >
          <div
            class="absolute inset-0 rounded-full transition-transform duration-100 ease-out"
            :class="isDraggingKnob ? 'duration-0' : ''"
            :style="{ transform: `rotate(${knobAngle}deg)` }"
          >
            <div class="absolute left-1/2 top-2 h-3 w-1 -translate-x-1/2 rounded-full bg-amber-glow shadow-glow"></div>
          </div>
        </div>
      </div>
      <span class="font-mono text-xs text-brass/70">VOL {{ Math.round(store.volume) }}</span>
    </div>

    <!-- Playback buttons -->
    <div class="flex items-center justify-center gap-3">
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-md border border-brass/30 bg-wood-dark font-sans text-cream shadow-knob transition-transform duration-100 ease-out hover:border-brass/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass active:scale-95"
        aria-label="Rewind"
        @click="store.rewind()"
      >
        <span aria-hidden="true">◀◀</span>
      </button>
      <button
        type="button"
        class="flex h-14 w-20 items-center justify-center rounded-md border border-brass/40 bg-wood-dark font-sans text-lg text-cream shadow-knob transition-transform duration-100 ease-out hover:border-brass/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass active:scale-95"
        :class="store.isPlaying ? 'border-amber-glow text-amber-glow shadow-glow' : ''"
        :aria-label="store.isPlaying ? 'Pause' : 'Play'"
        @click="store.togglePlay()"
      >
        <span aria-hidden="true">{{ store.isPlaying ? '❚❚' : '▶' }}</span>
      </button>
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-md border border-brass/30 bg-wood-dark font-sans text-cream shadow-knob transition-transform duration-100 ease-out hover:border-brass/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass active:scale-95"
        aria-label="Skip"
        @click="store.skip()"
      >
        <span aria-hidden="true">▶▶</span>
      </button>
    </div>

    <!-- EQ sliders -->
    <div class="flex items-end justify-center gap-6">
      <div class="flex flex-col items-center gap-1">
        <span class="font-mono text-[0.65rem] text-brass/60">{{ Math.round(store.bass) }}</span>
        <div
          ref="bassTrackEl"
          class="relative h-24 w-3 touch-none rounded-full bg-black/50 shadow-inset-deep"
          role="slider"
          tabindex="0"
          aria-label="Bass"
          aria-orientation="vertical"
          :aria-valuemin="0"
          :aria-valuemax="100"
          :aria-valuenow="Math.round(store.bass)"
          @pointerdown="bassSlider.onPointerDown"
          @pointermove="bassSlider.onPointerMove"
          @pointerup="bassSlider.onPointerUp"
          @pointercancel="bassSlider.onPointerUp"
          @keydown="bassSlider.onKeydown"
        >
          <div
            class="absolute left-1/2 h-3 w-6 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gradient-to-b from-brass-light to-brass-dark shadow-knob"
            :style="{ bottom: store.bass + '%' }"
          ></div>
        </div>
        <span class="font-sans text-[0.65rem] tracking-widest text-cream/50">BASS</span>
      </div>

      <div class="flex flex-col items-center gap-1">
        <span class="font-mono text-[0.65rem] text-brass/60">{{ Math.round(store.treble) }}</span>
        <div
          ref="trebleTrackEl"
          class="relative h-24 w-3 touch-none rounded-full bg-black/50 shadow-inset-deep"
          role="slider"
          tabindex="0"
          aria-label="Treble"
          aria-orientation="vertical"
          :aria-valuemin="0"
          :aria-valuemax="100"
          :aria-valuenow="Math.round(store.treble)"
          @pointerdown="trebleSlider.onPointerDown"
          @pointermove="trebleSlider.onPointerMove"
          @pointerup="trebleSlider.onPointerUp"
          @pointercancel="trebleSlider.onPointerUp"
          @keydown="trebleSlider.onKeydown"
        >
          <div
            class="absolute left-1/2 h-3 w-6 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-gradient-to-b from-brass-light to-brass-dark shadow-knob"
            :style="{ bottom: store.treble + '%' }"
          ></div>
        </div>
        <span class="font-sans text-[0.65rem] tracking-widest text-cream/50">TREBLE</span>
      </div>
    </div>
  </div>
</template>
