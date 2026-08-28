import { ref } from "vue";

const KEY = "retrosphere-preferences";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw
      ? JSON.parse(raw)
      : { favoriteMoods: [], lastMood: null, sessionHistory: [] };
  } catch {
    return { favoriteMoods: [], lastMood: null, sessionHistory: [] };
  }
}

export function usePreferences() {
  const prefs = ref(load());

  function persist() {
    localStorage.setItem(KEY, JSON.stringify(prefs.value));
  }

  function recordMood(mood, songId) {
    prefs.value.lastMood = mood;
    prefs.value.sessionHistory.push({
      mood,
      songId,
      timestamp: new Date().toISOString(),
    });
    // keep last 50 entries so this doesn't grow forever
    if (prefs.value.sessionHistory.length > 50) {
      prefs.value.sessionHistory = prefs.value.sessionHistory.slice(-50);
    }
    // bump favorite moods by frequency
    const counts = {};
    for (const h of prefs.value.sessionHistory) {
      counts[h.mood] = (counts[h.mood] || 0) + 1;
    }
    prefs.value.favoriteMoods = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([m]) => m);
    persist();
  }

  return { prefs, recordMood };
}
