import { parseLrc } from "./useLrcParser";

// Strip common junk that video-ripped files carry in their tags:
// "(Lyrics)", "(Official Video)", "[Channel Name]", "ft. X", etc.
function cleanText(s) {
  return (s || "")
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/ft\.?.*$/i, "")
    .replace(/feat\.?.*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function tryGet(trackName, artistName) {
  if (!trackName || !artistName) return null;
  try {
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
    });
    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.syncedLyrics)
      return { lrcLines: parseLrc(data.syncedLyrics), lyrics: "" };
    if (data.plainLyrics) return { lrcLines: [], lyrics: data.plainLyrics };
    return null;
  } catch {
    return null;
  }
}

async function trySearch(query) {
  if (!query) return null;
  try {
    const res = await fetch(
      `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`,
    );
    if (!res.ok) return null;
    const results = await res.json();
    const top = results?.[0];
    if (!top) return null;
    if (top.syncedLyrics)
      return { lrcLines: parseLrc(top.syncedLyrics), lyrics: "" };
    if (top.plainLyrics) return { lrcLines: [], lyrics: top.plainLyrics };
    return null;
  } catch {
    return null;
  }
}

export async function fetchLyricsFromLrcLib(title, artist) {
  const cleanTitle = cleanText(title);
  const cleanArtist = cleanText(artist);

  // 1. As tagged  2. Cleaned  3. Swapped (tags are sometimes reversed)
  return (
    (await tryGet(title, artist)) ||
    (await tryGet(cleanTitle, cleanArtist)) ||
    (await tryGet(cleanArtist, cleanTitle)) ||
    (await trySearch(cleanTitle || cleanArtist))
  );
}
