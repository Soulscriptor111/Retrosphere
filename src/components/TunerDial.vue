<script setup>
import { ref, computed } from 'vue'
import { usePlayerStore } from '../stores/playerStore.js'

const store = usePlayerStore()

const MIN_FREQ = 88.0
const MAX_FREQ = 108.0

const track = ref(null)
const isDragging = ref(false)
const crackleOpacity = ref(0)
let crackleTimer = null

const ticks = computed(() => {
  const marks = []
  for (let f = MIN_FREQ; f <= MAX_FREQ + 0.001; f += 0.5) {
    const rounded = Math.round(f * 10) / 10
    marks.push({
      freq: rounded,
      major: Math.round(rounded * 10) % 20 === 0, // every 2.0 MHz
    })
  }
  return marks
})

const percent = computed(
  () => ((store.frequency - MIN_FREQ) / (MAX_FREQ - MIN_FREQ)) * 100
)

function freqFromClientX(clientX) {
  if (!track.value) return store.frequency
  const rect = track.value.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  return MIN_FREQ + ratio * (MAX_FREQ - MIN_FREQ)
}

function startCrackle() {
  stopCrackle()
  crackleTimer = window.setInterval(() => {
    crackleOpacity.value = Math.random() * 0.35
  }, 90)
}

function stopCrackle() {
  if (crackleTimer) {
    clearInterval(crackleTimer)
    crackleTimer = null
  }
  crackleOpacity.value = 0
}

function onPointerDown(e) {
  isDragging.value = true
  store.isTuning = true
  startCrackle()
  track.value?.setPointerCapture?.(e.pointerId)
  store.tuneManually(freqFromClientX(e.clientX))
}

function onPointerMove(e) {
  if (!isDragging.value) return
  store.tuneManually(freqFromClientX(e.clientX))
}

function onPointerUp(e) {
  if (!isDragging.value) return
  isDragging.value = false
  store.isTuning = false
  stopCrackle()
  track.value?.releasePointerCapture?.(e.pointerId)
}

function onKeydown(e) {
  const step = e.shiftKey ? 1.0 : 0.1
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    e.preventDefault()
    store.tuneManually(store.frequency + step)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    e.preventDefault()
    store.tuneManually(store.frequency - step)
  } else if (e.key === 'Home') {
    e.preventDefault()
    store.tuneManually(MIN_FREQ)
  } else if (e.key === 'End') {
    e.preventDefault()
    store.tuneManually(MAX_FREQ)
  }
}
</script>

<template>
  <div class="w-full select-none">
    <div class="mb-2 flex items-baseline justify-between">
      <span class="font-mono text-2xl font-medium tracking-tight text-amber-glow sm:text-3xl">
        {{ store.frequency.toFixed(1) }}<span class="ml-1 text-sm text-brass/80">FM</span>
      </span>
      <span
        v-if="store.activePresetId"
        class="font-mono text-xs uppercase tracking-widest text-brass/70"
      >
        locked in
      </span>
      <span v-else class="font-mono text-xs uppercase tracking-widest text-cream/30">
        searching…
      </span>
    </div>

    <div
      ref="track"
      class="relative h-14 w-full cursor-pointer touch-none rounded-md bg-wood-dark shadow-inset-deep"
      role="slider"
      tabindex="0"
      aria-label="FM tuner dial"
      :aria-valuemin="MIN_FREQ"
      :aria-valuemax="MAX_FREQ"
      :aria-valuenow="store.frequency"
      :aria-valuetext="`${store.frequency.toFixed(1)} FM`"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKeydown"
    >
      <!-- tick marks -->
      <div class="pointer-events-none absolute inset-x-2 bottom-1.5 flex items-end justify-between">
        <div
          v-for="tick in ticks"
          :key="tick.freq"
          class="w-px bg-brass/40"
          :class="tick.major ? 'h-4 bg-brass/70' : 'h-2'"
        ></div>
      </div>
      <div
        class="pointer-events-none absolute inset-x-2 top-1.5 flex justify-between font-mono text-[0.6rem] text-brass/50"
        aria-hidden="true"
      >
        <span>88</span>
        <span>92</span>
        <span>96</span>
        <span>100</span>
        <span>104</span>
        <span>108</span>
      </div>

      <!-- static crackle overlay -->
      <div
        class="pointer-events-none absolute inset-0 rounded-md bg-cream mix-blend-overlay transition-opacity"
        :style="{ opacity: crackleOpacity }"
        aria-hidden="true"
      ></div>

      <!-- needle -->
      <div
        class="absolute top-0 h-full w-0.5 bg-amber-glow shadow-glow transition-[left] duration-150 ease-out"
        :class="isDragging ? 'duration-0' : ''"
        :style="{ left: percent + '%' }"
        aria-hidden="true"
      >
        <div class="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-amber-glow shadow-glow"></div>
      </div>
    </div>
  </div>
</template>
