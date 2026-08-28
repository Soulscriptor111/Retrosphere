<script setup>
import { usePlayerStore } from '../stores/playerStore.js'
import { presets } from '../data/albums.js'

const store = usePlayerStore()

function select(presetId) {
  store.selectPreset(presetId)
}
</script>

<template>
  <div class="flex w-full flex-wrap gap-2" role="group" aria-label="Radio station presets">
    <button
      v-for="preset in presets"
      :key="preset.id"
      type="button"
      class="flex-1 min-w-[4.5rem] rounded-md border border-brass/30 bg-wood-dark px-2 py-2 font-sans text-xs font-semibold tracking-wide text-cream/80 shadow-knob transition-all duration-150 ease-out hover:border-brass/60 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass active:scale-95 sm:text-sm"
      :class="
        store.activePresetId === preset.id
          ? 'border-amber-glow bg-amber-glow/20 text-amber-glow shadow-glow'
          : ''
      "
      :aria-pressed="store.activePresetId === preset.id"
      :aria-label="`${preset.label} station, ${preset.frequency.toFixed(1)} FM`"
      @click="select(preset.id)"
    >
      {{ preset.label }}
      <span class="block font-mono text-[0.6rem] font-normal text-brass/60">{{ preset.frequency.toFixed(1) }}</span>
    </button>
  </div>
</template>
