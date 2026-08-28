// Tries to read ID3/FLAC tags with music-metadata-browser.
// Falls back to filename-based guesses if the package isn't installed yet,
// so upload still works before you run:
//   npm install music-metadata-browser

export async function extractMetadata(file) {
  const fallback = () => {
    const name = file.name.replace(/\.[^/.]+$/, '')
    const parts = name.split(' - ')
    return {
      title: parts.length > 1 ? parts.slice(1).join(' - ').trim() : name,
      artist: parts.length > 1 ? parts[0].trim() : 'Unknown Artist',
      album: 'Unknown Album',
      year: null,
      genre: 'Unknown',
      duration: 0,
      coverArt: null,
    }
  }

  try {
    const mm = await import('music-metadata-browser')
    const metadata = await mm.parseBlob(file)
    const picture = metadata.common.picture?.[0]
    let coverArt = null
    if (picture) {
      const blob = new Blob([picture.data], { type: picture.format })
      coverArt = URL.createObjectURL(blob)
    }
    return {
      title: metadata.common.title || fallback().title,
      artist: metadata.common.artist || 'Unknown Artist',
      album: metadata.common.album || 'Unknown Album',
      year: metadata.common.year || null,
      genre: metadata.common.genre?.[0] || 'Unknown',
      duration: metadata.format.duration || 0,
      coverArt,
    }
  } catch (e) {
    console.warn('music-metadata-browser unavailable, using filename fallback:', e.message)
    return fallback()
  }
}
