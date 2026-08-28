// Jamendo's tag params expect space-separated tags (their docs show
// fuzzytags=groove+rock, where + is just URL-encoded space) -- NOT
// comma-separated.
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

// Combines mood + optional genre into one fuzzytags string for Jamendo.
// Country is handled separately (as a free-text 'search' param) since
// it isn't part of Jamendo's tag vocabulary.
export function buildVibeQuery({ mood, genre }) {
  const parts = [queryForMood(mood)];
  if (genre) parts.push(genre);
  return parts.join(" ");
}
