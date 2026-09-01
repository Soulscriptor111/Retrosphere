<script setup>
const props = defineProps({
  isPlaying: Boolean,
  volume: { type: Number, default: 0.8 },
  currentTime: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  playbackRate: { type: Number, default: 1 },
});

const emit = defineEmits(["toggle", "next", "prev", "seek", "volume", "speed"]);

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function fmt(t) {
  if (!t || Number.isNaN(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function onSeek(e) {
  emit("seek", Number(e.target.value));
}

function onVolume(e) {
  emit("volume", Number(e.target.value));
}
</script>

<template>
  <div class="space-y-3">
    <!-- Scrub bar -->
    <div class="flex items-center gap-2 font-mono text-[11px] text-cream/70">
      <span>{{ fmt(currentTime) }}</span>
      <input
        type="range"
        min="0"
        :max="duration || 0"
        :value="currentTime"
        @input="onSeek"
        class="flex-1 accent-amber h-1"
      />
      <span>{{ fmt(duration) }}</span>
    </div>

    <div class="flex items-center justify-between">
      <!-- Transport buttons -->
      <div class="flex items-center gap-3">
        <button
          @click="emit('prev')"
          aria-label="Rewind"
          class="w-10 h-10 rounded-full bg-wood border-2 border-brass/70 text-cream shadow-knob active:translate-y-[2px] active:shadow-none transition-transform"
        >
          ⏮
        </button>

        <button
          @click="emit('toggle')"
          :aria-label="isPlaying ? 'Pause' : 'Play'"
          class="w-14 h-14 rounded-full bg-brass text-wood-dark text-xl font-bold shadow-knob active:translate-y-[2px] active:shadow-none transition-transform"
        >
          {{ isPlaying ? "❚❚" : "▶" }}
        </button>

        <button
          @click="emit('next')"
          aria-label="Skip"
          class="w-10 h-10 rounded-full bg-wood border-2 border-brass/70 text-cream shadow-knob active:translate-y-[2px] active:shadow-none transition-transform"
        >
          ⏭
        </button>
      </div>

      <!-- Volume knob -->
      <div class="flex items-center gap-2">
        <span class="font-mono text-[10px] text-cream/60 uppercase">Vol</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="volume"
          @input="onVolume"
          class="w-20 accent-amber h-1"
        />
      </div>
    </div>

    <!-- Playback speed -->
    <div class="flex items-center justify-center gap-1.5">
      <span class="font-mono text-[9px] text-cream/40 uppercase mr-1"
        >Speed</span
      >
      <button
        v-for="speed in SPEEDS"
        :key="speed"
        @click="emit('speed', speed)"
        class="text-[10px] font-mono px-2 py-1 rounded border transition-colors"
        :class="
          speed === playbackRate
            ? 'bg-amber text-wood-dark border-amber'
            : 'bg-transparent text-cream/50 border-brass/30'
        "
      >
        {{ speed }}x
      </button>
    </div>
  </div>
</template>
