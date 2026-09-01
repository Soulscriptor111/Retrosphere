<script setup>
import { onMounted, ref, computed } from "vue";
import RadioCabinet from "./components/RadioCabinet.vue";
import FileUpload from "./components/FileUpload.vue";
import LyricsPaper from "./components/LyricsPaper.vue";
import LyricsPresentation from "./components/LyricsPresentation.vue";
import { useAudioEngine } from "./composables/useAudioEngine";
import { useLibrary } from "./composables/useLibrary";
import { extractMetadata } from "./composables/useMetadata";
import { fetchLyricsFromLrcLib } from "./composables/useLrcLib";

const engine = useAudioEngine();
const { songs, loadSongs, addSong, removeSong } = useLibrary();

const currentSongId = ref(null);
const currentSong = computed(
  () => songs.value.find((s) => s.id === currentSongId.value) || null,
);
const currentIndex = computed(() =>
  songs.value.findIndex((s) => s.id === currentSongId.value),
);
const presenting = ref(false);
const uploadError = ref(null);

onMounted(loadSongs);

async function handleFiles(files) {
  uploadError.value = null;
  for (const file of files) {
    try {
      const meta = await extractMetadata(file);
      const lyricsResult = await fetchLyricsFromLrcLib(meta.title, meta.artist);

      const song = {
        id: crypto.randomUUID(),
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        year: meta.year,
        genre: meta.genre,
        duration: meta.duration,
        file,
        coverArt: meta.coverArt,
        lyrics: lyricsResult?.lyrics || "",
        lrcLines: lyricsResult?.lrcLines || [],
        playCount: 0,
        uploadDate: new Date().toISOString(),
      };
      await addSong(song);
    } catch (e) {
      console.error("Upload failed for", file.name, e);
      uploadError.value = `Failed to add "${file.name}": ${e.message || e}`;
    }
  }
}

function playSong(id) {
  const song = songs.value.find((s) => s.id === id);
  if (!song) return;
  currentSongId.value = id;
  const url = URL.createObjectURL(song.file);
  engine.loadSource(url);
  engine.play();
}

function togglePlay() {
  if (!currentSongId.value) {
    if (songs.value.length) playSong(songs.value[0].id);
    return;
  }
  engine.isPlaying.value ? engine.pause() : engine.play();
}

function next() {
  if (!songs.value.length) return;
  const idx = currentIndex.value;
  const nextIdx = idx === -1 ? 0 : (idx + 1) % songs.value.length;
  playSong(songs.value[nextIdx].id);
}

function prev() {
  if (!songs.value.length) return;
  const idx = currentIndex.value;
  const prevIdx =
    idx === -1 ? 0 : (idx - 1 + songs.value.length) % songs.value.length;
  playSong(songs.value[prevIdx].id);
}

async function deleteSong(id) {
  await removeSong(id);
  if (id === currentSongId.value) {
    engine.pause();
    currentSongId.value = null;
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-wood-dark flex flex-col lg:h-screen lg:grid lg:grid-cols-2 lg:overflow-hidden"
  >
    <div
      class="flex flex-col items-center justify-center gap-3 px-4 py-6 min-h-screen lg:min-h-0 lg:h-screen lg:overflow-y-auto"
    >
      <RadioCabinet
        :is-playing="engine.isPlaying.value"
        :levels="engine.levels.value"
        :current-song="currentSong"
        :volume="engine.volume.value"
        :current-time="engine.currentTime.value"
        :duration="engine.duration.value"
        :playback-rate="engine.playbackRate.value"
        @toggle="togglePlay"
        @next="next"
        @prev="prev"
        @seek="engine.seek"
        @volume="engine.setVolume"
        @speed="engine.setPlaybackRate"
      />

      <div class="w-full max-w-md space-y-2">
        <LyricsPaper
          :lrc-lines="currentSong?.lrcLines || []"
          :plain-lyrics="currentSong?.lyrics || ''"
          :current-time="engine.currentTime.value"
          :has-song="!!currentSong"
          class="max-h-64 lg:max-h-96"
        />
        <div v-if="currentSong" class="flex justify-end px-1">
          <button
            @click="presenting = true"
            class="font-mono text-[10px] uppercase tracking-wide text-brass/70 border border-brass/30 rounded px-2 py-1"
          >
            Present ⤢
          </button>
        </div>
      </div>
    </div>

    <div
      class="flex flex-col items-center gap-6 px-4 py-8 lg:h-screen lg:overflow-y-auto lg:border-l lg:border-brass/10"
    >
      <div class="w-full max-w-md">
        <p
          v-if="uploadError"
          class="font-mono text-[11px] text-red-300 bg-red-900/30 border border-red-500/40 rounded px-3 py-2 mb-2"
        >
          {{ uploadError }}
        </p>
        <FileUpload @files="handleFiles" />
      </div>

      <div v-if="songs.length" class="w-full max-w-md">
        <h2 class="font-display text-cream/80 text-sm mb-2 px-1">Your tapes</h2>
        <ul class="space-y-1">
          <li
            v-for="song in songs"
            :key="song.id"
            @click="playSong(song.id)"
            class="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ease-organic"
            :class="
              song.id === currentSongId
                ? 'bg-brass/20 border border-brass/50'
                : 'bg-wood/40 hover:bg-wood/60'
            "
          >
            <div class="min-w-0">
              <p class="font-body text-cream text-sm truncate">
                {{ song.title }}
              </p>
              <p class="font-mono text-[10px] text-cream/50 truncate">
                {{ song.artist }}
              </p>
            </div>
            <button
              @click.stop="deleteSong(song.id)"
              aria-label="Remove tape"
              class="text-cream/40 hover:text-amber text-xs font-mono px-2"
            >
              ✕
            </button>
          </li>
        </ul>
      </div>

      <p
        v-else
        class="font-mono text-[11px] text-cream/30 text-center max-w-md"
      >
        No tapes yet -- upload a song to get started.
      </p>
    </div>
  </div>

  <LyricsPresentation
    v-if="presenting && currentSong"
    :lrc-lines="currentSong.lrcLines || []"
    :plain-lyrics="currentSong.lyrics || ''"
    :current-time="engine.currentTime.value"
    :title="currentSong.title"
    :artist="currentSong.artist"
    :is-playing="engine.isPlaying.value"
    :get-audio-stream="engine.getAudioStream"
    @close="presenting = false"
    @toggle="togglePlay"
  />
</template>
