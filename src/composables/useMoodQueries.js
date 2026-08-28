// Jamendo's tag params expect space-separated tags (their docs show
// fuzzytags=groove+rock, where + is just URL-encoded space) -- NOT
// comma-separated. Comma-joined tags were being read as one garbled
// tag, which is why almost nothing matched before.
export const MOOD_QUERIES = {
  happy: "happy pop",
  sad: "sad melancholic",
  nostalgic: "nostalgic folk",
  calm: "calm relaxing",
  energetic: "energetic dance",
  romantic: "romantic love",
  dreamy: "dreamy chillout",
  angry: "aggressive rock",
};

export function queryForMood(mood) {
  return MOOD_QUERIES[mood] || mood;
}
