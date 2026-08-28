<script setup>
import { ref } from "vue";
import { MOODS, greeting, timeOfDayMood } from "../composables/useMood";

const GENRES = [
  "pop",
  "rock",
  "hiphop",
  "electronic",
  "jazz",
  "reggae",
  "afrobeat",
  "gospel",
  "folk",
  "rnb",
];

const emit = defineEmits(["search"]);

const selectedMood = ref(timeOfDayMood());
const selectedGenre = ref("");
const country = ref("");

function pickMood(m) {
  selectedMood.value = m;
}
function pickGenre(g) {
  selectedGenre.value = selectedGenre.value === g ? "" : g;
}
function submit() {
  emit("search", {
    mood: selectedMood.value,
    genre: selectedGenre.value,
    country: country.value.trim(),
  });
}
</script>

<template>
  <div
    class="rounded-lg p-4 bg-wood-dark/40 border border-brass/20 space-y-4 w-full"
  >
    <p class="font-display text-cream text-base text-center">
      {{ greeting() }} What's the vibe?
    </p>

    <div>
      <p class="font-mono text-[10px] text-cream/40 uppercase mb-1">Mood</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="mood in MOODS"
          :key="mood"
          @click="pickMood(mood)"
          class="text-[11px] font-mono uppercase px-3 py-1.5 rounded-full border transition-colors"
          :class="
            mood === selectedMood
              ? 'bg-brass text-wood-dark border-brass'
              : 'bg-transparent text-cream/60 border-brass/30'
          "
        >
          {{ mood }}
        </button>
      </div>
    </div>

    <div>
      <p class="font-mono text-[10px] text-cream/40 uppercase mb-1">
        Type of song (optional)
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="genre in GENRES"
          :key="genre"
          @click="pickGenre(genre)"
          class="text-[11px] font-mono uppercase px-3 py-1.5 rounded-full border transition-colors"
          :class="
            genre === selectedGenre
              ? 'bg-amber text-wood-dark border-amber'
              : 'bg-transparent text-cream/60 border-brass/30'
          "
        >
          {{ genre }}
        </button>
      </div>
    </div>

    <div>
      <p class="font-mono text-[10px] text-cream/40 uppercase mb-1">
        Country / region (optional)
      </p>
      <input
        v-model="country"
        type="text"
        placeholder="e.g. Rwanda, Nigeria, USA"
        class="w-full text-[12px] font-mono rounded p-2 bg-wood-dark/40 text-cream placeholder:text-cream/30 border border-brass/20"
      />
      <p class="font-mono text-[9px] text-cream/30 mt-1">
        Coverage varies a lot by region -- if nothing matches, we'll widen the
        search automatically.
      </p>
    </div>

    <button
      @click="submit"
      class="w-full text-[12px] font-mono uppercase tracking-wide py-2 rounded bg-brass text-wood-dark font-semibold"
    >
      Find a song
    </button>
  </div>
</template>
