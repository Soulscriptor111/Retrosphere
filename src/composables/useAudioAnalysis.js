import { analyzeAudioEssentia } from "./useEssentia";

// --- Fallback heuristic (used only if Essentia fails to load/analyze) ---

function mixToMono(buffer) {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const mono = new Float32Array(length);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) mono[i] += data[i] / channels;
  }
  return mono;
}

function normalizePeak(mono) {
  let peak = 0;
  for (let i = 0; i < mono.length; i++) {
    const abs = Math.abs(mono[i]);
    if (abs > peak) peak = abs;
  }
  if (peak === 0) return mono;
  const scale = 1 / peak;
  const out = new Float32Array(mono.length);
  for (let i = 0; i < mono.length; i++) out[i] = mono[i] * scale;
  return out;
}

function estimateEnergy(mono) {
  let sumSquares = 0;
  for (let i = 0; i < mono.length; i++) sumSquares += mono[i] * mono[i];
  const rms = Math.sqrt(sumSquares / mono.length);
  if (rms < 0.15) return 0.2;
  if (rms > 0.45) return 0.9;
  return (rms - 0.15) / 0.3;
}

function buildOnsetEnvelope(mono, sampleRate) {
  const hop = 1024;
  const hops = Math.floor(mono.length / hop);
  const envelope = new Float32Array(hops);
  for (let h = 0; h < hops; h++) {
    let sum = 0;
    const start = h * hop;
    for (let i = 0; i < hop; i++) {
      const s = mono[start + i];
      sum += s * s;
    }
    envelope[h] = Math.sqrt(sum / hop);
  }
  const onset = new Float32Array(hops);
  for (let h = 1; h < hops; h++) {
    onset[h] = Math.max(0, envelope[h] - envelope[h - 1]);
  }
  return { onset, hopSeconds: hop / sampleRate };
}

function estimateBpmFromOnsets(onset, hopSeconds) {
  const minBpm = 60;
  const maxBpm = 180;
  const minLag = Math.round(60 / maxBpm / hopSeconds);
  const maxLag = Math.round(60 / minBpm / hopSeconds);

  if (onset.length < maxLag * 2) return 100;

  let bestLag = minLag;
  let bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    for (let i = 0; i < onset.length - lag; i++) {
      score += onset[i] * onset[i + lag];
    }
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  return Math.round(60 / (bestLag * hopSeconds));
}

async function decodeToBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    return await ctx.decodeAudioData(arrayBuffer);
  } finally {
    ctx.close();
  }
}

async function analyzeAudioHeuristic(file) {
  try {
    const buffer = await decodeToBuffer(file);
    const mono = normalizePeak(mixToMono(buffer));
    const energy = estimateEnergy(mono);
    const { onset, hopSeconds } = buildOnsetEnvelope(mono, buffer.sampleRate);
    const bpm = estimateBpmFromOnsets(onset, hopSeconds);
    return { bpm, energy, analyzed: true };
  } catch (e) {
    console.warn(
      "Heuristic audio analysis failed, using neutral defaults:",
      e.message,
    );
    return { bpm: 100, energy: 0.5, analyzed: false };
  }
}

// --- Public entry point: Essentia first, heuristic as fallback ---
export async function analyzeAudio(file) {
  const essentiaResult = await analyzeAudioEssentia(file);
  if (essentiaResult) return essentiaResult;
  return analyzeAudioHeuristic(file);
}
