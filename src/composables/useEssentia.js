// Essentia is an actual research-grade MIR (music information retrieval)
// library, WASM-compiled to run in the browser -- a real BPM estimator
// and loudness analysis, not the custom heuristic this replaces.
// Loaded lazily so it doesn't slow down app startup.

let essentiaInstance = null;

async function getEssentia() {
  if (essentiaInstance) return essentiaInstance;
  const { Essentia, EssentiaWASM } = await import("essentia.js");
  essentiaInstance = new Essentia(EssentiaWASM);
  return essentiaInstance;
}

async function decodeToMono(file) {
  const arrayBuffer = await file.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    const channels = buffer.numberOfChannels;
    const length = buffer.length;
    const mono = new Float32Array(length);
    for (let c = 0; c < channels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) mono[i] += data[i] / channels;
    }
    return mono;
  } finally {
    ctx.close();
  }
}

// Returns null on any failure so the caller can fall back to the
// simpler heuristic -- this is a real library with real edge cases
// (odd sample rates, very short/long clips, WASM load hiccups).
export async function analyzeAudioEssentia(file) {
  try {
    const essentia = await getEssentia();
    const mono = await decodeToMono(file);
    const vectorSignal = essentia.arrayToVector(mono);

    const bpmResult = essentia.PercivalBpmEstimator(vectorSignal);
    const bpm = Math.round(bpmResult.bpm);

    const loudnessResult = essentia.Loudness(vectorSignal);
    // Essentia's Loudness is on a dB-ish scale, roughly -60 (quiet) to 0 (loud)
    // for typical mastered music -- normalized here into a 0-1 energy score.
    // Worth spot-checking against a few of your own songs and adjusting
    // the -60/60 constants if it skews consistently high or low.
    const energy = Math.min(
      1,
      Math.max(0, (loudnessResult.loudness + 60) / 60),
    );

    return { bpm, energy, analyzed: true };
  } catch (e) {
    console.warn(
      "Essentia analysis failed, will fall back to heuristic:",
      e.message,
    );
    return null;
  }
}
