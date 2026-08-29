<script setup>
import { onMounted, ref, computed } from "vue";
import RadioCabinet from "./components/RadioCabinet.vue";
import FileUpload from "./components/FileUpload.vue";
import LyricsPaper from "./components/LyricsPaper.vue";
import VibePicker from "./components/VibePicker.vue";
import { useAudioEngine } from "./composables/useAudioEngine";
import { useLibrary } from "./composables/useLibrary";
import { extractMetadata } from "./composables/useMetadata";
import { songsMatchingMood, moodFromAudio } from "./composables/useMood";
import { usePreferences } from "./composables/usePreferences";
import { fetchLyricsFromLrcLib } from "./composables/useLrcLib";
import { analyzeAudio } from "./composables/useAudioAnalysis";
import { buildVibeQuery } from "./composables/useMoodQueries";
import { searchJamendoTracks } from "./composables/useJamendo";

const engine = useAudioEngine();
const { songs, loadSongs, addSong, removeSong, updateSong } = useLibrary();
const { recordMood } = usePreferences();

// Track the playing song by its stable id, never by array position --
// the songs array can reorder whenever it reloads from IndexedDB
// (e.g. right after adding new tapes), which was silently pointing
// an index-based "currentIndex" at the wrong song.
const currentSongId = ref(null);
const currentSong = computed(
  () => songs.value.find((s) => s.id === currentSongId.value) || null,
);
const currentIndex = computed(() =>
  songs.value.findIndex((s) => s.id === currentSongId.value),
);
const isFetchingMood = ref(false);

// Gate: show only the vibe picker first, like a landing page --
// the full radio/lyrics/library app appears only after a first pick.
const entered = ref(false);

onMounted(loadSongs);

async function handleFiles(files) {
  for (const file of files) {
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
      moodTags: [],
      moodAnalyzed: false,
      lyrics: lyricsResult?.lyrics || "",
      lrcLines: lyricsResult?.lrcLines || [],
      playCount: 0,
      uploadDate: new Date().toISOString(),
      source: "local",
    };
    await addSong(song);

    analyzeAudio(file).then(({ bpm, energy, analyzed }) => {
      const moodTags = moodFromAudio(bpm, energy);
      updateSong(song.id, { moodTags, moodAnalyzed: analyzed, bpm });
    });
  }
}

// Plays a song by id -- the one and only way playback should be
// triggered, so currentSongId and the actual audio never drift apart.
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

// The system fetches -- the user only ever names mood/genre/country.
// Also doubles as the gate: the first call flips `entered` so the
// full app appears, whether triggered from the gate screen or later
// from the control pane for a fresh pick.
async function pickVibe({ mood, genre, country }) {
  entered.value = true;

  const localMatches = songsMatchingMood(songs.value, mood);
  if (localMatches.length) {
    const pick = localMatches[Math.floor(Math.random() * localMatches.length)];
    playSong(pick.id);
    recordMood(mood, pick.id);
    return;
  }
  await fetchVibeSongsFromJamendo({ mood, genre, country });
}

