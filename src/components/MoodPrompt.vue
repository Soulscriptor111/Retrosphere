<script setup>
import { MOODS, greeting } from "../composables/useMood";

defineProps({ suggestedMood: String });
const emit = defineEmits(["pick"]);
</script>

<template>
  <div
    class="rounded-lg p-4 bg-wood-dark/40 border border-brass/20 text-center space-y-3"
  >
    <p class="font-display text-cream text-base">
      {{ greeting() }} How are you feeling?
    </p>
    <div class="flex flex-wrap justify-center gap-2">
      <button
        v-for="mood in MOODS"
        :key="mood"
        @click="emit('pick', mood)"
        class="text-[11px] font-mono uppercase px-3 py-1.5 rounded-full border transition-colors"
        :class="
          mood === suggestedMood
            ? 'bg-brass text-wood-dark border-brass'
            : 'bg-transparent text-cream/60 border-brass/30 hover:border-brass/60'
        "
      >
        {{ mood }}
      </button>
    </div>
    <p v-if="suggestedMood" class="font-mono text-[10px] text-cream/30">
      Suggested for right now: {{ suggestedMood }}
    </p>
  </div>
</template>
