<script setup>
import { ref } from 'vue'

const emit = defineEmits(['files'])
const isDragging = ref(false)
const inputRef = ref(null)

const ACCEPTED = ['audio/mpeg', 'audio/flac', 'audio/wav', 'audio/x-wav', 'audio/x-flac']

function filterAudio(fileList) {
  return Array.from(fileList).filter(
    (f) => ACCEPTED.includes(f.type) || /\.(mp3|flac|wav)$/i.test(f.name)
  )
}

function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const files = filterAudio(e.dataTransfer.files)
  if (files.length) emit('files', files)
}

function onPick(e) {
  const files = filterAudio(e.target.files)
  if (files.length) emit('files', files)
  e.target.value = ''
}
</script>

<template>
  <div
    class="border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 ease-organic cursor-pointer"
    :class="isDragging ? 'border-amber bg-amber/10' : 'border-brass/40 bg-wood-dark/30'"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop="onDrop"
    @click="inputRef.click()"
  >
    <p class="font-display text-cream text-base">Slide a tape in</p>
    <p class="font-mono text-[11px] text-cream/50 mt-1">
      Drop MP3, FLAC, or WAV files here — or tap to browse
    </p>
    <input
      ref="inputRef"
      type="file"
      accept=".mp3,.flac,.wav,audio/*"
      multiple
      class="hidden"
      @change="onPick"
    />
  </div>
</template>
