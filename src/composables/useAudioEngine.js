import { ref, shallowRef } from 'vue'

export function useAudioEngine() {
  const audio = new Audio()
  audio.preload = 'metadata'

  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.8)
  const levels = ref(new Array(16).fill(0)) // bars for VU meter

  let audioCtx = null
  let analyser = null
  let sourceNode = null
  let dataArray = null
  let rafId = null

  audio.volume = volume.value

  function ensureAudioGraph() {
    if (audioCtx) return
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    sourceNode = audioCtx.createMediaElementSource(audio)
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 64
    dataArray = new Uint8Array(analyser.frequencyBinCount)
    sourceNode.connect(analyser)
    analyser.connect(audioCtx.destination)
  }

  function tick() {
    if (analyser) {
      analyser.getByteFrequencyData(dataArray)
      const bars = 16
      const step = Math.floor(dataArray.length / bars)
      const next = []
      for (let i = 0; i < bars; i++) {
        next.push(dataArray[i * step] / 255)
      }
      levels.value = next
    }
    currentTime.value = audio.currentTime
    rafId = requestAnimationFrame(tick)
  }

  function loadSource(objectUrl) {
    audio.src = objectUrl
  }

  async function play() {
    ensureAudioGraph()
    if (audioCtx.state === 'suspended') await audioCtx.resume()
    await audio.play()
    isPlaying.value = true
    if (!rafId) tick()
  }

  function pause() {
    audio.pause()
    isPlaying.value = false
  }

  function seek(time) {
    audio.currentTime = time
  }

  function setVolume(v) {
    volume.value = v
    audio.volume = v
  }

  audio.addEventListener('loadedmetadata', () => {
    duration.value = audio.duration
  })
  audio.addEventListener('ended', () => {
    isPlaying.value = false
    levels.value = new Array(16).fill(0)
  })

  function destroy() {
    if (rafId) cancelAnimationFrame(rafId)
    audio.pause()
  }

  return {
    audio: shallowRef(audio),
    isPlaying,
    currentTime,
    duration,
    volume,
    levels,
    loadSource,
    play,
    pause,
    seek,
    setVolume,
    destroy,
  }
}
