<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import TopItem from '@/components/overview/TopItem.vue'

type Item = {
  id: string
  thumbnail?: string
  title?: string
}

const REMOTE_THUMB = 'https://i.ytimg.com/vi/3IZ_5iJkbM4/hqdefault.jpg'

const items: Item[] = Array.from({ length: 10 }).map((_, i) => ({
  id: String(i + 1),
  thumbnail: REMOTE_THUMB,
  title: `Top item ${i + 1}`,
}))

const track = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(true)

function updateScrollButtons() {
  if (!track.value) return
  const el = track.value
  canScrollLeft.value = el.scrollLeft > 10
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 10
}

function scrollByDirection(dir: number) {
  if (!track.value) return
  const amount = Math.max(240, track.value.clientWidth * 0.6)
  track.value.scrollBy({ left: dir * amount, behavior: 'smooth' })
}

function onTrackKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    scrollByDirection(1)
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    scrollByDirection(-1)
  }
}

onMounted(() => {
  updateScrollButtons()
  const el = track.value
  if (!el) return
  el.addEventListener('scroll', updateScrollButtons, { passive: true })
  window.addEventListener('resize', updateScrollButtons)
})

onBeforeUnmount(() => {
  const el = track.value
  if (el) el.removeEventListener('scroll', updateScrollButtons)
  window.removeEventListener('resize', updateScrollButtons)
})
</script>

<template>
  <div class="top10-list">
    <button
      class="nav left"
      @click="scrollByDirection(-1)"
      :disabled="!canScrollLeft"
      :aria-disabled="!canScrollLeft"
      aria-label="Scroll left"
    >
      ‹
    </button>

    <div class="track" ref="track" role="list" tabindex="0" @keydown="onTrackKeydown">
      <div class="track-item" v-for="(item, i) in items" :key="item.id" role="listitem">
        <TopItem :rank="i + 1" :thumbnail="item.thumbnail" :id="item.id" :name="item.title" />
      </div>
    </div>

    <button
      class="nav right"
      @click="scrollByDirection(1)"
      :disabled="!canScrollRight"
      :aria-disabled="!canScrollRight"
      aria-label="Scroll right"
    >
      ›
    </button>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.top10-list {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}

.track {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  display: flex;
  gap: 12px;
  padding: 8px 0;
  width: 100%;

  scrollbar-width: none;
  -ms-overflow-style: none;
}
.track::-webkit-scrollbar {
  display: none;
  height: 0;
}

.track-item {
  flex: 0 0 auto;
  scroll-snap-align: start;
  width: 260px;
}

.nav {
  background: transparent;
  color: $white;
  border: none;
  width: 48px;
  height: 80px;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
}

.nav.left {
  justify-self: start;
}

.nav.right {
  justify-self: end;
}

.nav:focus {
  outline: 2px solid rgba(255, 255, 255, 0.12);
}

.nav[disabled] {
  opacity: 0.45;
  cursor: default;
  pointer-events: none;
}

@media (max-width: 720px) {
  .track-item {
    width: 200px;
  }

  .nav {
    width: 40px;
    height: 64px;
    font-size: 1.25rem;
  }
}
</style>
