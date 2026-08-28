// Parses standard LRC format: [mm:ss.xx]Lyric line
export function parseLrc(lrcText) {
  const lines = lrcText.split("\n");
  const timeTag = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  const result = [];
  for (const line of lines) {
    const tags = [...line.matchAll(timeTag)];
    if (!tags.length) continue;

    const text = line.replace(timeTag, "").trim();
    for (const tag of tags) {
      const [, min, sec, ms] = tag;
      const time =
        parseInt(min) * 60 +
        parseInt(sec) +
        (ms ? parseInt(ms.padEnd(3, "0")) / 1000 : 0);
      result.push({ time, text });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

// Finds the index of the currently active line for a given playback time
export function activeLrcIndex(lrcLines, currentTime) {
  if (!lrcLines?.length) return -1;
  let idx = -1;
  for (let i = 0; i < lrcLines.length; i++) {
    if (lrcLines[i].time <= currentTime) idx = i;
    else break;
  }
  return idx;
}
