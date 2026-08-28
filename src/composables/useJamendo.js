// Free, no-OAuth-needed for reads. Register at devportal.jamendo.com
// to get a client_id -- Creative Commons tracks, legally streamable
// and downloadable, no visible-player restriction like YouTube has.
const JAMENDO_CLIENT_ID = "680103e5";
const BASE = "https://api.jamendo.com/v3.0";

// `search` (e.g. a country/region name) is optional free text layered
// on top of the mood/genre fuzzytags. Jamendo's catalog is thin for
// many regions, so callers should retry without `search` if this
// comes back empty rather than treating it as a dead end.
export async function searchJamendoTracks(
  spaceSeparatedTags,
  { limit = 5, search = "" } = {},
) {
  try {
    const params = new URLSearchParams({
      client_id: JAMENDO_CLIENT_ID,
      format: "json",
      limit: String(limit),
      fuzzytags: spaceSeparatedTags,
      vocalinstrumental: "vocal",
      order: "popularity_total",
      audioformat: "mp32",
      include: "musicinfo",
    });
    if (search) params.set("search", search);

    const res = await fetch(`${BASE}/tracks/?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || [])
      .filter((t) => t.name && t.artist_name)
      .map((t) => ({
        id: t.id,
        title: t.name,
        artist: t.artist_name,
        album: t.album_name,
        duration: t.duration,
        audioUrl: t.audio,
        coverArt: t.album_image || t.image,
        license: t.license_ccurl,
      }));
  } catch (e) {
    console.warn("Jamendo search failed:", e.message);
    return [];
  }
}
