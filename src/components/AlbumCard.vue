<script setup>
import { computed } from 'vue'

const props = defineProps({
  album: { type: Object, required: true },
  isActive: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])

const initials = computed(() =>
  props.album.title
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
)

function handleSelect() {
  emit('select', props.album)
}

function handleKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handleSelect()
  }
}
</script>

<template>
  <button
    type="button"
    class="group relative flex w-full flex-col rounded-lg text-left transition-transform duration-200 ease-out hover:-translate-y-2 hover:scale-[1.02] focus-visible:-translate-y-2 focus-visible:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-wood-dark"
    :aria-label="`Load ${album.title} by ${album.artist}, ${album.year}`"
    :aria-pressed="isActive"
    @click="handleSelect"
    @keydown="handleKeydown"
  >
    <span
      class="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg shadow-md ring-1 ring-black/30 transition-shadow duration-200 group-hover:shadow-xl"
      :class="isActive ? 'ring-2 ring-brass shadow-glow' : ''"
      :style="{ background: album.coverGradient }"
    >
      <span
        class="pointer-events-none absolute inset-0 rounded-lg opacity-0 shadow-[0_0_0_2px_rgba(201,168,76,0.9)] transition-opacity duration-200 group-hover:opacity-100"
        aria-hidden="true"
      ></span>
      <span class="pointer-events-none absolute inset-0 bg-black/10 mix-blend-multiply" aria-hidden="true"></span>
      <span class="relative font-display text-3xl font-semibold tracking-wide text-cream/90 drop-shadow-md sm:text-4xl">
        {{ initials }}
      </span>
      <span
        v-if="isActive"
        class="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-amber-glow shadow-glow"
        aria-hidden="true"
      ></span>
    </span>

    <span class="mt-2 truncate font-display text-sm font-semibold text-cream sm:text-base">
      {{ album.title }}
    </span>
    <span class="truncate font-sans text-xs text-cream/60 sm:text-sm">{{ album.artist }}</span>
    <span class="font-mono text-[0.65rem] text-brass/70 sm:text-xs">{{ album.year }}</span>
  </button>
</template>
