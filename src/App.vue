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
const { songs, loadSongs, addSong, removeSong, updateSong } = useLibrary();

const currentSongId = ref(null);
const currentSong = computed(
  () => songs.value.find((s) => s.id === currentSongId.value) || null,
);
const currentIndex = computed(() =>
  songs.value.findIndex((s) => s.id === currentSongId.value),
);
const presenting = ref(false);
const uploadError = ref(null);

const editingId = ref(null);
const editTitle = ref("");
const editArtist = ref("");
const isRefetchingLyrics = ref(false);
const editError = ref(null);

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

function startEditing(song) {
  editingId.value = song.id;
  editTitle.value = song.title;
  editArtist.value = song.artist;
  editError.value = null;
}

function cancelEditing() {
  editingId.value = null;
  editError.value = null;
}

async function saveEditing(song) {
  const title = editTitle.value.trim();
  const artist = editArtist.value.trim();
  if (!title || !artist) {
    editError.value = "Both title and artist are needed to look up lyrics.";
    return;
  }

  isRefetchingLyrics.value = true;
  editError.value = null;
  try {
    const lyricsResult = await fetchLyricsFromLrcLib(title, artist);
    await updateSong(song.id, {
      title,
      artist,
      lyrics: lyricsResult?.lyrics || "",
      lrcLines: lyricsResult?.lrcLines || [],
    });
    editingId.value = null;
  } catch (e) {
    editError.value = `Couldn't update: ${e.message || e}`;
  } finally {
    isRefetchingLyrics.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-wood-dark flex flex-col lg:h-screen lg:grid lg:grid-cols-2 lg:overflow-hidden"
  >
    <!-- Player pane: radio + lyrics -->
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

    <!-- Control pane: upload, library -->
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
            class="rounded-md transition-colors ease-organic"
            :class="
              song.id === currentSongId
                ? 'bg-brass/20 border border-brass/50'
                : 'bg-wood/40 hover:bg-wood/60'
            "
          >
            <div
              v-if="editingId !== song.id"
              @click="playSong(song.id)"
              class="flex items-center justify-between px-3 py-2 cursor-pointer"
            >
              <div class="min-w-0">
                <p class="font-body text-cream text-sm truncate">
                  {{ song.title }}
                </p>
                <p class="font-mono text-[10px] text-cream/50 truncate">
                  {{ song.artist }}
                </p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  @click.stop="startEditing(song)"
                  aria-label="Edit title and artist"
                  class="text-cream/40 hover:text-amber text-xs font-mono px-2"
                >
                  ✎
                </button>
                <button
                  @click.stop="deleteSong(song.id)"
                  aria-label="Remove tape"
                  class="text-cream/40 hover:text-amber text-xs font-mono px-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div v-else class="px-3 py-3 space-y-2" @click.stop>
              <input
                v-model="editTitle"
                type="text"
                placeholder="Title"
                class="w-full text-[12px] font-mono rounded p-2 bg-wood-dark/50 text-cream placeholder:text-cream/30 border border-brass/30"
              />
              <input
                v-model="editArtist"
                type="text"
                placeholder="Artist"
                class="w-full text-[12px] font-mono rounded p-2 bg-wood-dark/50 text-cream placeholder:text-cream/30 border border-brass/30"
              />
              <p v-if="editError" class="font-mono text-[10px] text-red-300">
                {{ editError }}
              </p>
              <p
                v-if="isRefetchingLyrics"
                class="font-mono text-[10px] text-cream/40"
              >
                Looking up lyrics for the corrected title/artist…
              </p>
              <div class="flex gap-2">
                <button
                  @click="saveEditing(song)"
                  :disabled="isRefetchingLyrics"
                  class="flex-1 font-mono text-[11px] uppercase py-1.5 rounded bg-brass text-wood-dark font-semibold disabled:opacity-50"
                >
                  Save &amp; find lyrics
                </button>
                <button
                  @click="cancelEditing"
                  class="font-mono text-[11px] uppercase py-1.5 px-3 rounded border border-brass/30 text-cream/60"
                >
                  Cancel
                </button>
              </div>
            </div>
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
