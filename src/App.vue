<script setup>
import { onMounted, ref, computed } from "vue";
import RadioCabinet from "./components/RadioCabinet.vue";
import FileUpload from "./components/FileUpload.vue";
import LyricsPaper from "./components/LyricsPaper.vue";
import LyricsInput from "./components/LyricsInput.vue";
import MoodPrompt from "./components/MoodPrompt.vue";
import { useAudioEngine } from "./composables/useAudioEngine";
import { useLibrary } from "./composables/useLibrary";
import { extractMetadata } from "./composables/useMetadata";
import {
  timeOfDayMood,
  songsMatchingMood,
  moodFromAudio,
} from "./composables/useMood";
import { usePreferences } from "./composables/usePreferences";
import { fetchLyricsFromLrcLib } from "./composables/useLrcLib";
import { analyzeAudio } from "./composables/useAudioAnalysis";
import { queryForMood } from "./composables/useMoodQueries";
import { searchJamendoTracks } from "./composables/useJamendo";

const engine = useAudioEngine();
const { songs, loadSongs, addSong, removeSong, updateSong } = useLibrary();
const { recordMood } = usePreferences();

const currentIndex = ref(-1);
const currentSong = computed(() =>
  currentIndex.value >= 0 ? songs.value[currentIndex.value] : null,
);
const suggestedMood = computed(() => timeOfDayMood());
const isFetchingMood = ref(false);

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

function playAt(index) {
  const song = songs.value[index];
  if (!song) return;
  currentIndex.value = index;
  const url = URL.createObjectURL(song.file);
  engine.loadSource(url);
  engine.play();
}

function togglePlay() {
  if (currentIndex.value === -1) {
    if (songs.value.length) playAt(0);
    return;
  }
  engine.isPlaying.value ? engine.pause() : engine.play();
}

function next() {
  if (!songs.value.length) return;
  playAt((currentIndex.value + 1) % songs.value.length);
}

function prev() {
  if (!songs.value.length) return;
  playAt((currentIndex.value - 1 + songs.value.length) % songs.value.length);
}

async function deleteSong(id, index) {
  await removeSong(id);
  if (index === currentIndex.value) {
    engine.pause();
    currentIndex.value = -1;
  }
}

async function saveLyrics(patch) {
  if (!currentSong.value) return;
  await updateSong(currentSong.value.id, patch);
}

// The system fetches -- the user only ever names a mood.
async function pickMood(mood) {
  const localMatches = songsMatchingMood(songs.value, mood);
  if (localMatches.length) {
    const index = songs.value.indexOf(localMatches[0]);
    playAt(index);
    recordMood(mood, localMatches[0].id);
    return;
  }
  await fetchMoodSongFromJamendo(mood);
}

async function fetchMoodSongFromJamendo(mood) {
  isFetchingMood.value = true;
  try {
    const results = await searchJamendoTracks(queryForMood(mood), 5);
    if (!results.length) return;
    const track = results[Math.floor(Math.random() * results.length)];

    const audioRes = await fetch(track.audioUrl);
    const blob = await audioRes.blob();
    const file = new File([blob], `${track.title}.mp3`, { type: "audio/mpeg" });

    const lyricsResult = await fetchLyricsFromLrcLib(track.title, track.artist);

    const song = {
      id: crypto.randomUUID(),
      title: track.title,
      artist: track.artist,
      album: track.album || "Unknown Album",
      year: null,
      genre: "Unknown",
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
    };
    await addSong(song);

    const index = songs.value.findIndex((s) => s.id === song.id);
    playAt(index);
    recordMood(mood, song.id);

    analyzeAudio(file).then(({ bpm, energy, analyzed }) => {
      const merged = [...new Set([mood, ...moodFromAudio(bpm, energy)])];
      updateSong(song.id, { moodTags: merged, moodAnalyzed: analyzed, bpm });
    });
  } catch (e) {
    console.warn("Mood fetch from Jamendo failed:", e.message);
  } finally {
    isFetchingMood.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-wood-dark flex flex-col items-center px-4 py-8 gap-6"
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

    <div class="w-full max-w-md">
      <MoodPrompt :suggested-mood="suggestedMood" @pick="pickMood" />
      <p
        v-if="isFetchingMood"
        class="font-mono text-[10px] text-cream/40 text-center mt-2"
      >
        Finding something for that mood…
      </p>
    </div>

    <div v-if="currentSong" class="w-full max-w-md space-y-3">
      <LyricsPaper
        :lrc-lines="currentSong.lrcLines || []"
        :plain-lyrics="currentSong.lyrics || ''"
        :current-time="engine.currentTime.value"
      />
      <LyricsInput @save="saveLyrics" />

      <p class="font-mono text-[10px] text-cream/40 px-1">
        <span v-if="!currentSong.moodAnalyzed && !currentSong.moodTags?.length">
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

    <div class="w-full max-w-md">
      <FileUpload @files="handleFiles" />
    </div>

    <div v-if="songs.length" class="w-full max-w-md">
      <h2 class="font-display text-cream/80 text-sm mb-2 px-1">Your tapes</h2>
      <ul class="space-y-1">
        <li
          v-for="(song, i) in songs"
          :key="song.id"
          @click="playAt(i)"
          class="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ease-organic"
          :class="
            i === currentIndex
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
            @click.stop="deleteSong(song.id, i)"
            aria-label="Remove tape"
            class="text-cream/40 hover:text-amber text-xs font-mono px-2"
          >
            ✕
          </button>
        </li>
      </ul>
    </div>

    <p v-else class="font-mono text-[11px] text-cream/30 text-center max-w-md">
      No tapes yet. Upload a song above to hear the reels spin.
    </p>
  </div>
</template>
