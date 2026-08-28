import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { albums, presets, albumsByGenre } from '../data/albums.js'

export const TRACK_DURATION = 180 // 3 simulated minutes, in seconds
export const LOAD_DURATION_MS = 1000 // "mechanical" tape-load time
export const EJECT_DURATION_MS = 650 // spring-eject animation time

export const usePlayerStore = defineStore('player', () => {
  // ── Library ────────────────────────────────────────────────
  const library = ref(albums)

  // ── Tape deck ──────────────────────────────────────────────
  const currentAlbum = ref(null)
  const currentTrackIndex = ref(0)
  const isLoading = ref(false)
  const isEjecting = ref(false)
  const isPlaying = ref(false)
  const progress = ref(0) // seconds elapsed in current track

  // ── Tuner ──────────────────────────────────────────────────
  const frequency = ref(88.0)
  const activePresetId = ref(null)
  const isTuning = ref(false)

  // ── Control panel ──────────────────────────────────────────
  const volume = ref(55)
  const bass = ref(50)
  const treble = ref(50)

  let progressTimer = null

  const currentTrack = computed(() =>
    currentAlbum.value ? currentAlbum.value.tracks[currentTrackIndex.value] : null
  )
  const isStandby = computed(() => !currentAlbum.value && !isPlaying.value)
  const trackCount = computed(() => (currentAlbum.value ? currentAlbum.value.tracks.length : 0))

  function clearProgressTimer() {
    if (progressTimer) {
      clearInterval(progressTimer)
      progressTimer = null
    }
  }

  function startProgressTimer() {
    clearProgressTimer()
    progressTimer = setInterval(() => {
      if (progress.value >= TRACK_DURATION) {
        skip()
        return
      }
      progress.value += 1
    }, 1000)
  }

  function play() {
    if (!currentAlbum.value || isLoading.value) return
    isPlaying.value = true
    startProgressTimer()
  }

  function pause() {
    isPlaying.value = false
    clearProgressTimer()
  }

  function togglePlay() {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  function skip() {
    if (!currentAlbum.value) return
    currentTrackIndex.value = (currentTrackIndex.value + 1) % trackCount.value
    progress.value = 0
  }

  function rewind() {
    if (!currentAlbum.value) return
    if (progress.value > 3) {
      progress.value = 0
      return
    }
    currentTrackIndex.value =
      (currentTrackIndex.value - 1 + trackCount.value) % trackCount.value
    progress.value = 0
  }

  /**
   * Loads an album into the tape deck with a ~1s mechanical load sequence.
   * If `autoplay` is true, playback resumes once loading completes —
   * used when switching stations mid-play.
   */
  function loadAlbum(album, { autoplay = false } = {}) {
    if (!album) return
    pause()
    isLoading.value = true
    currentTrackIndex.value = 0
    progress.value = 0
    window.setTimeout(() => {
      currentAlbum.value = album
      isLoading.value = false
      if (autoplay) play()
    }, LOAD_DURATION_MS)
  }

  function selectAlbum(album) {
    activePresetId.value = null
    loadAlbum(album, { autoplay: false })
  }

  function setFrequency(value) {
    frequency.value = Math.min(108.0, Math.max(88.0, Math.round(value * 10) / 10))
  }

  function selectPreset(presetId) {
    const preset = presets.find((p) => p.id === presetId)
    if (!preset) return
    const wasPlaying = isPlaying.value
    activePresetId.value = presetId
    setFrequency(preset.frequency)
    const stationAlbums = albumsByGenre(preset.genre)
    const nextAlbum = stationAlbums[0]
    if (nextAlbum) {
      loadAlbum(nextAlbum, { autoplay: wasPlaying })
    }
  }

  /**
   * Manual drag/keyboard tuning. Snaps into a preset's station when the
   * dial lands close enough to it (like catching a signal on a real FM
   * dial); otherwise the dial just drifts through open static.
   */
  function tuneManually(value) {
    setFrequency(value)
    const snapped = presets.find((p) => Math.abs(p.frequency - frequency.value) <= 0.3)
    if (snapped) {
      if (activePresetId.value !== snapped.id) {
        selectPreset(snapped.id)
      }
    } else {
      activePresetId.value = null
    }
  }

  function setVolume(value) {
    volume.value = Math.min(100, Math.max(0, Math.round(value)))
  }

  function setBass(value) {
    bass.value = Math.min(100, Math.max(0, Math.round(value)))
  }

  function setTreble(value) {
    treble.value = Math.min(100, Math.max(0, Math.round(value)))
  }

  function eject() {
    if (isEjecting.value || !currentAlbum.value) return
    pause()
    isEjecting.value = true
    window.setTimeout(() => {
      currentAlbum.value = null
      currentTrackIndex.value = 0
      progress.value = 0
      activePresetId.value = null
      isEjecting.value = false
    }, EJECT_DURATION_MS)
  }

  return {
    // state
    library,
    currentAlbum,
    currentTrackIndex,
    isLoading,
    isEjecting,
    isPlaying,
    progress,
    frequency,
    activePresetId,
    isTuning,
    volume,
    bass,
    treble,
    // computed
    currentTrack,
    isStandby,
    trackCount,
    trackDuration: TRACK_DURATION,
    // actions
    play,
    pause,
    togglePlay,
    skip,
    rewind,
    selectAlbum,
    loadAlbum,
    setFrequency,
    tuneManually,
    selectPreset,
    setVolume,
    setBass,
    setTreble,
    eject,
  }
})
