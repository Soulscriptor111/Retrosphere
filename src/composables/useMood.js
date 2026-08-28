export const MOODS = [
  "happy",
  "sad",
  "nostalgic",
  "calm",
  "energetic",
  "romantic",
  "dreamy",
  "angry",
];

export function timeOfDayMood(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "calm";
  if (h >= 12 && h < 17) return "energetic";
  if (h >= 17 && h < 21) return "romantic";
  return "dreamy";
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "Good morning.";
  if (h >= 12 && h < 17) return "Good afternoon.";
  if (h >= 17 && h < 21) return "Good evening.";
  return "It's late.";
}

export function suggestSongs(songs, mood) {
  const matches = songs.filter((s) => (s.moodTags || []).includes(mood));
  return matches.length ? matches : songs;
}

// Strict version of suggestSongs -- returns [] instead of falling back
// to the whole library, so the caller knows when to fetch externally.
export function songsMatchingMood(songs, mood) {
  return songs.filter((s) => (s.moodTags || []).includes(mood));
}

// Heuristic mapping from estimated tempo + energy to mood tags.
// Approximate by nature -- tempo/energy alone can't capture everything
// a song means, but it needs no manual tagging and no external API.
export function moodFromAudio(bpm, energy) {
  const tempoTier =
    bpm < 85 ? "slow" : bpm < 115 ? "medium" : bpm < 140 ? "upbeat" : "fast";
  const energyTier = energy < 0.35 ? "low" : energy < 0.6 ? "medium" : "high";

  const table = {
    "slow-low": ["sad"],
    "slow-medium": ["dreamy"],
    "slow-high": ["romantic"],
    "medium-low": ["calm"],
    "medium-medium": ["nostalgic"],
    "medium-high": ["happy"],
    "upbeat-low": ["calm"],
    "upbeat-medium": ["happy"],
    "upbeat-high": ["energetic"],
    "fast-low": ["nostalgic"],
    "fast-medium": ["energetic"],
    "fast-high": ["angry"],
  };

  return table[`${tempoTier}-${energyTier}`] || ["calm"];
}
