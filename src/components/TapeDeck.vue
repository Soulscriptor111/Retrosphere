<script setup>
defineProps({
  isPlaying: Boolean,
  title: { type: String, default: '' },
  artist: { type: String, default: '' },
})

function Reel() {}
</script>

<template>
  <div class="bg-wood-dark/60 rounded-lg p-4 shadow-cabinet">
    <div class="flex items-center justify-center gap-10 py-3">
      <div
        class="w-16 h-16 rounded-full border-4 border-brass bg-gradient-to-br from-[#2a1d13] to-[#4A3728] relative"
        :class="isPlaying ? 'reel-spinning' : ''"
      >
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-3 h-3 rounded-full bg-brass"></div>
        </div>
        <div class="absolute inset-2 rounded-full border border-cream/20"></div>
      </div>

      <div
        class="w-16 h-16 rounded-full border-4 border-brass bg-gradient-to-br from-[#2a1d13] to-[#4A3728] relative"
        :class="isPlaying ? 'reel-spinning' : ''"
      >
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-3 h-3 rounded-full bg-brass"></div>
        </div>
        <div class="absolute inset-2 rounded-full border border-cream/20"></div>
      </div>
    </div>

    <div class="text-center mt-2 px-2 overflow-hidden">
      <p class="font-display text-cream text-lg truncate">
        {{ title || 'No song loaded' }}
      </p>
      <p class="font-mono text-brass text-xs uppercase tracking-widest truncate">
        {{ artist || '— insert a tape —' }}
      </p>
    </div>
  </div>
</template>
