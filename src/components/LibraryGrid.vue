<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePlayerStore } from '../stores/playerStore.js'
import AlbumCard from './AlbumCard.vue'

const store = usePlayerStore()

const BATCH_SIZE = 8
const revealCount = ref(Math.min(BATCH_SIZE, store.library.length))
const sentinel = ref(null)
let observer = null

const visibleAlbums = computed(() => store.library.slice(0, revealCount.value))
const hasMore = computed(() => revealCount.value < store.library.length)

onMounted(() => {
  // Only lazily reveal when the crate grows beyond a first screenful.
  if (store.library.length <= 20) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore.value) {
        revealCount.value = Math.min(revealCount.value + BATCH_SIZE, store.library.length)
      }
    },
    { rootMargin: '200px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

function handleSelect(album) {
  store.selectAlbum(album)
}
</script>

<template>
  <section aria-label="Album library" class="w-full">
    <h2 class="mb-3 font-display text-lg font-semibold text-cream/90 sm:text-xl">
      The Record Crate
    </h2>
    <div
      class="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4"
      role="list"
      aria-label="Album library"
    >
      <div v-for="album in visibleAlbums" :key="album.id" role="listitem">
        <AlbumCard
          :album="album"
          :is-active="store.currentAlbum?.id === album.id"
          @select="handleSelect"
        />
      </div>
    </div>
    <div v-if="hasMore" ref="sentinel" class="h-4 w-full" aria-hidden="true"></div>
  </section>
</template>