// Fetches up to 5 matching tracks and adds ALL of them to the library
// (not just the one that ends up playing) -- picking a vibe should
// stock the tapes, not hand back a single song each time.
async function fetchVibeSongsFromJamendo({ mood, genre, country }) {
  isFetchingMood.value = true;
  try {
    const tags = buildVibeQuery({ mood, genre });

    let results = await searchJamendoTracks(tags, {
      limit: 5,
      search: country,
    });
    if (!results.length && country) {
      results = await searchJamendoTracks(tags, { limit: 5 });
    }
    if (!results.length) return;

    const addedSongs = [];
    for (const track of results) {
      try {
        const audioRes = await fetch(track.audioUrl);
        const blob = await audioRes.blob();
        const file = new File([blob], `${track.title}.mp3`, {
          type: "audio/mpeg",
        });
        const lyricsResult = await fetchLyricsFromLrcLib(
          track.title,
          track.artist,
        );

        const song = {
          id: crypto.randomUUID(),
          title: track.title,
          artist: track.artist,
          album: track.album || "Unknown Album",
          year: null,
          genre: genre || "Unknown",
          duration: track.duration,
          file,
          coverArt: track.coverArt,
          moodTags: [mood],
          moodAnalyzed: false,
          lyrics: lyricsResult?.lyrics || "",
          lrcLines: lyricsResult?.lrcLines || [],
          playCount: 0,
          uploadDate: new Date().toISOString(),
          source: "jamendo",
          country: country || null,
        };
        await addSong(song);
        addedSongs.push(song);

        analyzeAudio(file).then(({ bpm, energy, analyzed }) => {
          const merged = [...new Set([mood, ...moodFromAudio(bpm, energy)])];
          updateSong(song.id, {
            moodTags: merged,
            moodAnalyzed: analyzed,
            bpm,
          });
        });
      } catch (e) {
        console.warn("Skipping one Jamendo track (fetch failed):", e.message);
      }
    }

    if (addedSongs.length) {
      const toPlay = addedSongs[Math.floor(Math.random() * addedSongs.length)];
      playSong(toPlay.id);
      recordMood(mood, toPlay.id);
    }
  } finally {
    isFetchingMood.value = false;
  }
}
</script>

<template>
  <!-- Gate screen: vibe picker only, like a landing page -->
  <div
    v-if="!entered"
    class="min-h-screen bg-wood-dark flex flex-col items-center justify-center px-4 py-8"
  >
    <h1 class="font-display text-3xl text-amber tracking-wide mb-1">
      RetroSphere
    </h1>
    <p
      class="font-mono text-[10px] text-cream/40 uppercase tracking-[0.2em] mb-6"
    >
      The Emotional Radio
    </p>
    <div class="w-full max-w-md">
      <VibePicker @search="pickVibe" />
      <p
        v-if="isFetchingMood"
        class="font-mono text-[10px] text-cream/40 text-center mt-2"
      >
        Finding something for that vibe…
      </p>
    </div>
  </div>

  <!-- Main app: appears after the first vibe pick -->
  <div
    v-else
    class="min-h-screen bg-wood-dark flex flex-col lg:h-screen lg:grid lg:grid-cols-2 lg:overflow-hidden"
  >
    <!-- Player pane: radio + lyrics, sized to fit the screen without extra scroll -->
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
        @toggle="togglePlay"
        @next="next"
        @prev="prev"
        @seek="engine.seek"
        @volume="engine.setVolume"
      />

      <div class="w-full max-w-md space-y-2">
        <LyricsPaper
          :lrc-lines="currentSong?.lrcLines || []"
          :plain-lyrics="currentSong?.lyrics || ''"
          :current-time="engine.currentTime.value"
          :has-song="!!currentSong"
          class="max-h-64 lg:max-h-96"
        />
        <p v-if="currentSong" class="font-mono text-[10px] text-cream/40 px-1">
          <span
            v-if="!currentSong.moodAnalyzed && !currentSong.moodTags?.length"
          >
            Analyzing mood…
          </span>
          <span v-else-if="currentSong.moodTags?.length">
            Mood: {{ currentSong.moodTags.join(", ") }}
            <span v-if="currentSong.source === 'jamendo'" class="text-brass/60"
              >· via Jamendo</span
            >
          </span>
        </p>
      </div>
    </div>

    <!-- Control pane: vibe picker, upload, library -->
    <div
      class="flex flex-col items-center gap-6 px-4 py-8 lg:h-screen lg:overflow-y-auto lg:border-l lg:border-brass/10"
    >
      <div class="w-full max-w-md">
        <VibePicker @search="pickVibe" />
        <p
          v-if="isFetchingMood"
          class="font-mono text-[10px] text-cream/40 text-center mt-2"
        >
          Finding something for that vibe…
        </p>
      </div>

      <div class="w-full max-w-md">
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
        No tapes yet -- pick a vibe above, or upload a song.
      </p>
    </div>
  </div>
</template>
