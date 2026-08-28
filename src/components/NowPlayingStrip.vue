<script setup>
import { computed } from 'vue'
import { usePlayerStore } from '../stores/playerStore.js'

const store = usePlayerStore()

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

const tickerText = computed(() => {
  if (!store.currentAlbum) return 'No station tuned — select a preset or a record to begin'
  return `${store.currentTrack} — ${store.currentAlbum.artist} — ${store.currentAlbum.year}`
})

const totalLabel = computed(() => formatTime(store.trackDuration))
const elapsedLabel = computed(() => formatTime(store.progress))
</script>

<template>
  <div
    class="flex w-full items-center gap-3 border-y-2 border-dashed border-cream/20 bg-black/30 px-3 py-2"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <div class="min-w-0 flex-1 overflow-hidden">
      <p
        class="whitespace-nowrap font-display text-sm italic text-cream/90 sm:text-base"
        :class="store.isPlaying ? 'ticker-scroll' : 'truncate'"
      >
        {{ tickerText }}
      </p>
    </div>
    <div class="shrink-0 font-mono text-xs text-brass/70 sm:text-sm">
      {{ store.currentAlbum ? elapsedLabel : '0:00' }} / {{ totalLabel }}
    </div>
  </div>
</template>

<style scoped>
@keyframes ticker-scroll {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-100%);
  }
}
.ticker-scroll {
  display: inline-block;
  animation: ticker-scroll 12s linear infinite;
  padding-left: 100%;
}
</style>
