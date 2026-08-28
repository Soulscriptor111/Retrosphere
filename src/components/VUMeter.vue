<script setup>
defineProps({
  levels: {
    type: Array,
    default: () => new Array(16).fill(0),
  },
})
</script>

<template>
  <div class="flex items-end gap-[3px] h-10 px-2">
    <div
      v-for="(lvl, i) in levels"
      :key="i"
      class="w-[5px] rounded-sm transition-all duration-100 ease-organic"
      :class="lvl > 0.05 ? 'led-on' : ''"
      :style="{
        height: `${Math.max(8, lvl * 100)}%`,
        background: lvl > 0.75
          ? '#F5A623'
          : lvl > 0.4
            ? '#C9A84C'
            : 'rgba(245,166,35,0.35)',
      }"
    />
  </div>
</template>
