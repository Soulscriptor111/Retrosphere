<script setup>
import TapeDeck from "./TapeDeck.vue";
import VUMeter from "./VUMeter.vue";
import Controls from "./Controls.vue";

defineProps({
  isPlaying: Boolean,
  levels: Array,
  currentSong: Object,
  volume: Number,
  currentTime: Number,
  duration: Number,
  playbackRate: Number,
});

defineEmits(["toggle", "next", "prev", "seek", "volume", "speed"]);
</script>

<template>
  <div
    class="relative mx-auto w-full max-w-md rounded-2xl p-5 sm:p-6"
    style="
      background: linear-gradient(
        160deg,
        #5a4432 0%,
        #4a3728 55%,
        #3d2c1f 100%
      );
    "
  >
    <span
      class="absolute top-2 left-2 w-4 h-4 rounded-full bg-brass shadow-knob"
    ></span>
    <span
      class="absolute top-2 right-2 w-4 h-4 rounded-full bg-brass shadow-knob"
    ></span>
    <span
      class="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-brass shadow-knob"
    ></span>
    <span
      class="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-brass shadow-knob"
    ></span>

    <div class="text-center mb-4">
      <h1 class="font-display text-2xl text-amber tracking-wide">
        RetroSphere
      </h1>
      <p class="font-mono text-[10px] text-cream/40 uppercase tracking-[0.2em]">
        The Emotional Radio
      </p>
    </div>

    <div
      class="bg-wood-dark/50 rounded-lg mb-4 flex items-center justify-center"
    >
      <VUMeter :levels="levels" />
    </div>

    <TapeDeck
      :is-playing="isPlaying"
      :title="currentSong?.title"
      :artist="currentSong?.artist"
    />

    <div class="mt-4">
      <Controls
        :is-playing="isPlaying"
        :volume="volume"
        :current-time="currentTime"
        :duration="duration"
        :playback-rate="playbackRate"
        @toggle="$emit('toggle')"
        @next="$emit('next')"
        @prev="$emit('prev')"
        @seek="(v) => $emit('seek', v)"
        @volume="(v) => $emit('volume', v)"
        @speed="(v) => $emit('speed', v)"
      />
    </div>
  </div>
</template>
