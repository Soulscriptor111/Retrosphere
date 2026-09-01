<script setup>
import {
  computed,
  watch,
  nextTick,
  ref,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { activeLrcIndex } from "../composables/useLrcParser";
import { useLyricVideoRecorder } from "../composables/useLyricVideoRecorder";

const props = defineProps({
  lrcLines: { type: Array, default: () => [] },
  plainLyrics: { type: String, default: "" },
  currentTime: { type: Number, default: 0 },
  title: { type: String, default: "" },
  artist: { type: String, default: "" },
  isPlaying: Boolean,
  getAudioStream: { type: Function, required: true },
});
const emit = defineEmits(["close", "toggle"]);

const {
  isRecording,
  recordedUrl,
  recordedMimeType,
  error,
  startRecording,
  stopRecording,
} = useLyricVideoRecorder({ getAudioStream: props.getAudioStream });

const downloadName = computed(() =>
  recordedMimeType.value.includes("mp4")
    ? "retrosphere-lyric-video.mp4"
    : "retrosphere-lyric-video.webm",
);

function toggleRecording() {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording(() => ({
      lrcLines: props.lrcLines,
      plainLyrics: props.plainLyrics,
      currentTime: props.currentTime,
      title: props.title,
      artist: props.artist,
    }));
  }
}

const activeIndex = computed(() =>
  activeLrcIndex(props.lrcLines, props.currentTime),
);
const hasSynced = computed(() => props.lrcLines.length > 0);

const containerRef = ref(null);
let lineRefs = [];
function setLineRef(el, i) {
  if (el) lineRefs[i] = el;
}

watch(
  () => props.lrcLines,
  () => {
    lineRefs = [];
  },
);

watch(activeIndex, async (i) => {
  if (i < 0) return;
  await nextTick();
  const container = containerRef.value;
  const line = lineRefs[i];
  if (!container || !line) return;
  const rawTarget =
    line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2;
  const maxScroll = container.scrollHeight - container.clientHeight;
  container.scrollTop = Math.max(0, Math.min(rawTarget, maxScroll));
});

async function enterFullscreen() {
  try {
    await document.documentElement.requestFullscreen?.();
  } catch (e) {
    console.warn(
      "Fullscreen request failed (unsupported or blocked):",
      e.message,
    );
  }
}

function exitFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {});
  }
}

function close() {
  if (isRecording.value) stopRecording();
  exitFullscreen();
  emit("close");
}

onMounted(enterFullscreen);
onBeforeUnmount(exitFullscreen);
</script>

<template>
  <div class="fixed inset-0 z-50 bg-wood-dark flex flex-col">
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-brass/20"
    >
      <div class="min-w-0">
        <p class="font-display text-cream text-sm truncate">{{ title }}</p>
        <p class="font-mono text-[10px] text-brass/60 truncate">{{ artist }}</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="toggleRecording"
          :aria-label="isRecording ? 'Stop recording' : 'Record lyric video'"
          class="text-[10px] font-mono uppercase px-2.5 py-1.5 rounded border"
          :class="
            isRecording
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-transparent text-cream/60 border-brass/30'
          "
        >
          {{ isRecording ? "■ Stop" : "● Record" }}
        </button>
        <button
          @click="emit('toggle')"
          :aria-label="isPlaying ? 'Pause' : 'Play'"
          class="w-9 h-9 rounded-full bg-brass text-wood-dark font-bold"
        >
          {{ isPlaying ? "❚❚" : "▶" }}
        </button>
        <button
          @click="close"
          aria-label="Exit presentation"
          class="text-cream/60 text-xl px-2"
        >
          ✕
        </button>
      </div>
    </div>

    <div
      v-if="error"
      class="px-4 py-2 bg-red-900/40 text-red-200 text-[11px] font-mono"
    >
      {{ error }}
    </div>

    <div
      v-if="recordedUrl"
      class="px-4 py-3 bg-wood-dark/60 border-b border-brass/20 flex items-center justify-between gap-3"
    >
      <p class="font-mono text-[11px] text-cream/70">Recording ready</p>
      <a
        :href="recordedUrl"
        :download="downloadName"
        class="font-mono text-[11px] uppercase px-3 py-1.5 rounded bg-brass text-wood-dark font-semibold"
      >
        Download
      </a>
    </div>

    <div
      ref="containerRef"
      class="relative flex-1 overflow-y-auto overscroll-contain px-6 py-10 scroll-smooth"
    >
      <template v-if="hasSynced">
        <p
          v-for="(line, i) in lrcLines"
          :key="i"
          :ref="(el) => setLineRef(el, i)"
          class="text-center transition-all duration-300 ease-organic py-3 text-2xl sm:text-3xl"
          :class="
            i === activeIndex
              ? 'text-amber font-semibold scale-105'
              : 'text-cream/25'
          "
        >
          {{ line.text || "♪" }}
        </p>
      </template>

      <template v-else-if="plainLyrics">
        <p
          class="whitespace-pre-line text-cream/70 text-xl text-center leading-relaxed"
        >
          {{ plainLyrics }}
        </p>
      </template>

      <template v-else>
        <p class="text-cream/40 italic text-center text-lg py-10">
          No lyrics available for this one.
        </p>
      </template>
    </div>
  </div>
</template>
