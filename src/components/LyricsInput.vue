<script setup>
import { ref } from "vue";
import { parseLrc } from "../composables/useLrcParser";

const emit = defineEmits(["save"]);
const pasted = ref("");
const fileRef = ref(null);

async function onLrcFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  const lrcLines = parseLrc(text);
  emit("save", { lrcLines, lyrics: "" });
  e.target.value = "";
}

function savePasted() {
  if (!pasted.value.trim()) return;
  emit("save", { lyrics: pasted.value, lrcLines: [] });
  pasted.value = "";
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <button
        @click="fileRef.click()"
        class="text-[11px] font-mono px-3 py-1.5 rounded bg-wood border border-brass/50 text-cream"
      >
        Upload .lrc
      </button>
      <input
        ref="fileRef"
        type="file"
        accept=".lrc"
        class="hidden"
        @change="onLrcFile"
      />
    </div>

    <textarea
      v-model="pasted"
      placeholder="Or paste plain lyrics here..."
      rows="3"
      class="w-full text-[12px] font-mono rounded p-2 bg-wood-dark/40 text-cream placeholder:text-cream/30 border border-brass/20"
    />
    <button
      @click="savePasted"
      class="text-[11px] font-mono px-3 py-1.5 rounded bg-brass text-wood-dark"
    >
      Save lyrics
    </button>
  </div>
</template>
