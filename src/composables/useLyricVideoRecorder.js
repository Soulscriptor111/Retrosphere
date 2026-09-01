import { ref } from "vue";
import { activeLrcIndex } from "./useLrcParser";

// Full HD portrait -- suitable for sharing on phones/socials.
const WIDTH = 1080;
const HEIGHT = 1920;

// Colors matched to the real LyricsPaper component's aged-paper look.
const PAPER_BG = "#E8D5B8";
const INK_ACTIVE = "#3D2C1F";
const INK_FADED = "rgba(61,44,31,0.35)";
const INK_ARTIST = "#8a6d3b";

// canvas fillText's maxWidth argument SQUISHES text horizontally to force
// it to fit, rather than wrapping like CSS does -- that squish is what
// made longer lines look visually off. This wraps properly instead.
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrapped(ctx, text, centerX, centerY, maxWidth, lineGap) {
  const lines = wrapLines(ctx, text, maxWidth);
  const totalHeight = (lines.length - 1) * lineGap;
  const startY = centerY - totalHeight / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, centerX, startY + i * lineGap);
  });
  return lines.length;
}

function pickBestMimeType() {
  const candidates = [
    "video/mp4;codecs=avc1,mp4a",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

export function useLyricVideoRecorder({ getAudioStream }) {
  const isRecording = ref(false);
  const recordedUrl = ref(null);
  const recordedMimeType = ref("");
  const error = ref(null);

  let canvas = null;
  let ctx = null;
  let rafId = null;
  let mediaRecorder = null;
  let chunks = [];
  let getFrameData = null;

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx = canvas.getContext("2d");
  }

  function drawFrame() {
    const data = getFrameData();
    if (data) {
      const { lrcLines, plainLyrics, currentTime, title, artist } = data;
      const maxTextWidth = WIDTH - 160;

      ctx.fillStyle = PAPER_BG;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.textAlign = "center";
      ctx.fillStyle = INK_ACTIVE;
      ctx.font = "600 52px Georgia, serif";
      drawWrapped(ctx, title || "", WIDTH / 2, 120, WIDTH - 120, 60);

      ctx.font = '32px "Courier New", monospace';
      ctx.fillStyle = INK_ARTIST;
      ctx.fillText((artist || "").toUpperCase(), WIDTH / 2, 210);

      const centerY = HEIGHT / 2;
      const lineHeight = 84;

      if (lrcLines && lrcLines.length) {
        const activeIndex = activeLrcIndex(lrcLines, currentTime);
        const visibleSpan = 6;
        const boldFont = '600 46px "Courier New", monospace';
        const normalFont = '36px "Courier New", monospace';

        const flat = [];
        for (let offset = -visibleSpan; offset <= visibleSpan; offset++) {
          const idx = activeIndex + offset;
          if (idx < 0 || idx >= lrcLines.length) continue;
          const isActive = idx === activeIndex;
          ctx.font = isActive ? boldFont : normalFont;
          const wrapped = wrapLines(
            ctx,
            lrcLines[idx].text || "♪",
            maxTextWidth,
          );
          for (const line of wrapped) flat.push({ text: line, isActive });
        }

        const activeRows = flat
          .map((f, i) => (f.isActive ? i : null))
          .filter((i) => i !== null);
        const activeCenter = activeRows.length
          ? (activeRows[0] + activeRows[activeRows.length - 1]) / 2
          : 0;
        const startY = centerY - activeCenter * lineHeight;

        flat.forEach((f, i) => {
          const y = startY + i * lineHeight;
          if (y < 260 || y > HEIGHT - 100) return;
          ctx.font = f.isActive ? boldFont : normalFont;
          ctx.fillStyle = f.isActive ? INK_ACTIVE : INK_FADED;
          ctx.fillText(f.text, WIDTH / 2, y);
        });
      } else if (plainLyrics) {
        ctx.font = '34px "Courier New", monospace';
        ctx.fillStyle = "rgba(61,44,31,0.7)";
        let y = 320;
        for (const rawLine of plainLyrics.split("\n").slice(0, 14)) {
          const wrapped = wrapLines(ctx, rawLine, maxTextWidth);
          for (const line of wrapped) {
            if (y > HEIGHT - 100) break;
            ctx.fillText(line, WIDTH / 2, y);
            y += 54;
          }
        }
      } else {
        ctx.font = "italic 38px Georgia, serif";
        ctx.fillStyle = "rgba(61,44,31,0.4)";
        ctx.fillText("No lyrics available", WIDTH / 2, centerY);
      }
    }

    rafId = requestAnimationFrame(drawFrame);
  }

  async function startRecording(frameDataFn) {
    error.value = null;
    recordedUrl.value = null;
    getFrameData = frameDataFn;
    ensureCanvas();

    const videoStream = canvas.captureStream(30);
    let audioStream = null;
    try {
      audioStream = getAudioStream();
    } catch (e) {
      console.warn("No audio stream available for recording:", e.message);
    }

    const tracks = [...videoStream.getVideoTracks()];
    if (audioStream) tracks.push(...audioStream.getAudioTracks());
    const combined = new MediaStream(tracks);

    const mimeType = pickBestMimeType();
    recordedMimeType.value = mimeType || "video/webm";

    try {
      mediaRecorder = mimeType
        ? new MediaRecorder(combined, { mimeType })
        : new MediaRecorder(combined);
    } catch (e) {
      error.value = "Video recording is not supported in this browser.";
      return;
    }

    chunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: recordedMimeType.value });
      recordedUrl.value = URL.createObjectURL(blob);
    };

    drawFrame();
    mediaRecorder.start();
    isRecording.value = true;
  }

  function stopRecording() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    isRecording.value = false;
  }

  return {
    isRecording,
    recordedUrl,
    recordedMimeType,
    error,
    startRecording,
    stopRecording,
  };
}
