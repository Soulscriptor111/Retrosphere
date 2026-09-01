<script setup>
import { ref } from 'vue'

const emit = defineEmits(['files'])
const isDragging = ref(false)
const inputRef = ref(null)
const debugInfo = ref(null)

const ACCEPTED = ['audio/mpeg', 'audio/flac', 'audio/wav', 'audio/x-wav', 'audio/x-flac']
const AUDIO_EXT = /\.(mp3|flac|wav|m4a|aac|ogg|opus|wma)$/i
const HAS_ANY_EXT = /\.[a-z0-9]+$/i

function filterAudio(fileList) {
  return Array.from(fileList).filter((f) => {
    if (ACCEPTED.includes(f.type) || f.type.startsWith('audio/')) return true
    if (AUDIO_EXT.test(f.name)) return true
    // No MIME type AND no extension at all -- Android sometimes fails to
    // report either for files it doesn't recognize, even when they're
    // valid audio (this is exactly the case that was silently blocking
    // uploads). We can't prove it isn't audio, so let it through.
    if (!f.type && !HAS_ANY_EXT.test(f.name)) return true
    return false
  })
}

function reportSelection(rawFiles, matchedFiles) {
  if (matchedFiles.length > 0) {
    debugInfo.value = null
    return
  }
  if (rawFiles.length === 0) {
    debugInfo.value = 'No files were selected.'
  } else {
    const details = Array.from(rawFiles)
      .map((f) => `"${f.name}" (type: "${f.type || 'none'}")`)
      .join(', ')
    debugInfo.value = `Selected but rejected -- none matched an accepted audio type: ${details}`
  }
}

function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const raw = e.dataTransfer.files
  const files = filterAudio(raw)
  reportSelection(raw, files)
  if (files.length) emit('files', files)
}

function onPick(e) {
  const raw = e.target.files
  const files = filterAudio(raw)
  reportSelection(raw, files)
  if (files.length) emit('files', files)
  e.target.value = ''
}
</script>

<template>
  <div>
    <p
      v-if="debugInfo"
      class="font-mono text-[10px] text-amber bg-wood-dark/60 border border-brass/30 rounded px-3 py-2 mb-2"
    >
      {{ debugInfo }}
    </p>
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
  </div>
</template>