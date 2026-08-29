<script setup>
import { computed, watch, nextTick, ref } from 'vue'
import { activeLrcIndex } from '../composables/useLrcParser'

const props = defineProps({
  lrcLines: { type: Array, default: () => [] },
  plainLyrics: { type: String, default: '' },
  currentTime: { type: Number, default: 0 },
  hasSong: { type: Boolean, default: true },
})

const activeIndex = computed(() => activeLrcIndex(props.lrcLines, props.currentTime))
const hasSynced = computed(() => props.lrcLines.length > 0)

const containerRef = ref(null)
let lineRefs = []
function setLineRef(el, i) {
  if (el) lineRefs[i] = el
}

watch(
  () => props.lrcLines,
  () => {
    lineRefs = []
  }
)

watch(activeIndex, async (i) => {
  if (i < 0) return
  await nextTick()
  const container = containerRef.value
  const line = lineRefs[i]
  if (!container || !line) return

  const rawTarget = line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2
  const maxScroll = container.scrollHeight - container.clientHeight
  container.scrollTop = Math.max(0, Math.min(rawTarget, maxScroll))
})
</script>

<template>
  <div
    ref="containerRef"
    class="relative rounded-lg p-5 shadow-cabinet overflow-y-auto overscroll-contain font-mono text-[13px] leading-relaxed scroll-smooth"
    style="background: #e8d5b8; color: #3d2c1f"
  >
    <template v-if="hasSynced">
      <p
        v-for="(line, i) in lrcLines"
        :key="i"
        :ref="(el) => setLineRef(el, i)"
        class="transition-all duration-300 ease-organic py-0.5"
        :class="
          i === activeIndex
            ? 'text-wood-dark font-semibold scale-[1.03] origin-left'
            : 'text-wood-dark/40'
        "
      >
        {{ line.text || '♪' }}
      </p>
    </template>

    <template v-else-if="plainLyrics">
      <p class="whitespace-pre-line text-wood-dark/80">{{ plainLyrics }}</p>
    </template>

    <template v-else-if="!hasSong">
      <p class="text-wood-dark/40 italic text-center py-6 px-2">
        Pick a vibe to start the radio -- lyrics will appear here once something's playing.
      </p>
    </template>

    <template v-else>
      <p class="text-wood-dark/40 italic text-center py-6 px-2">
        No lyrics found automatically for this one.
      </p>
    </template>
  </div>
</template>