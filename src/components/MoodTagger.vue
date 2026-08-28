<script setup>
import { MOODS } from "../composables/useMood";

const props = defineProps({
  activeTags: { type: Array, default: () => [] },
});
const emit = defineEmits(["toggle"]);

function isActive(mood) {
  return props.activeTags.includes(mood);
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="mood in MOODS"
      :key="mood"
      @click="emit('toggle', mood)"
      class="text-[10px] font-mono uppercase tracking-wide px-2.5 py-1 rounded-full border transition-colors"
      :class="
        isActive(mood)
          ? 'bg-amber text-wood-dark border-amber'
          : 'bg-transparent text-cream/50 border-brass/30'
      "
    >
      {{ mood }}
    </button>
  </div>
</template>
