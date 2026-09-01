// Client Credentials flow: app-only auth, no user login needed.
// Only used for metadata cleanup (title/artist/cover art/year) --
// Spotify's audio-features, recommendations, and full-track playback
// aren't available to new apps / non-Premium accounts (see Phase 4 notes).
//
// SECURITY NOTE: the client secret sits in this browser-side file.
// That's an accepted trade-off for a personal, non-deployed app only --
// never ship this build publicly with real credentials in it.
const SPOTIFY_CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID";
const SPOTIFY_CLIENT_SECRET = "YOUR_SPOTIFY_CLIENT_SECRET";

let cachedToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("Spotify auth failed");

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000; // refresh a bit early
  return cachedToken;
}

// Returns cleaned-up metadata for the closest match, or null if
// nothing found / the request fails -- callers should fall back to
// whatever metadata they already had.
export async function searchSpotifyMetadata(title, artist) {
  try {
    const token = await getSpotifyToken();
    const query = encodeURIComponent(`track:${title} artist:${artist}`);
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return null;

    const data = await res.json();
    const track = data.tracks?.items?.[0];
    if (!track) return null;

    return {
      title: track.name,
      artist: track.artists?.[0]?.name || artist,
      album: track.album?.name || null,
      year: track.album?.release_date
        ? track.album.release_date.slice(0, 4)
        : null,
      coverArt: track.album?.images?.[0]?.url || null,
      popularity: track.popularity, // 0-100, still available on track lookups
    };
  } catch (e) {
    console.warn(
      "Spotify metadata lookup failed, keeping original tags:",
      e.message,
    );
    return null;
  }
}
